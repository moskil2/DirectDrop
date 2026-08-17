import Button from '../components/Button'
import FileIcon from '../components/FileIcon'
import Icon from '../components/Icon'
import { type FileItem, formatBytes } from '../helpers'
import { type Translations } from '../i18n'

interface Props {
  t: Translations
  brand: string
  files: FileItem[]
  dark: boolean
  onBack: () => void
  onRemove: (id: number) => void
  onAddMore: () => void
  onStart: () => void
  onExit: () => void
}

export default function SelectionScreen({ t, files, dark, onBack, onRemove, onAddMore, onStart, onExit }: Props) {
  const total = files.reduce((s, f) => s + f.size, 0)
  return (
    <div className="screen-scroll view-anim">
      <div style={{ padding: 'calc(20px + env(safe-area-inset-top)) 20px calc(150px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <button className="iconbtn" onClick={onBack}><Icon name="back" size={20} /></button>
          <div style={{ flex: 1 }}>
            <div className="h2">{t.selectedFiles}</div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>
              {t.filesCount(files.length)} · {formatBytes(total)}
            </div>
          </div>
          <button className="iconbtn" onClick={onAddMore}><Icon name="plus" size={20} /></button>
          <button className="iconbtn" onClick={onExit} title="Zamknij"><Icon name="x" size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {files.map(f => (
            <div key={f.id} className="frow">
              <FileIcon type={f.type} dark={dark} />
              <div className="meta">
                <div className="nm">{f.name}</div>
                <div className="sz">{formatBytes(f.size)}</div>
              </div>
              <button className="iconbtn" style={{ width: 36, height: 36 }} onClick={() => onRemove(f.id)}>
                <Icon name="x" size={17} />
              </button>
            </div>
          ))}
          <button className="btn btn--ghost" style={{ marginTop: 2, justifyContent: 'center' }} onClick={onAddMore}>
            <Icon name="plus" size={18} /> {t.addMore}
          </button>
        </div>
      </div>

      <div className="bottombar">
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{t.total}: </span>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--ink)', fontFamily: 'var(--mono)' }}>{formatBytes(total)}</span>
        </div>
        <Button variant="primary" block icon="wifi" iconAfter="arrowR" onClick={onStart} disabled={!files.length}
          style={{ padding: '16px 24px', fontSize: 17, borderRadius: 18, justifyContent: 'center' }}>
          {t.share}
        </Button>
      </div>
    </div>
  )
}
