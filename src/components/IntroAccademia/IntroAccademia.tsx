'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Image, { type StaticImageData } from 'next/image'
import { useRef } from 'react'

import styles from './IntroAccademia.module.css'

export type Cifra = { valore: number; etichetta: string }

export type IntroAccademiaProps = {
  /** Testo del manifesto: le parole si accendono una alla volta mentre si scorre. */
  testo: string
  /** Foto che si apre dietro il motto. */
  foto: StaticImageData
  /** Due foto più piccole che scorrono accanto al manifesto, a velocità diverse. */
  dettagli?: [StaticImageData, StaticImageData]
  cifre?: Cifra[]
}

/**
 * Sezione emozionale della homepage (GSAP + ScrollTrigger + SplitText):
 * 1. scena: il motto in corsivo si scrive da sinistra a destra; da computer la scena resta
 *    fissata e la foto si apre fino a riempire lo schermo, da telefono la foto si muove appena;
 * 2. manifesto: le parole si accendono allo scorrimento, due foto scorrono a velocità diverse;
 * 3. cifre che contano fino al valore.
 * Senza JavaScript o con "riduci movimento" è tutto visibile e fermo.
 */
export function IntroAccademia({ testo, foto, dettagli, cifre = [] }: IntroAccademiaProps) {
  const radice = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      // Registrazione qui e non all'import: ScrollTrigger usa matchMedia, assente sul server e nei test
      gsap.registerPlugin(ScrollTrigger, SplitText)
      const mm = gsap.matchMedia()
      mm.add(
        {
          // Da computer: scena fissata con la finestra che si apre
          grande: '(min-width: 64rem) and (prefers-reduced-motion: no-preference)',
          // Da telefono e tablet: niente scena fissata (la barra degli indirizzi che compare e
          // scompare la fa sobbalzare) e solo trasformazioni leggere
          piccolo: '(max-width: 63.99rem) and (prefers-reduced-motion: no-preference)',
        },
        (ctx) => {
          const { grande } = ctx.conditions as { grande: boolean; piccolo: boolean }
          const q = gsap.utils.selector(radice)
          const scenaEl = q('[data-scena]')[0]

          // 1. Scena
          if (grande) {
            gsap
              .timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                  trigger: scenaEl,
                  start: 'top top',
                  end: '+=110%',
                  pin: true,
                  scrub: 0.6,
                },
              })
              .fromTo(
                q('[data-finestra]'),
                { clipPath: 'inset(24% 32% 24% 32%)' },
                { clipPath: 'inset(0% 0% 0% 0%)' },
              )
              .fromTo(q('[data-finestra] img'), { scale: 1.35 }, { scale: 1 }, 0)
              .fromTo(q('[data-velo]'), { opacity: 0.15 }, { opacity: 0.62 }, 0)
              .fromTo(q('[data-traduzione]'), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0 }, 0.55)
          } else {
            gsap.fromTo(
              q('[data-finestra] img'),
              { scale: 1.15 },
              {
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: scenaEl,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            )
            gsap.from(q('[data-traduzione]'), {
              autoAlpha: 0,
              y: 16,
              duration: 1,
              delay: 1.2,
              ease: 'power2.out',
              scrollTrigger: { trigger: scenaEl, start: 'top 60%' },
            })
          }

          // Il motto si scrive da sinistra a destra, una riga dopo l'altra, come a penna.
          // Si divide solo in righe: le lettere del corsivo restano legate tra loro.
          SplitText.create(q('[data-motto]'), {
            type: 'lines',
            aria: 'none',
            autoSplit: true,
            onSplit: (self) =>
              gsap.fromTo(
                self.lines,
                // Margini negativi in alto e in basso per non tagliare gli svolazzi
                { clipPath: 'inset(-40% 100% -40% -5%)' },
                {
                  clipPath: 'inset(-40% -5% -40% -5%)',
                  duration: 2.2,
                  ease: 'power2.inOut',
                  stagger: 0.9,
                  scrollTrigger: { trigger: scenaEl, start: 'top 65%' },
                },
              ),
          })

          // 2. Manifesto: ogni parola passa da spenta ad accesa seguendo lo scorrimento
          SplitText.create(q('[data-manifesto]'), {
            type: 'words',
            aria: 'none',
            autoSplit: true,
            onSplit: (self) =>
              gsap.fromTo(
                self.words,
                // Spente ma leggibili: bianco al 40% su #202f37 = 3,5:1 (testo grande, AA)
                { opacity: 0.4 },
                {
                  opacity: 1,
                  ease: 'none',
                  stagger: 0.1,
                  scrollTrigger: {
                    trigger: q('[data-manifesto]')[0],
                    start: 'top 85%',
                    end: 'bottom 50%',
                    scrub: true,
                  },
                },
              ),
          })

          // Foto di dettaglio: due velocità diverse danno profondità
          q('[data-dettaglio]').forEach((el, i) => {
            gsap.fromTo(
              el,
              { yPercent: i === 0 ? 18 : 40 },
              {
                yPercent: i === 0 ? -18 : -40,
                ease: 'none',
                scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
              },
            )
          })

          // 3. Cifre: contano fino al valore quando entrano
          q('[data-cifra]').forEach((el) => {
            const fine = Number(el.dataset.cifra)
            const conto = { n: 0 }
            gsap.to(conto, {
              n: fine,
              duration: 1.6,
              ease: 'power3.out',
              snap: { n: 1 },
              onUpdate: () => {
                el.textContent = String(conto.n)
              },
              scrollTrigger: { trigger: el, start: 'top 90%' },
            })
          })
        },
      )
      return () => mm.revert()
    },
    { scope: radice },
  )

  return (
    <section ref={radice} aria-labelledby="intro-motto" className={styles.intro}>
      <div data-scena className={styles.scena}>
        <div data-finestra className={styles.finestra}>
          <Image src={foto} alt="" fill sizes="100vw" className={styles.foto} />
          <div data-velo className={styles.velo} />
        </div>
        <div className={`container ${styles.scenaContenuto}`}>
          <p className={styles.occhiello}>Dal 1678 · Torino</p>
          {/* Il testo per i lettori di schermo è a parte: quello visibile viene diviso in lettere */}
          <h2 id="intro-motto" lang="fr" className={styles.motto}>
            <span className="visually-hidden">J’attends mon astre</span>
            <span data-motto aria-hidden className={styles.mottoVisibile}>
              <span className={styles.parte}>J’attends</span>{' '}
              <span className={styles.parte}>mon astre.</span>
            </span>
          </h2>
          <p data-traduzione className={styles.traduzione}>
            <span lang="it">«Aspetto la mia stella».</span> Il motto di Carlo Alberto, che nel 1833
            diede all’Accademia il suo nome.
          </p>
        </div>
      </div>

      <div className={`container ${styles.manifestoGriglia}`}>
        <p className={styles.manifesto}>
          <span className="visually-hidden">{testo}</span>
          <span data-manifesto aria-hidden>
            {testo}
          </span>
        </p>
        {dettagli && (
          <div className={styles.dettagli} aria-hidden>
            {dettagli.map((d, i) => (
              <div key={i} data-dettaglio className={styles.dettaglio}>
                <Image src={d} alt="" sizes="(min-width: 64rem) 25vw, 0px" />
              </div>
            ))}
          </div>
        )}
      </div>

      {cifre.length > 0 && (
        <dl className={`container ${styles.cifre}`}>
          {cifre.map((c) => (
            <div key={c.etichetta}>
              <dt>{c.etichetta}</dt>
              <dd data-cifra={c.valore}>{c.valore}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
