import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'

import { isAdmin } from '@/access/roles'
import { accountDrive, driveConfigurato, idCartellaRadice } from '@/lib/drive/api'
import { driveCollegato, leggiStato } from '@/lib/drive/connessione'
import { fileSulDisco, statoSpostamento } from '@/lib/drive/sposta'

import PannelloDrive from './PannelloDrive'
import PassoPannello from './PassoPannello'

/** Pagina /admin/drive: collegamento a Google Drive dei file caricati (solo amministratori). */
export default async function Drive({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const admin = req.payload.config.routes.admin
  if (!req.user) redirect(`${admin}/login?redirect=${admin}/drive`)
  if (!isAdmin(req.user)) redirect(admin)

  const configurato = driveConfigurato()
  const mancanti = ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'DRIVE_ID'].filter(
    (v) => !process.env[v],
  )
  const stato = await leggiStato(req.payload)
  const collegato = Boolean(stato.tokenCifrato)

  // Verifica dal vivo: la cartella si raggiunge con il token salvato?
  let cartella: { nome?: string; condiviso?: boolean; errore?: string } = {}
  if (configurato && collegato) {
    try {
      const drive = await driveCollegato(req.payload)
      const info = await drive!.info(idCartellaRadice())
      cartella = { nome: info.name, condiviso: Boolean(info.driveId) }
    } catch (e) {
      cartella = { errore: (e as Error).message }
    }
  }
  const suDisco = await fileSulDisco(req.payload)

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      viewActions={req.payload.config.admin?.components?.actions}
      visibleEntities={visibleEntities}
    >
      <PassoPannello etichetta="Google Drive" />
      <Gutter>
        <PannelloDrive
          account={accountDrive()}
          configurato={configurato}
          mancanti={mancanti}
          collegato={collegato}
          email={stato.email}
          collegatoIl={stato.collegatoIl}
          collegatoDa={stato.collegatoDa}
          erroreCollegamento={stato.errore}
          idCartella={idCartellaRadice()}
          cartella={cartella}
          suDisco={suDisco}
          spostamento={statoSpostamento()}
          esito={typeof searchParams?.esito === 'string' ? searchParams.esito : undefined}
          errore={typeof searchParams?.errore === 'string' ? searchParams.errore : undefined}
        />
      </Gutter>
    </DefaultTemplate>
  )
}
