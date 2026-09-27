# Reverik

PoC: en Electron-app som visar dataflöden i en kodbas som animerade
sekvensdiagram, och reviewar ändringar mot dem.

Man kopplar appen till ett lokalt repo och kör valfri AI-agent, till exempel
Claude Code, i terminalpanelen. Agenten får en guide som beskriver hur den
levererar flöden och reviewer som JSON till `.reverik/` i repot, appen bevakar
mappen och ritar upp resultatet. Varje nod och anrop pekar på fil och rad.

I `demo/todo-app` finns en liten app att analysera: React-frontend,
Express-backend, Postgres och Redis, med inbyggda analyser och en demo-review.

## Kom igång

```bash
npm install
npm run dev
```

Ingen API-nyckel behövs, agenten i terminalen använder sin egen inloggning.
Se CLAUDE.md för kommandon, arkitektur och kodstil.
