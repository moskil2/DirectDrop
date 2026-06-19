import { useMemo } from 'react'
import qrcode from 'qrcode-generator'

interface Props {
  text: string
  size?: number
  fg?: string
}

export default function QR({ text, size = 188, fg = '#15130e' }: Props) {
  const cells = useMemo(() => {
    try {
      const qr = qrcode(0, 'M')
      qr.addData(text)
      qr.make()
      const n = qr.getModuleCount()
      const arr: [number, number][] = []
      for (let r = 0; r < n; r++)
        for (let c = 0; c < n; c++)
          if (qr.isDark(r, c)) arr.push([r, c])
      return { n, arr }
    } catch {
      return { n: 21, arr: [] as [number, number][] }
    }
  }, [text])

  const { n, arr } = cells
  const unit = size / n
  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)

  const eye = (R: number, C: number) => (
    <g key={`e${R}${C}`}>
      <rect x={C * unit} y={R * unit} width={7 * unit} height={7 * unit} rx={2.4 * unit} fill={fg} />
      <rect x={(C + 1) * unit} y={(R + 1) * unit} width={5 * unit} height={5 * unit} rx={1.7 * unit} fill="#fff" />
      <rect x={(C + 2) * unit} y={(R + 2) * unit} width={3 * unit} height={3 * unit} rx={1 * unit} fill={fg} />
    </g>
  )

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {arr
        .filter(([r, c]) => !isFinder(r, c))
        .map(([r, c], i) => (
          <rect
            key={i}
            x={c * unit + unit * 0.13} y={r * unit + unit * 0.13}
            width={unit * 0.74} height={unit * 0.74}
            rx={unit * 0.3} fill={fg}
          />
        ))}
      {eye(0, 0)}{eye(0, n - 7)}{eye(n - 7, 0)}
    </svg>
  )
}
