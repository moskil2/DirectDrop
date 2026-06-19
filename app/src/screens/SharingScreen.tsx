import { useState } from 'react'
import Button from '../components/Button'
import FileIcon from '../components/FileIcon'
import Icon from '../components/Icon'
import ProgressBar from '../components/ProgressBar'
import QR from '../components/QR'
import { type FileItem, formatBytes, formatSpeed, formatTime, parseUserAgent } from '../helpers'
import { type Translations } from '../i18n'
import { type ConnectedClient } from '../plugins/DirectDrop'

interface Props {
  t: Translations
  address: string
  files: FileItem[]
  clients: number
  connectedDevices: ConnectedClient[]
  anyActive: boolean
  allDone: boolean
  copied: boolean
  dark: boolean
  onCopy: () => void
  onStop: () => void
  onDone: () => void
  onExit: () => void
  wifiStepsOpen: boolean
  onToggleWifiSteps: () => void
}

function DeviceListSheet({ devices, onClose, t }: { devices: ConnectedClient[]; onClose: () => void; t: Translations }) {
  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 18, letterSpacing: '-.02em' }}>
          {t.connectedDevicesTitle}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {devices.map((d, i) => {
            const ua = parseUserAgent(d.userAgent)
            return (
              <div key={i} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, background: 'var(--accent-soft)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon name={ua.category === 'mobile' ? 'phone' : 'monitor'} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>{ua.os} · {ua.browser}</div>
                  <div className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', marginTop: 2 }}>{d.ip}</div>
                  <div className="muted" style={{ fontSize: 11.5, fontWeight: 500, marginTop: 1 }}>
                    {t.connectedAtLabel} {new Date(d.connectedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <button
          onClick={onClose}
          style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 16, border: 'none', background: 'var(--card-2)', color: 'var(--ink)', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'inset 0 0 0 1px var(--line)' }}
        >
          {t.close}
        </button>
      </div>
    </div>
  )
}

function TransferRow({ f, dark, t }: { f: FileItem; dark: boolean; t: Translations }) {
  const done = f.status === 'done'
  return (
    <div className="card" style={{ padding: '14px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
        <FileIcon type={f.type} size={40} dark={dark} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {f.name}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', marginTop: 1 }}>
            {formatBytes(f.size * f.progress / 100)} / {formatBytes(f.size)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--mono)', color: done ? 'var(--success)' : 'var(--ink)' }}>
            {Math.round(f.progress)}%
          </div>
        </div>
      </div>
      <ProgressBar value={f.progress} done={done} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 12.5, fontWeight: 600 }}>
        {done ? (
          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={15} /> {t.doneTr}
          </span>
        ) : (
          <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="bolt" size={14} /> {formatSpeed(f.speed)}
          </span>
        )}
        <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!done && <><Icon name="clock" size={14} /> {formatTime(f.eta)}</>}
        </span>
      </div>
    </div>
  )
}

export default function SharingScreen({ t, address, files, clients, connectedDevices, anyActive, allDone, copied, dark, onCopy, onStop, onDone, onExit, wifiStepsOpen, onToggleWifiSteps }: Props) {
  const total = files.reduce((s, f) => s + f.size, 0)
  const doneCount = files.filter(f => f.status === 'done').length
  const overall = total ? files.reduce((s, f) => s + f.size * (f.progress / 100), 0) / total * 100 : 0
  const showActivity = anyActive || allDone
  const [deviceSheetOpen, setDeviceSheetOpen] = useState(false)

  return (
    <>
    <div className="screen-scroll view-anim">
      <div style={{ padding: '12px 20px 120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="pill pill--success pill--live"><span className="dot" />{t.sharingActive}</span>
          <button className="iconbtn" onClick={onExit} title="Zamknij">
            <Icon name="x" size={20} />
          </button>
        </div>

        {!showActivity ? (
          <>
            <div className="card" style={{ padding: wifiStepsOpen ? '8px 12px' : '4px 12px', marginBottom: 8 }}>
              <button
                onClick={onToggleWifiSteps}
                style={{
                  width: '100%', padding: '6px 2px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'start',
                  fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                <Icon name="wifi" size={13} style={{ color: 'var(--accent)' }} />
                <span style={{ flex: 1 }}>{t.connectStepsTitle}</span>
                <Icon name="chevR" size={13} style={{ color: 'var(--ink-3)', flexShrink: 0, transform: wifiStepsOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
              </button>
              {wifiStepsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6, borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="wifi" size={13} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>1 · </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>{t.wifiStep1}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="qr" size={13} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>2 · </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>{t.wifiStep2}</span>
                  </div>
                </div>
              </div>
              )}
            </div>

            <div className="card" style={{ padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div className="qrbox"><QR text={address} size={172} /></div>
              </div>
              <div className="addr">
                <Icon name="link" size={17} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                <span className="url" style={{ textAlign: 'left' }}>{address.replace('http://', '')}</span>
                <button
                  className={`btn btn--${copied ? 'secondary' : 'primary'}`}
                  onClick={onCopy} title="Kopiuj adres"
                  style={{ height: 40, width: 40, padding: 0, borderRadius: 12, flexShrink: 0 }}
                >
                  <Icon name={copied ? 'check' : 'copy'} size={18} />
                </button>
              </div>
              {copied && <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--success)' }}>{t.copiedAddr}</div>}
            </div>

            <div className="stats" style={{ marginTop: 8 }}>
              <div className="stat" style={{ padding: '8px 10px' }}><div className="v" style={{ fontSize: 16 }}>{files.length}</div><div className="k">{t.filesLabel}</div></div>
              <div className="stat" style={{ padding: '8px 10px' }}><div className="v" style={{ fontSize: 16 }}>{formatBytes(total)}</div><div className="k">{t.sizeLabel}</div></div>
              <div className="stat" style={{ padding: '8px 10px' }}>
                <div className="v" style={{ fontSize: 16 }}>{clients}</div>
                <div className="k">{t.devicesLabel}</div>
              </div>
            </div>

            <div
              className="card"
              onClick={clients > 0 ? () => setDeviceSheetOpen(true) : undefined}
              style={{ marginTop: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: clients > 0 ? 'pointer' : 'default' }}
            >
              {clients > 0 ? (
                <>
                  <div style={{
                    width: 36, height: 36, borderRadius: 11, background: 'var(--success-soft)', color: 'var(--success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon name="monitor" size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>{t.pcConnected}</div>
                    <div className="muted" style={{ fontSize: 12.5, fontWeight: 500, marginTop: 1 }}>{t.devConnected(clients)}</div>
                  </div>
                  <Icon name="chevR" size={16} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                </>
              ) : (
                <>
                  <div style={{
                    width: 36, height: 36, borderRadius: 11, background: 'var(--amber-soft)', color: 'var(--amber)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <span className="dot" style={{ width: 10, height: 10, borderRadius: 99, background: 'currentColor', animation: 'livePulse 1.4s infinite' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{t.waitingForPC}</div>
                    <div className="muted" style={{ fontSize: 12.5, fontWeight: 500, marginTop: 1 }}>{t.openInBrowser}</div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="qrbox" style={{ padding: 8, borderRadius: 16 }}><QR text={address} size={62} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {address.replace('http://', '')}
                </div>
                <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="monitor" size={13} /> {t.devConnected(clients)}
                </div>
              </div>
              <button className="iconbtn" onClick={onCopy} title="Kopiuj adres">
                <Icon name={copied ? 'check' : 'copy'} size={18} />
              </button>
            </div>

            <div className="card" style={{ marginTop: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 11 }}>
                <div style={{ fontWeight: 800, fontSize: 15.5, color: 'var(--ink)', letterSpacing: '-.01em' }}>
                  {allDone ? t.completed : t.transferring}
                </div>
                <div className="mono" style={{ fontWeight: 800, fontSize: 16, color: allDone ? 'var(--success)' : 'var(--accent)' }}>
                  {Math.round(overall)}%
                </div>
              </div>
              <ProgressBar value={overall} done={allDone} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12.5, fontWeight: 600 }}>
                <span className="muted">{doneCount} {t.ofLabel} {files.length} {t.filesLabel}</span>
                <span className="muted mono">{formatBytes(total * overall / 100)} / {formatBytes(total)}</span>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="eyebrow">{t.liveTransfers}</div>
                <span className="pill pill--success pill--live" style={{ padding: '5px 11px', fontSize: 12 }}>
                  <span className="dot" />{t.live}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {files.map(f => <TransferRow key={f.id} f={f} dark={dark} t={t} />)}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bottombar">
        {allDone
          ? <Button variant="primary" block icon="check" onClick={onDone}>{t.doneBtn}</Button>
          : <Button variant="danger" block icon="stop" onClick={onStop}>{t.stopSharing}</Button>
        }
      </div>
    </div>
    {deviceSheetOpen && (
      <DeviceListSheet devices={connectedDevices} onClose={() => setDeviceSheetOpen(false)} t={t} />
    )}
    </>
  )
}
