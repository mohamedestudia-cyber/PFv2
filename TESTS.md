# Verificació de Pantalla Focus

## Validació feta en aquesta entrega

Data: 2026-11-02

### Sintaxi i integració

- `node --check app.js` — PASS
- `node --check games-enhanced.js` — PASS
- `node --check server.mjs` — PASS
- `index.html` — comprovat que conté els quatre selectors de zona i els punts d'entrada de jocs.
- `games-enhanced.js` — comprovat que registra controls WASD/fletxes, espai per saltar, Shift per córrer, controls tàctils i entrada a zones.
- FocusIA — comprovat que usa `/api/health` i `/api/focusia`, amb timeout i missatges d'error explícits.
- Service Worker — actualitzat a `pantalla-focus-v5` per evitar cachejar una versió antiga.

### Mecàniques implementades

1. **Mapa central** amb quatre edificis/zones.
2. **Avatar personalitzable** amb quatre avatars.
3. **Moviment lliure** amb WASD/fletxes i botons tàctils.
4. **Córrer** amb Shift.
5. **Saltar** amb Espai o botó tàctil.
6. **Pantalla animada prèvia** abans de cada zona.
7. **Atenció:** objectius ◆ i distractors.
8. **Memòria numèrica:** seqüència que desapareix i teclat numèric.
9. **Memòria verbal:** llista + fase de recuperació.
10. **Seqüència visual:** patró tipus Simon Says amb quatre rondes segons dificultat.
11. **Pausa, reprendre i sortir.**
12. **Resultats persistents** a l'historial de Pantalla Focus.

## Prova de navegador

He intentat executar una prova real amb Chromium/Playwright sobre la còpia local. L'entorn d'execució ha bloquejat la navegació local (`ERR_BLOCKED_BY_ADMINISTRATOR` / tancament EPIPE del procés del navegador), de manera que **no seria honest afirmar que he pogut completar una prova interactiva real dins d'aquest entorn**.

Per tant, aquesta entrega només es presenta com a validada per sintaxi, inspecció d'integració i comprovació estàtica. No invento un resultat de navegador que no he pogut obtenir.

## FocusIA

El backend és un servidor Node/Express i la clau d'OpenAI només es llegeix a `server.mjs` des de `OPENAI_API_KEY`.

En Render, `render.yaml` està preparat perquè el mateix servei serveixi el frontend i `/api`, cosa que evita problemes de URL entre frontend i backend. Render assigna al servei una URL `onrender.com` quan el desplega. La configuració actual proposa el servei `pantalla-focus-api`. citeturn302562search1turn302562search3

**Limitació externa:** no puc crear el servei dins del compte de Render de l'usuari ni introduir-hi una clau privada d'OpenAI des d'aquest ZIP. Per això la connexió real a OpenAI només queda verificable després del desplegament i de configurar `OPENAI_API_KEY`.
