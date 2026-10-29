/** Email con un punto di a capo dopo la @, per le colonne strette (scheda corso, contatti). */
export function emailSpezzabile(email: string) {
  const [utente, dominio] = email.split('@')
  if (!dominio) return email
  return (
    <>
      {utente}@<wbr />
      {dominio}
    </>
  )
}
