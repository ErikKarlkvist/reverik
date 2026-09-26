# Arbetsplan (PoC)

Målet är en fungerande demo, inte en produkt. Varje del ska gå att köra och
visa upp för sig. Ordningen är vald så att UI:t kan byggas mot fixture-data
innan AI-delen finns, och så att AI-delen kan testas i terminalen innan den
kopplas in i UI:t.

## Status 2026-09-25

Del 0 till 3 är klara, och Del 4 har bytt form: i stället för en egen agentloop
mot API:t kör användaren valfri AI-agent (Claude Code, Codex, Aider) i en
terminalpanel i appen. Appen och agenten pratar via filer i repot:

- Appen skriver `.reverik/README.md` i repot när det öppnas. Den beskriver schemat,
  reglerna och ett komplett exempel, och säger åt agenten att skriva flöden till
  `.reverik/flows/<namn>.json`.
- Main bevakar mappen. Varje sparad fil valideras med `validateFlow()`, källhänvisningarna
  kontrolleras mot repot (fil finns, raden finns), och resultatet sparas via
  `AnalysisStore` och väljs i listan. Avvisade filer får felen skrivna till
  `<namn>.errors.json` bredvid sig så agenten kan läsa och rätta.
- Frågefältet under terminalen skickar frågan till programmet som kör där, med en
  uppmaning att först läsa guiden.

Det som återstår är att prova mot riktiga repon och putsa guiden efter vad
agenterna faktiskt gör fel.

## Avgränsningar

- Statisk analys: AI:n läser koden och förutspår flödet. Ingen runtime-tracing.
- Ett repo åt gången.
- Ingen inloggning, ingen molnlagring, ingen egen API-nyckel. AI:n körs i terminalen med
  användarens egen inloggning.
- Endast macOS behöver fungera.

## Stack

- Electron + Vite + React + TypeScript (electron-vite)
- `@xyflow/react` (React Flow) för grafen, `elkjs` eller `dagre` för layout
- `node-pty` i main och `@xterm/xterm` i renderern för terminalen
- `zod` för att validera grafen AI:n producerar
- `simple-git` för att läsa branch och fillista ur repot

## Del 0: Skelett

Mål: appen startar, renderer och main pratar via IPC, nyckeln läses från `.env`.

- [x] Scaffolda med electron-vite (React + TS)
- [x] Ladda `.env` i main, aldrig exponera nyckeln till renderer
- [x] Typad IPC-brygga via preload (`window.api`) och `defineChannel`
- [x] Kodstandard: strikt tsconfig, ESLint med arkitekturgränser, Prettier, husky pre-commit, Vitest
- [x] Enkel layout: sidopanel (repo + fråga), huvudyta (graf), nedre panel (logg/kod)

## Del 1: Koppla repo

Mål: användaren väljer ett lokalt repo och appen vet var koden ligger. Kloning av
git-URL:er är bortvalt, repot ska redan finnas på disk.

- [x] Välj lokal mapp via systemdialog
- [x] Visa grundinfo: sökväg, branch, antal filer, dominerande språk
- [x] Kom ihåg senaste repon (JSON i userData)
- [x] Respektera `.gitignore` när filer räknas (via `git ls-files`), senare även när AI:n söker

## Del 2: Grafschema och fixture

Mål: ett fast kontrakt mellan AI och UI, så att delarna kan byggas oberoende.

- [x] Definiera `Flow` i `src/common/model/flow.ts` med zod:
  - `nodes[]`: `id`, `kind` (ui, handler, http, service, db, external, queue), `label`, `source` (fil, rad)
  - `edges[]`: `id`, `from`, `to`, `label`, `payload`, `response`, `source`
  - `steps[]`: ordnad lista av `edgeId` + beskrivning, det är detta som spelas upp
  - `question`, `title`, `summary`
  - `validateFlow()` kontrollerar även referenser och dubbletter och ger läsbara fel för modellen
- [x] Handgjorda fixturer i `src/common/model/fixtures/` för demo-appen, med källhänvisningar som testas mot riktiga filer
- [x] Validera fixturen i ett test

## Del 3: Visualisering och uppspelning

Mål: fixturen renderas snyggt och kan spelas upp steg för steg.

- [x] Rendera `Flow` i React Flow med egen nod-komponent per `kind`
- [x] Automatisk layout med dagre, vänster till höger, svar ritas tillbaka
- [x] Hover eller klick på kant visar `payload` och `response`
- [x] Uppspelning: play, paus, steg, scrubber. Aktiv kant får en puls, kommande tonas ner
- [x] Aktivt steg och klick på nod eller kant visar kodutdrag i nedre panelen
- [x] Tomt läge när ingen analys finns
- [x] Systemvy först: en nod per applikation med ikon per typ. Klick zoomar in i systemet med grannarna kvar i kanten. Detaljvyn grupperar noder per system. Interna steg spelas bara upp när man är inzoomad.
- [x] Hover på databas och cache visar tabeller, kolumner och vilka anrop i flödet som rör dem
- [x] Inzoomad databas visas som ER-diagram: en ruta per tabell med primär- och främmande nycklar, relationslinjer, och flödets anrop pekar på rätt tabell
- [x] Sidopanelens bredd och nedre panelens höjd går att dra i, sparas i localStorage

## Del 4: AI-analys via terminal

Mål: en riktig fråga mot ett riktigt repo ger en `Flow`, oavsett vilken AI-agent
användaren har.

Terminalen är en egen feature `terminal`. Inkorgen och guiden ligger i `analysis`:
`model/guide.ts` bygger `.reverik/README.md`, `main/inbox.ts` bevakar och importerar,
`main/verify.ts` kontrollerar källhänvisningar.

- [x] Terminalpanel till höger: xterm.js i renderern, node-pty i main, inloggningsskal i repots rot
- [x] Guiden `.reverik/README.md` skrivs i repot när det öppnas, med schema, regler och exempel
- [x] Main bevakar `.reverik/flows/`, validerar med `validateFlow()` och verifierar att varje
      `source` finns i repot
- [x] Accepterade flöden sparas via `AnalysisStore` och väljs i listan. Samma filnamn
      ersätter den tidigare analysen
- [x] Avvisade flöden får felen skrivna till `<namn>.errors.json` så agenten kan rätta
- [x] Fliken Logg visar importer och avvisningar, sidopanelen visar senaste avvisningen
- [x] Frågefält under terminalen som skickar frågan till agenten med hänvisning till guiden
- [x] Mock-bryggan svarar med ett låtsasskal så terminalpanelen går att titta på i webbläsaren
- [ ] Prova mot ett par riktiga repon och justera guiden efter vad agenterna gör fel
- [ ] Knapp som startar `claude` direkt i terminalen

## Del 5: Putsning för demo

- [x] Spara analyser per repo, lista och ladda tidigare analyser. Demot har inbyggda grundanalyser.
- [x] Felhantering: avvisade flöden visas i appen och skrivs tillbaka till agenten
- [x] Demo-repo i `demo/todo-app`: React-frontend, Express-backend, Postgres, Redis, webhook

## Senare, utanför PoC

- Runtime-tracing via OpenTelemetry, riktiga requests i stället för förutspådda
- Jämför förutspått flöde mot faktiskt
- Flera repon i samma flöde (frontend och backend i olika repon)
- Exportera som bild eller Mermaid
