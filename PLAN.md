# Arbetsplan (PoC)

Målet är en fungerande demo, inte en produkt. Varje del ska gå att köra och
visa upp för sig. Ordningen är vald så att UI:t kan byggas mot fixture-data
innan AI-delen finns, och så att AI-delen kan testas i terminalen innan den
kopplas in i UI:t.

## Status 2026-09-25

Del 0 till 3 är klara. Appen startar, kopplar repo, visar sparade och inbyggda
analyser, ritar flöden i tre nivåer med uppspelning, kodutdrag och tabeller.
Nästa steg är Del 4, själva AI-analysen. Det som redan finns att bygga på:

- `validateFlow()` i `src/common/model/flow.ts` ger läsbara fel att skicka tillbaka till modellen
- `saveAnalysisChannel` i `src/features/analysis/ipc/channels.ts` sparar ett färdigt flöde
- `defineEvent`/`emitEvent` i common för att strömma framsteg från main till renderer
- Fliken Logg i nedre panelen är tom och väntar på analysens verktygsanrop
- `.env.example` visar nyckeln, `requireEnv()` i `src/application/main/env.ts` läser den
- Fixturerna i `src/common/model/fixtures/` visar exakt vad modellen ska producera,
  inklusive `systems`, `system` per nod, `tables` med nycklar och `tables` på kanter

## Avgränsningar

- Statisk analys: AI:n läser koden och förutspår flödet. Ingen runtime-tracing.
- Ett repo åt gången.
- Ingen inloggning, ingen molnlagring. API-nyckel läses från `.env`.
- Endast macOS behöver fungera.

## Stack

- Electron + Vite + React + TypeScript (electron-vite)
- `@xyflow/react` (React Flow) för grafen, `elkjs` eller `dagre` för layout
- `@anthropic-ai/claude-agent-sdk` i main-processen för analysen
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

## Del 4: AI-analys

Mål: en riktig fråga mot ett riktigt repo ger en `Flow`.

Ny feature `analysis` finns redan med lagring och lista. AI-delen läggs i samma
feature: `model/` för prompt och tolkning, `main/` för agentloopen, `ipc/` för
kanal och framstegshändelse, `renderer/` för frågefältet.

- [ ] CLI-skript först (`npm run analyze -- <repo> "<fråga>"`) för snabb iteration mot `demo/todo-app`
- [ ] Agentloop med Claude Agent SDK i main: verktygen Read, Grep, Glob mot repots rot, respektera `.gitignore`
- [ ] Eget verktyg `emit_flow` som tar en `Flow`, körs genom `validateFlow()`, fel skickas tillbaka till modellen
- [ ] Systemprompt på engelska: följ från UI-händelse till backend till lagring, ange fil och rad på allt,
      gruppera noder i `systems`, beskriv tabeller med nycklar, ange `tables` på anrop mot lagring
- [ ] Verifiera att varje `source` faktiskt finns i repot (jämför `readSource`), stryk eller markera det som inte gör det
- [ ] Spara resultatet via `AnalysisStore` och välj det i listan
- [ ] Frågefält i sidopanelen under repot, avbryt-knapp
- [ ] Strömma verktygsanrop till fliken Logg via `emitEvent` så man ser vad AI:n läser
- [ ] Mock-bryggan: svara på analyskanalen med en fixture efter en fördröjning så UI:t går att titta på i webbläsare

## Del 5: Putsning för demo

- [x] Spara analyser per repo, lista och ladda tidigare analyser. Demot har inbyggda grundanalyser.
- [ ] Felhantering: saknad nyckel, rate limit, tomt resultat
- [ ] Kostnad och tokens visas efter analys
- [x] Demo-repo i `demo/todo-app`: React-frontend, Express-backend, Postgres, Redis, webhook

## Senare, utanför PoC

- Runtime-tracing via OpenTelemetry, riktiga requests i stället för förutspådda
- Jämför förutspått flöde mot faktiskt
- Flera repon i samma flöde (frontend och backend i olika repon)
- Exportera som bild eller Mermaid
