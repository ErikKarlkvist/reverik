# Highai

PoC: en Electron-app som med hjälp av Claude analyserar dataflöden i en kodbas
och visar dem som ett animerat sekvensdiagram.

Man kopplar appen till ett lokalt repo, ställer en fråga som
"Visa vad som händer när man klickar på lägg till i varukorg", och får en graf
där requests spelas upp steg för steg. Varje nod och kant pekar på fil och rad
i koden.

Se [PLAN.md](PLAN.md) för arbetsplanen.

## Kom igång

```bash
cp .env.example .env   # fyll i ANTHROPIC_API_KEY
npm install
npm run dev
```
