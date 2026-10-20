# Piattaforma Accademia Albertina

Nuovo sito istituzionale dell’Accademia Albertina di Belle Arti di Torino, che sostituirà l’attuale sito WordPress.

**Stack:** Next.js 16 · Payload CMS 3 · PostgreSQL 16 · React Aria Components · Storybook 10 · TypeScript.

## Avvio in locale

Servono Node 22, pnpm 10 e Docker (oppure un PostgreSQL 16 già installato).

```bash
cp .env.example .env            # poi imposta PAYLOAD_SECRET (openssl rand -hex 32)
docker compose up -d postgres
pnpm install
pnpm dev                        # sito su http://localhost:3000, pannello su /admin
```

Il primo utente creato dal pannello diventa automaticamente amministratore.

## Comandi

| Comando | A cosa serve |
|---|---|
| `pnpm dev` | Sviluppo con ricaricamento automatico |
| `pnpm storybook` | Catalogo dei componenti su http://localhost:6006 |
| `pnpm lint` / `pnpm typecheck` | Controlli di stile, accessibilità del codice (jsx-a11y) e tipi |
| `pnpm test:int` | Test unitari, di accessibilità (axe) e dei permessi sul database |
| `pnpm test:e2e` | Test nel browser con verifica WCAG 2.1 AA |
| `pnpm payload migrate:create <nome>` | Crea una migrazione dopo aver cambiato le collezioni |
| `pnpm migrate` | Applica le migrazioni |
| `pnpm generate:types` | Rigenera `src/payload-types.ts` |

## Struttura

```
src/
  access/roles.ts        ruoli, regole dall'email istituzionale, controlli di accesso
  collections/           collezioni Payload (Users, Media, …)
  components/            componenti UI accessibili + storie Storybook
  styles/tokens.css      token del Design System (colori, tipografia, spaziature)
  app/(frontend)/        sito pubblico
  app/(payload)/         pannello di amministrazione e API (generati da Payload)
  migrations/            migrazioni del database
public/fonts/            Albert Sans servito in locale (licenza OFL)
tests/                   unit, int (database) ed e2e (Playwright + axe)
```

## Regole del progetto

- **Accessibilità:** WCAG 2.1 AA è un requisito, non un’opzione. Ogni colore di testo deve avere contrasto ≥ 4,5:1; i controlli devono essere usabili da tastiera e avere area ≥ 44px. La CI fallisce se axe trova violazioni.
- **Sicurezza:** permessi sempre controllati lato server nelle `access` di Payload; nessun segreto nel repository; dipendenze aggiornate da Dependabot e verificate da `pnpm audit` e CodeQL.
- **Database:** in sviluppo lo schema si allinea da solo; per la produzione ogni modifica alle collezioni richiede una migrazione.
- **Lingua:** interfaccia, contenuti e messaggi di commit in italiano.

### Avvisi di sicurezza ignorati

`pnpm audit` ignora solo avvisi senza correzione disponibile e non sfruttabili nel nostro uso, elencati in `package.json` → `pnpm.auditConfig.ignoreGhsas`:

- `GHSA-vfj7-8cjw-p6xm` (braces, via sass → chokidar): nessuna versione corretta esiste; il pacchetto serve solo a osservare file durante la compilazione degli stili e non riceve input dagli utenti.
