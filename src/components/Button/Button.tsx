'use client'

import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components'

import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'md' | 'lg'

export type ButtonProps = Omit<AriaButtonProps, 'className'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')
  return <AriaButton {...props} className={classes} />
}
