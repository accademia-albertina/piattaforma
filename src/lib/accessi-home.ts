import { CalendarDays, ClipboardList, DoorOpen, GraduationCap } from 'lucide-react'

import type { AccessoRapido } from '@/components/AccessiRapidi/AccessiRapidi'

/** Le quattro strade più cercate da chi arriva in home: chi vuole entrare e chi studia già qui. */
export const ACCESSI_HOME: AccessoRapido[] = [
  {
    titolo: 'Ammissioni',
    testo: 'Requisiti, prove e scadenze per entrare in Accademia.',
    href: '/didattica/ammissioni',
    icona: DoorOpen,
  },
  {
    titolo: 'Offerta formativa',
    testo: 'Dieci scuole, triennio e biennio.',
    href: '/scuole',
    icona: GraduationCap,
  },
  {
    titolo: 'Orari e calendari',
    testo: 'Lezioni, esami e sessioni di tesi.',
    href: '/calendari',
    icona: CalendarDays,
  },
  {
    titolo: 'Segreteria didattica',
    testo: 'Orari di apertura, contatti e pratiche.',
    href: '/studente/segreteria-didattica',
    icona: ClipboardList,
  },
]
