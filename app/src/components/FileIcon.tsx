import Icon from './Icon'
import { FTYPE, type FileType } from '../helpers'

interface Props {
  type: FileType
  size?: number
  dark?: boolean
}

export default function FileIcon({ type, size = 48, dark = false }: Props) {
  const t = FTYPE[type] ?? FTYPE.file
  const h = t.hue
  const bg = dark ? `oklch(0.32 0.05 ${h})` : `oklch(0.93 0.06 ${h})`
  const fg = dark ? `oklch(0.82 0.12 ${h})` : `oklch(0.52 0.16 ${h})`
  return (
    <div className="fic" style={{ width: size, height: size, background: bg, color: fg }}>
      <Icon name={t.icon as any} size={size * 0.5} stroke={2} />
    </div>
  )
}
