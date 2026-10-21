const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Rome',
})

/** 21 ottobre 2026 */
export function formatData(iso: string | Date): string {
  return dateFormatter.format(typeof iso === 'string' ? new Date(iso) : iso)
}

/** 1,2 MB · 340 kB */
export function formatDimensione(bytes?: number | null): string | null {
  if (!bytes) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`
  return `${(bytes / (1024 * 1024)).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB`
}

/** "application/pdf" → "PDF" */
export function formatTipoFile(mimeType?: string | null, filename?: string | null): string | null {
  const ext = filename?.split('.').pop()
  if (ext && ext.length <= 5 && ext !== filename) return ext.toUpperCase()
  return mimeType?.split('/').pop()?.toUpperCase() ?? null
}
