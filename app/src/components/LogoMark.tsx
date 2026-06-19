interface Props {
  size?: number
  radius?: number
}

export default function LogoMark({ size = 44, radius }: Props) {
  const r = radius ?? Math.round(size * 0.3)
  return (
    <img
      src="/icon.png"
      alt="DirectDrop"
      style={{ width: size, height: size, borderRadius: r, flexShrink: 0, objectFit: 'cover', display: 'block' }}
    />
  )
}
