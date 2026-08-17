import Button from '../components/Button'
import Icon from '../components/Icon'
import { type FileItem, formatBytes, formatTime } from '../helpers'
import { type Translations } from '../i18n'

interface Props {
  t: Translations
  files: FileItem[]
  durationSec: number
  avgSpeed: number
  onMore: () => void
  onClose: () => void
  onExit: () => void
}

export default function CompletedScreen({ t, files, durationSec, avgSpeed, onMore, onClose, onExit }: Props) {
  const total = files.reduce((s, f) => s + f.size, 0)
  return (
    <div className="screen-scroll view-anim">
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 24px calc(130px + env(safe-area-inset-bottom))', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button className="iconbtn" onClick={onExit} title="Zamknij">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div className="checkring">
            <div className="core">
              <Icon name="check" size={38} stroke={2.6} style={{ color: '#fff' }} />
            </div>
          </div>
          <div className="h1" style={{ marginTop: 30, marginBottom: 8 }}>{t.sentTitle}</div>
          <div className="muted" style={{ fontSize: 15.5, fontWeight: 500, maxWidth: 280, margin: '0 auto' }}>
            {t.sentDesc}
          </div>

          <div className="card" style={{ marginTop: 30, padding: '6px' }}>
            <div className="stats" style={{ gap: 6 }}>
              <div className="stat" style={{ background: 'transparent', boxShadow: 'none' }}>
                <div className="v">{files.length}</div><div className="k">{t.filesStatLabel}</div>
              </div>
              <div className="stat" style={{ background: 'transparent', boxShadow: 'none' }}>
                <div className="v">{formatBytes(total)}</div><div className="k">{t.sentStatLabel}</div>
              </div>
              <div className="stat" style={{ background: 'transparent', boxShadow: 'none' }}>
                <div className="v">{Math.round(avgSpeed)}</div><div className="k">{t.avgSpeedLabel}</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <span className="chip"><Icon name="clock" size={14} /> {t.timeLabel} {formatTime(durationSec)}</span>
          </div>
        </div>

        <div className="bottombar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button variant="primary" block icon="upload" onClick={onMore}>{t.shareMore}</Button>
            <Button variant="secondary" block onClick={onClose}>{t.closeSession}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
