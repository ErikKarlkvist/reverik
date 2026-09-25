# Highai

PoC: Electron-app som låter Claude analysera dataflöden i en kodbas och visar dem
som animerade sekvensdiagram. Arbetsplan i PLAN.md.

## Kommandon

- `npm run dev` startar appen med hot reload
- `npm run check` kör typecheck, lint, format-check och test, samma som CI bör köra
- `npm run test` kör Vitest

Pre-commit-hooken (husky + lint-staged) kör eslint --fix och prettier på staged filer,
sedan `tsc -b` och testerna. Committa inte med `--no-verify`.

## Arkitektur: feature slicing

```
src/
  application/   ihopkoppling. main/ (Electron-entry, fönster), preload/, renderer/ (App, layout), ipc/
  common/        delat och beroendefritt gentemot features. model/, ipc/, main/, renderer/
  features/      en mapp per feature, se src/features/README.md
```

Samma lagernamn överallt: `model` och `ipc` är rena och körs i båda processerna,
`main` är node-sidan, `renderer` är React-sidan. Gränserna upprätthålls av
eslint-plugin-boundaries i eslint.config.js. Om lintern klagar på en import är det
arkitekturen som säger nej, inte lintern som är fel.

## IPC

Kanaler definieras med `defineChannel<Req, Res>('feature:namn')` i en features `ipc/`,
hanteras i main med `handleChannel` från `@/common/main/ipc` och anropas i renderer med
`invokeChannel` från `@/common/renderer/ipc`. Preload exponerar bara en generisk
`window.api.invoke`. API-nyckeln läses från `.env` i main och når aldrig renderer.

## Kodstil

- TypeScript strict med `noUncheckedIndexedAccess` och `exactOptionalPropertyTypes`
- Explicita returtyper på exporterade funktioner
- `import { type X }` för typimporter
- Ingen `console.log` i committad kod, `console.warn`/`error` är ok
- Svenska i UI-texter och kommentarer, engelska i identifierare
