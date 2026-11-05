/** Valore numerico di un ciclo in numeri romani (XLI → 41), per ordinare i gruppi. */
export function numeroCiclo(ciclo: string | null | undefined): number {
  if (!ciclo) return 0
  const valori: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 }
  let totale = 0
  for (let i = 0; i < ciclo.length; i++) {
    const v = valori[ciclo[i]] ?? 0
    const dopo = valori[ciclo[i + 1]] ?? 0
    totale += v < dopo ? -v : v
  }
  return totale
}
