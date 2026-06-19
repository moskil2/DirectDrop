import { useState, useEffect } from 'react'
import Button from '../components/Button'
import FileIcon from '../components/FileIcon'
import Icon from '../components/Icon'
import LogoMark from '../components/LogoMark'
import ProgressBar from '../components/ProgressBar'
import { type FileItem, formatBytes, mkFile } from '../helpers'

const DEMO_FILES = [
  { name: 'video001.mp4',         size: 1.24e9, type: 'video' as const },
  { name: 'sunset_timelapse.mov', size: 148e6,  type: 'video' as const },
  { name: 'IMG_4821.jpg',         size: 5.1e6,  type: 'image' as const },
  { name: 'IMG_4822.jpg',         size: 4.6e6,  type: 'image' as const },
  { name: 'ride_2026-06-13.gpx',  size: 842e3,  type: 'map'   as const },
]

function DesktopFileRow({ f, dark, onDownload }: { f: FileItem; dark: boolean; onDownload: () => void }) {
  const done = f.status === 'done', active = f.status === 'active'
  return (
    <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <FileIcon type={f.type} size={46} dark={dark} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {f.name}
        </div>
        {active ? (
          <div style={{ marginTop: 8, maxWidth: 320 }}><ProgressBar value={f.progress} /></div>
        ) : (
          <div className="muted" style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{formatBytes(f.size)}</div>
        )}
      </div>
      {done ? (
        <span className="pill pill--success" style={{ padding: '8px 14px' }}>
          <Icon name="check" size={16} /> Pobrano
        </span>
      ) : active ? (
        <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', width: 54, textAlign: 'right' }}>
          {Math.round(f.progress)}%
        </span>
      ) : (
        <Button variant="secondary" icon="download" onClick={onDownload} style={{ height: 44, fontSize: 14 }}>
          Pobierz
        </Button>
      )}
    </div>
  )
}

interface Props {
  address: string
  dark: boolean
  onBack: () => void
}

export default function DesktopPage({ address, dark, onBack }: Props) {
  const [items, setItems] = useState<FileItem[]>(() => DEMO_FILES.map(mkFile))
  const total = items.reduce((s, f) => s + f.size, 0)

  const startDownload = (id: number) => {
    setItems(it => it.map(f => f.id === id && f.status === 'queued' ? { ...f, status: 'active', progress: 0 } : f))
  }
  const downloadAll = () => setItems(it => it.map(f => f.status === 'queued' ? { ...f, status: 'active', progress: 0 } : f))

  useEffect(() => {
    const active = items.some(f => f.status === 'active')
    if (!active) return
    const id = setInterval(() => {
      setItems(it => it.map(f => {
        if (f.status !== 'active') return f
        const np = Math.min(100, f.progress + (8 + Math.random() * 10))
        return np >= 100 ? { ...f, progress: 100, status: 'done' } : { ...f, progress: np }
      }))
    }, 140)
    return () => clearInterval(id)
  }, [items])

  return (
    <div className="browser">
      <div className="bw-bar">
        <div className="bw-lights">
          <i style={{ background: '#ec6a5e' }} /><i style={{ background: '#f4be4f' }} /><i style={{ background: '#61c454' }} />
        </div>
        <div className="bw-url">
          <Icon name="shield" size={14} style={{ color: 'var(--success)' }} />
          {address.replace('http://', '')}
        </div>
        <button className="btn btn--ghost" style={{ height: 32, fontSize: 13, padding: '0 12px' }} onClick={onBack}>
          <Icon name="phone" size={15} /> Wróć do telefonu
        </button>
      </div>

      <div className="bw-body">
        <div className="dl-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <LogoMark size={46} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--ink)' }}>Pliki z telefonu</div>
              <div className="muted" style={{ fontSize: 15, fontWeight: 500, marginTop: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="phone" size={15} /> Pixel 8 Pro</span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span className="mono">{items.length} plików · {formatBytes(total)}</span>
              </div>
            </div>
            <span className="pill pill--success pill--live"><span className="dot" />Połączono</span>
          </div>

          <div className="card" style={{
            marginTop: 26, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
            background: 'var(--accent-soft)', boxShadow: 'inset 0 0 0 1px var(--accent-line)'
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14, background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon name="zip" size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Pobierz wszystko jako ZIP</div>
              <div className="muted" style={{ fontSize: 13.5, fontWeight: 500 }}>Jedno archiwum · {formatBytes(total)}</div>
            </div>
            <Button variant="primary" icon="download" onClick={downloadAll}>Pobierz wszystko</Button>
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(f => (
              <DesktopFileRow key={f.id} f={f} dark={dark} onDownload={() => startDownload(f.id)} />
            ))}
          </div>

          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>
            <Icon name="shield" size={15} /> Transfer odbywa się wyłącznie w Twojej sieci lokalnej. Nic nie trafia do chmury.
          </div>
        </div>
      </div>
    </div>
  )
}
