import React from 'react'
import Icon from './Icon'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  block?: boolean
  icon?: string
  iconAfter?: string
}

export default function Button({ variant = 'primary', block, children, icon, iconAfter, className, ...rest }: Props) {
  return (
    <button
      className={`btn btn--${variant}${block ? ' btn--block' : ''}${className ? ' ' + className : ''}`}
      {...rest}
    >
      {icon && <Icon name={icon as any} size={20} />}
      {children}
      {iconAfter && <Icon name={iconAfter as any} size={20} className="chev" />}
    </button>
  )
}
