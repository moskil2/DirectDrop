interface Props {
  value: number
  done?: boolean
}

export default function ProgressBar({ value, done }: Props) {
  return (
    <div className={`prog${done ? ' is-done' : ''}`}>
      <i style={{ width: Math.max(0, Math.min(100, value)) + '%' }} />
    </div>
  )
}
