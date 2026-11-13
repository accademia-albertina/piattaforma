import type { GlobalConfig } from 'payload'

/**
 * Collegamento a Google Drive (account noreply@): refresh token cifrato e stato.
 * Mai leggibile o modificabile dall'API, nemmeno dagli admin: lo usano solo il server
 * (overrideAccess) e la pagina /admin/drive. Nascosto dal menu del pannello.
 */
export const DriveConnessione: GlobalConfig = {
  slug: 'drive-connessione',
  label: 'Google Drive',
  admin: { hidden: true },
  access: { read: () => false, update: () => false },
  fields: [
    { name: 'email', type: 'text' },
    { name: 'tokenCifrato', type: 'text' },
    { name: 'collegatoIl', type: 'date' },
    { name: 'collegatoDa', type: 'text' },
    /** ID della sottocartella "media" dentro DRIVE_ID, per non cercarla a ogni caricamento. */
    { name: 'cartellaMedia', type: 'text' },
    /** Per quale DRIVE_ID vale cartellaMedia: se l'ID cambia la sottocartella si ricrea. */
    { name: 'cartellaRadice', type: 'text' },
    /** Ultimo errore (es. token revocato): la pagina chiede di ricollegare. */
    { name: 'errore', type: 'text' },
  ],
}
