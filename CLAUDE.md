# Note per Claude

Progetto: rifacimento del sito dell'Accademia Albertina (Next.js + Payload CMS 3 + PostgreSQL). Sviluppano Fede e Claude; due admin testano e gestiscono contenuti. Leggi `README.md` per comandi e struttura.

- Scrivi interfaccia, commenti e commit in italiano.
- Colori, spaziature e tipografia solo tramite le variabili in `src/styles/tokens.css`. Non introdurre colori nuovi senza verificarne il contrasto (≥ 4,5:1 per il testo).
- Componenti interattivi: usa React Aria Components; ogni componente nuovo ha una storia in Storybook e un test con axe in `tests/unit`.
- Permessi: usa gli helper di `src/access/roles.ts`; i campi sensibili (es. `roles`) hanno access a livello di campo. Aggiungi test in `tests/int` per ogni nuova regola.
- Dopo aver modificato una collezione: `pnpm generate:types` e `pnpm payload migrate:create <nome>`.
- Prima di aprire una PR: `pnpm lint && pnpm typecheck && pnpm test:int`.
- Login previsto: solo SSO Google Workspace `@albertina.academy` (12345t@ triennio, 12345b@ biennio, nome.cognome@ personale). Niente SPID/CIE.
