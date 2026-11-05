import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Images,
  Landmark,
  type LucideIcon,
  Megaphone,
  Microscope,
  PanelsTopLeft,
  Scale,
  Users,
} from 'lucide-react'

/**
 * Icona di ogni sezione del pannello: la stessa nel menu laterale (via CSS, vedi
 * scripts/icone-pannello.mjs) e nelle schede della dashboard.
 */
export const ICONE_SEZIONI: Record<string, LucideIcon> = {
  pagine: FileText,
  avvisi: Megaphone,
  media: Images,
  corsi: BookOpen,
  docenti: GraduationCap,
  dottorandi: Microscope,
  calendari: CalendarDays,
  albo: ClipboardList,
  trasparenza: Scale,
  scuole: Landmark,
  users: Users,
  navigazione: PanelsTopLeft,
}
