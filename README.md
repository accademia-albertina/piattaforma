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
| `pnpm guida:schermate` | Rifà le schermate della Guida del pannello (sito in locale avviato, vedi `scripts/guida/`) |

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
  seed/                  contenuti demo pubblici per l'anteprima online
  proxy.ts               password dell'anteprima online (attiva solo con ANTEPRIMA_PASSWORD)
public/fonts/            Albert Sans servito in locale (licenza OFL)
tests/                   unit, int (database) ed e2e (Playwright + axe)
```

## Anteprima online (Render)

Serve a far provare il sito agli admin prima della messa in produzione. Contiene solo contenuti pubblici (`src/seed/`), nessun dato personale. La configurazione è in `render.yaml`: server e database a Francoforte, disco per i file, password del browser, contenuti demo al primo avvio.

1. Su [render.com](https://render.com) crea un account con l’email dell’ente e collega GitHub (organizzazione `accademia-albertina`, solo il repo `piattaforma`).
2. **New → Blueprint** → scegli `piattaforma`, branch `main`. Render legge `render.yaml` e chiede due valori:
   - `NEXT_PUBLIC_SERVER_URL`: `https://albertina-anteprima.onrender.com` (se Render assegna un nome diverso, correggilo dopo in *Environment* e rifai il deploy);
   - `ANTEPRIMA_PASSWORD`: la password da dare agli admin.
3. **Apply.** Il primo deploy dura qualche minuto; le migrazioni e i contenuti demo partono da soli.
4. Apri l’indirizzo (utente `albertina` + la password), vai su `/admin` e crea il primo utente: diventa amministratore.

Ogni push su `main` aggiorna l’anteprima (con il disco collegato il sito resta offline per qualche secondo durante l’aggiornamento). Per azzerare i contenuti demo svuota il database: al riavvio vengono ricaricati.

## Accesso con Google

Si entra solo con un account Google Workspace `@albertina.academy` (flusso OAuth 2.0 / OpenID Connect con PKCE, codice in `src/auth/`). L’account viene creato al primo accesso:

- **studenti** (`12345t@`, `12345b@`): ruolo Studente automatico;
- **docenti**: se l’email coincide con un profilo attivo in *Docenti* non ancora collegato, ruolo Docente automatico e profilo collegato;
- **tutti gli altri** (personale, caselle d’ufficio): nessun ruolo, pagina `/accesso-in-attesa`; gli amministratori li trovano in *Da abilitare* sulla dashboard e assegnano il ruolo.

Con Google configurato il modulo con la password è nascosto (link “Accesso di emergenza”, `/admin/login?password=1`) e il server accetta la password solo dagli amministratori (`beforeLogin` in `Users`). Senza le variabili Google la password funziona per tutti, come in sviluppo.

Configurazione (una volta, da un account dell’organizzazione `albertina.academy` in [Google Cloud Console](https://console.cloud.google.com)):

1. Nuovo progetto “Sito Albertina” nell’organizzazione `albertina.academy`.
2. **Google Auth Platform** → nome app “Accademia Albertina”, pubblico **Interno** (solo account dell’Accademia).
3. **Client** → *Applicazione web*, URI di reindirizzamento autorizzati:
   - `https://albertina-anteprima.onrender.com/api/users/google/callback` (e quello di produzione quando ci sarà);
   - `http://localhost:3000/api/users/google/callback` per lo sviluppo.
4. Su Render (*Environment*) e nel `.env` locale: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. `NEXT_PUBLIC_SERVER_URL` deve essere l’indirizzo pubblico, perché da lì si calcola l’URI di ritorno.

## File su Google Drive

Immagini e PDF caricati nel pannello vanno in una cartella Drive dell’account `noreply@albertina.academy` (codice in `src/lib/drive/`, adattatore per `@payloadcms/plugin-cloud-storage`). Il sito li serve da `/api/media/file/<nome>` passando da una cache su disco (`DRIVE_CACHE_DIR`, `DRIVE_CACHE_MB`), senza link pubblici a Drive.

- Accesso con un client OAuth **Interno** separato da quello del login (`GOOGLE_DRIVE_CLIENT_ID`/`SECRET`, scope `auth/drive`, URI di reindirizzamento `…/api/drive/oauth/callback`). Niente account di servizio né delega a livello di dominio.
- `DRIVE_ID` è l’ID della cartella padre: una cartella del Mio Drive di noreply@ o un Drive condiviso (tutte le chiamate usano `supportsAllDrives`). Per passare al Drive condiviso basta cambiare l’ID e premere “Ricollega”: i file nuovi vanno nella sottocartella `media` del nuovo ID.
- Un amministratore apre **/admin/drive** (link “Google Drive” nella dashboard), preme “Collega Google Drive” ed entra come noreply@. Il refresh token è salvato nel database cifrato con AES-256-GCM (chiave da `PAYLOAD_SECRET`: se cambia, si ricollega).
- Senza collegamento, o se Drive non risponde, i file restano sul disco (`MEDIA_DIR`) come prima; “Sposta su Drive” li trasferisce dopo. I file eliminati finiscono nel cestino di Drive (30 giorni).

## Allineamento con il sito WordPress

Fino al passaggio, in **/admin/drive** due sezioni riallineano il nuovo sito ad albertina-academy.it (API REST pubblica, rilanciabili):

- **File dal sito WordPress** (`src/lib/wp-import/`): PDF e immagini su Drive, link riscritti nei contenuti.
- **Contenuti dal sito WordPress** (`src/lib/wp-import/contenuti/`): Albo online (pagine Breakdance lette dall’HTML), Amministrazione trasparente e avvisi (campi ACF esposti nell’API dal 14/11/2026). Ogni contenuto ha `wpId` e un’impronta: crea i nuovi, aggiorna i cambiati, salta gli invariati. Chi salva dal pannello un contenuto importato accende “Modificato nel pannello” e la sincronizzazione non lo tocca più (un admin può togliere la spunta per riallinearlo). Niente cancellazioni: gli elementi tolti da WordPress sono solo segnalati. Le pagine cambiate su WordPress dopo l’import si elencano, da riportare a mano.

In locale: `pnpm payload run scripts/wp/sincronizza-contenuti.ts [limite]`.

## Email (TurboSMTP)

Le email (conferme e annullamenti delle iscrizioni, recupero password) partono solo se `SMTP_HOST` è impostata.
Su Render: `SMTP_HOST=pro.eu.turbo-smtp.com`, `SMTP_PORT=465` (oppure 587), `SMTP_USER`, `SMTP_PASS` (chiave API dedicata alla piattaforma) e `EMAIL_MITTENTE` (anche nella forma `Accademia Albertina <noreply@albertina.academy>`).
Per provare in anteprima senza scrivere agli studenti imposta `EMAIL_SOLO_A`: tutte le email arrivano solo a quell'indirizzo.

- **Modello grafico:** `src/lib/email-modello.ts` (HTML a tabelle con stili in linea, colori del design system, logo allegato come immagine incorporata) più la versione solo testo.
- **Registro:** ogni invio, riuscito, fallito o non spedito perché SMTP è spento, finisce in *Email inviate* (gruppo Sistema, solo admin, in sola lettura). Le voci più vecchie di 30 giorni si cancellano da sole (al riavvio e al massimo una volta l'ora durante gli invii). I link con codici di accesso vengono oscurati.

## Limiti dei caricamenti

Chi non è admin carica al massimo 20 MB per le immagini e 10 MB per i PDF (`src/lib/limiti-upload.ts`); gli admin fino a 50 MB, tetto per tutti perché il file passa dalla memoria del server (512 MB su Render). `proxyClientMaxBodySize` in `next.config.ts` deve restare sopra questo tetto.

## Regole del progetto

- **Accessibilità:** WCAG 2.1 AA è un requisito, non un’opzione. Ogni colore di testo deve avere contrasto ≥ 4,5:1; i controlli devono essere usabili da tastiera e avere area ≥ 44px. La CI fallisce se axe trova violazioni.
- **Sicurezza:** permessi sempre controllati lato server nelle `access` di Payload; nessun segreto nel repository; dipendenze aggiornate da Dependabot e verificate da `pnpm audit` e CodeQL.
- **Database:** in sviluppo lo schema si allinea da solo; per la produzione ogni modifica alle collezioni richiede una migrazione.
- **Lingua:** interfaccia, contenuti e messaggi di commit in italiano.

### Avvisi di sicurezza ignorati

`pnpm audit` ignora solo avvisi senza correzione disponibile e non sfruttabili nel nostro uso, elencati in `package.json` → `pnpm.auditConfig.ignoreGhsas`:

- `GHSA-vfj7-8cjw-p6xm` (braces, via sass → chokidar): nessuna versione corretta esiste; il pacchetto serve solo a osservare file durante la compilazione degli stili e non riceve input dagli utenti.

## Licenza e riuso

Il codice è rilasciato con licenza [EUPL 1.2](LICENSE), la licenza consigliata da AgID per il software della pubblica amministrazione (CAD, art. 69). Puoi usarlo, modificarlo e ridistribuirlo: le versioni modificate che distribuisci devono restare con licenza compatibile.

Logo, stemma, icone delle scuole, fotografie e contenuti dell’Accademia Albertina **non** sono coperti dalla licenza del codice: restano dell’Accademia e degli autori. Chi riusa la piattaforma deve sostituirli con i propri.

Per segnalare una vulnerabilità leggi [SECURITY.md](SECURITY.md).
