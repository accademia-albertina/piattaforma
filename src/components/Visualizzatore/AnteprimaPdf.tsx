'use client'

import { useEffect, useRef, useState } from 'react'

import { VistaPdf } from './VistaPdf'
import styles from './Visualizzatore.module.css'

/**
 * Anteprima del PDF dentro la pagina (componente Documento). PDF.js si carica solo quando
 * l'anteprima si avvicina alla vista. Lo schermo intero è il pulsante «Apri» di Documento.
 */
export function AnteprimaPdf({ url, nome }: { url: string; nome: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [vicina, setVicina] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el || vicina || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([v]) => v.isIntersecting && setVicina(true), {
      rootMargin: '400px 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [vicina])

  return (
    <div ref={box} className={styles.incorporata}>
      {vicina ? (
        <VistaPdf
          url={url}
          nome={nome}
          incorporato
          titolo={<p className={styles.etichettaAnteprima}>Anteprima</p>}
          alternativa={null}
        />
      ) : null}
    </div>
  )
}
