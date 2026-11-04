'use client'

import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'light' | 'outlineLight'
export type ButtonSize = 'md' | 'lg'

/** Classi globali dei pulsanti (src/styles/global.css), usabili anche sui link. */
export const classiPulsante: Record<ButtonVariant, string> = {
  primary: 'btn btn-primario',
  secondary: 'btn btn-secondario',
  ghost: 'btn btn-testo',
  light: 'btn btn-chiaro',
  outlineLight: 'btn btn-contorno-chiaro',
}

export type ButtonProps = Omit<AriaButtonProps, 'className'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const classes = [classiPulsante[variant], size === 'lg' && 'btn-lg', className]
    .filter(Boolean)
    .join(' ')
  return <AriaButton {...props} className={classes} />
}
