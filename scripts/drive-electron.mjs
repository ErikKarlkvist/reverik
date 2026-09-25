// Styr Electron-renderern via Chrome DevTools-protokollet och rapporterar DOM-tillstånd.
// Starta appen med HIGHAI_DEBUG_PORT=9333 npm run dev, kör sedan node scripts/drive-electron.mjs.
const port = process.env.PORT ?? '9333';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.url.includes('localhost'));
      if (page) return page;
    } catch {
      // Electron har inte öppnat porten ännu
    }
    await sleep(1000);
  }
  throw new Error('Hittade ingen sida att koppla till');
}

const page = await targets();
console.log('Sida:', page.url);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  } else if (
    msg.method === 'Runtime.consoleAPICalled' ||
    msg.method === 'Runtime.exceptionThrown'
  ) {
    logs.push(JSON.stringify(msg.params).slice(0, 300));
  }
};
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (res.result?.exceptionDetails)
    throw new Error(JSON.stringify(res.result.exceptionDetails).slice(0, 500));
  return res.result?.result?.value;
};

await send('Runtime.enable');

const click = (selectorOrText) =>
  evaluate(`(() => {
  const byText = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(selectorOrText)} || b.getAttribute('aria-label') === ${JSON.stringify(selectorOrText)} || b.title === ${JSON.stringify(selectorOrText)});
  const el = byText ?? document.querySelector(${JSON.stringify(selectorOrText)});
  if (!el) return 'saknas: ' + ${JSON.stringify(selectorOrText)};
  el.click();
  return 'klickade: ' + (el.textContent.trim() || el.getAttribute('aria-label'));
})()`);
const state = () =>
  evaluate(`JSON.stringify({
  bottom: !!document.querySelector('.shell__bottom'),
  footerButton: document.querySelector('.shell__footer .text-button')?.textContent.trim() ?? null,
  logOpen: localStorage.getItem('highai.logOpen'),
  tabs: [...document.querySelectorAll('.shell__tab')].map(t => t.textContent.trim() + (t.getAttribute('aria-selected') === 'true' ? '*' : '') + (t.disabled ? '(av)' : '')),
  panelText: document.querySelector('.shell__bottom')?.textContent.trim().slice(0, 60) ?? null,
  viewport: [innerWidth, innerHeight],
  footerRect: JSON.stringify(document.querySelector('.shell__footer')?.getBoundingClientRect()),
  buttonRect: JSON.stringify(document.querySelector('.shell__footer .text-button')?.getBoundingClientRect()),
  elementAtButton: (() => { const b = document.querySelector('.shell__footer .text-button'); if (!b) return null; const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2); return e ? e.tagName + '.' + e.className : null; })(),
})`);

console.log('start', await state());
console.log(await click('Ladda demo'));
await sleep(800);
console.log(
  await evaluate(`[...document.querySelectorAll('.analyses__open')].length + ' analyser'`),
);
console.log(await click('.analyses__open'));
await sleep(1200);
console.log('efter analys', await state());
console.log(await click('Minimera panelen'));
await sleep(500);
console.log('efter minimera', await state());
console.log(await click('Visa panelen'));
await sleep(800);
console.log('efter visa', await state());
console.log(await click('Logg'));
await sleep(300);
console.log('efter fliken Logg', await state());
console.log(await click('Kod'));
await sleep(300);
console.log('efter fliken Kod', await state());
console.log('loggar:', logs.length ? logs.join('\n') : 'inga');
ws.close();
