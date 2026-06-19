import { useState, useEffect, useRef, useCallback } from 'react'
import './index.css'
import Icon from './components/Icon'
import HomeScreen from './screens/HomeScreen'
import SelectionScreen from './screens/SelectionScreen'
import SharingScreen from './screens/SharingScreen'
import CompletedScreen from './screens/CompletedScreen'
import { type FileItem, mkFile, extType, formatBytes } from './helpers'
import { DirectDrop, type NativeFile, type ConnectedClient } from './plugins/DirectDrop'
import { getLang, type LangCode, type Translations } from './i18n'

type UploadDialogStatus = 'waiting' | 'receiving' | 'done' | 'rejected'

interface IncomingFileInfo { name: string; size: number }

function IncomingFileDialog({ file, status, onAccept, onReject, onClose, t }: {
  file: IncomingFileInfo
  status: UploadDialogStatus
  onAccept: () => void
  onReject: () => void
  onClose: () => void
  t: import('./i18n').Translations
}) {
  return (
    <div className="menu-overlay">
      <div className="menu-sheet" onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="download" size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-.02em' }}>{t.incomingFileTitle}</div>
            {status === 'waiting' && <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', marginTop: 2 }}>{t.incomingFileDesc}</div>}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', marginTop: 3 }}>{formatBytes(file.size)}</div>
        </div>

        {status === 'waiting' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onReject} style={{ flex: 1, padding: 14, borderRadius: 16, border: 'none', background: 'var(--card-2)', color: 'var(--ink)', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
              {t.rejectFile}
            </button>
            <button onClick={onAccept} style={{ flex: 1, padding: 14, borderRadius: 16, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {t.acceptFile}
            </button>
          </div>
        )}
        {status === 'receiving' && (
          <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
            {t.receivingFile}
          </div>
        )}
        {status === 'done' && (
          <>
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>
              <Icon name="check" size={16} /> {t.receivedFile}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 14 }}>{t.savedToDownloads}</div>
            <button onClick={onClose} style={{ width: '100%', padding: 14, borderRadius: 16, border: 'none', background: 'var(--card-2)', color: 'var(--ink)', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'inset 0 0 0 1px var(--line)' }}>OK</button>
          </>
        )}
        {status === 'rejected' && (
          <>
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 14 }}>{t.rejectFile}</div>
            <button onClick={onClose} style={{ width: '100%', padding: 14, borderRadius: 16, border: 'none', background: 'var(--card-2)', color: 'var(--ink)', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: 'inset 0 0 0 1px var(--line)' }}>OK</button>
          </>
        )}
      </div>
    </div>
  )
}

const LS_KEY = 'directdrop_v1'
function loadPrefs() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} } }
function savePrefs(p: object) { try { localStorage.setItem(LS_KEY, JSON.stringify(p)) } catch {} }

type Screen = 'home' | 'selection' | 'sharing' | 'completed'
interface Toast { icon: string; t: string; s: string }

export default function App() {
  const prefs = useRef(loadPrefs()).current

  const [dark,      setDark]      = useState<boolean>(prefs.dark ?? true)
  const [lang,      setLang]      = useState<LangCode>(prefs.lang ?? 'en')
  const [howItWorksOpen, setHowItWorksOpen] = useState<boolean>(prefs.howItWorksOpen ?? true)
  const [wifiStepsOpen,  setWifiStepsOpen]  = useState<boolean>(prefs.wifiStepsOpen ?? true)
  const [screen,    setScreen]    = useState<Screen>('home')
  const [serverActive, setServerActive] = useState(false)
  const [files,     setFiles]     = useState<FileItem[]>([])
  const [clients,   setClients]   = useState(0)
  const [connectedDevices, setConnectedDevices] = useState<ConnectedClient[]>([])
  const [connected, setConnected] = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [toast,     setToast]     = useState<Toast | null>(null)
  const [stats,     setStats]     = useState({ duration: 0, avg: 0 })
  const [address,   setAddress]   = useState('http://1.1.1.1:8080')
  const [incomingFile,       setIncomingFile]       = useState<IncomingFileInfo | null>(null)
  const [uploadDialogStatus, setUploadDialogStatus] = useState<UploadDialogStatus>('waiting')

  const nativeFiles  = useRef<NativeFile[]>([])
  const connectTime  = useRef(0)

  const t: Translations = getLang(lang)

  useEffect(() => {
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light')
    document.body.classList.toggle('stage-dark', dark)
    DirectDrop.setTheme({ dark }).catch(() => {})
  }, [dark])

  useEffect(() => {
    DirectDrop.setLang({ lang }).catch(() => {})
  }, [lang])

  useEffect(() => { savePrefs({ dark, lang, howItWorksOpen, wifiStepsOpen }) }, [dark, lang, howItWorksOpen, wifiStepsOpen])

  const showToast = useCallback((o: Toast) => {
    setToast(o); setTimeout(() => setToast(null), 2600)
  }, [])

  // ── File picking ───────────────────────────────────────────────────────────

  const pickNative = useCallback(async () => {
    try {
      const { files: picked } = await DirectDrop.pickFiles()
      if (!picked.length) return
      const existingNames = new Set(nativeFiles.current.map(f => f.name))
      const newOnes = picked.filter(p => !existingNames.has(p.name))
      nativeFiles.current = [...nativeFiles.current, ...newOnes]
      setFiles(fs => [...fs, ...newOnes.map(p => mkFile({ name: p.name, size: p.size, type: extType(p.name) }))])
      setScreen('selection')
    } catch { /* user cancelled */ }
  }, [])

  const removeFile = (id: number) => {
    const removed = files.find(f => f.id === id)
    if (removed) nativeFiles.current = nativeFiles.current.filter(f => f.name !== removed.name)
    setFiles(fs => fs.filter(f => f.id !== id))
    DirectDrop.registerFiles({ files: nativeFiles.current }).catch(() => {})
  }

  // ── Sharing lifecycle ──────────────────────────────────────────────────────

  const startSharing = useCallback(async () => {
    setFiles(fs => fs.map(f => ({ ...f, progress: 0, status: 'queued' as const, speed: 0, eta: null })))
    setConnected(false); setClients(0); setConnectedDevices([])
    setScreen('sharing')
    try {
      const info = await DirectDrop.startServer({ port: 8080 })
      setAddress(info.address)
      setServerActive(true)
    } catch (e) {
      showToast({ icon: 'stop', t: t.serverError, s: String(e) })
    }
  }, [showToast, t])

  const stopSharing = useCallback(async () => {
    await DirectDrop.stopServer()
    setServerActive(false)
    setConnected(false); setClients(0); setConnectedDevices([])
    setScreen('home')
  }, [])

  const startReceiveMode = useCallback(async () => {
    nativeFiles.current = []
    setFiles([])
    setConnected(false); setClients(0); setConnectedDevices([])
    setScreen('sharing')
    try {
      const info = await DirectDrop.startServer({ port: 8080 })
      setAddress(info.address)
      await DirectDrop.registerFiles({ files: [] })
      setServerActive(true)
    } catch (e) {
      showToast({ icon: 'stop', t: t.serverError, s: String(e) })
    }
  }, [showToast, t])

  const resetToHome = useCallback(() => {
    nativeFiles.current = []
    setFiles([])
    DirectDrop.registerFiles({ files: [] }).catch(() => {})
  }, [])

  const handleAcceptUpload = useCallback(async () => {
    setUploadDialogStatus('receiving')
    await DirectDrop.confirmUpload({ accepted: true }).catch(() => {})
  }, [])

  const handleRejectUpload = useCallback(async () => {
    setUploadDialogStatus('rejected')
    await DirectDrop.confirmUpload({ accepted: false }).catch(() => {})
  }, [])

  const handleCloseUploadDialog = useCallback(() => {
    setIncomingFile(null)
    setUploadDialogStatus('waiting')
  }, [])

  const exitApp = useCallback(async () => {
    await DirectDrop.stopServer().catch(() => {})
    setServerActive(false)
    await DirectDrop.exitApp().catch(() => {})
  }, [])

  // ── Native event listeners ─────────────────────────────────────────────────

  useEffect(() => {
    if (!serverActive) return

    let handleCC: { remove: () => Promise<void> } | null = null
    let handleFP: { remove: () => Promise<void> } | null = null
    let handleUI: { remove: () => Promise<void> } | null = null
    let handleUC: { remove: () => Promise<void> } | null = null

    DirectDrop.addListener('uploadIntent', (data) => {
      setIncomingFile({ name: data.name, size: data.size })
      setUploadDialogStatus('waiting')
    }).then(h => { handleUI = h })

    DirectDrop.addListener('uploadComplete', () => {
      setUploadDialogStatus('done')
    }).then(h => { handleUC = h })

    DirectDrop.addListener('clientConnected', (data) => {
      setClients(data.count)
      setConnectedDevices(data.clients)
      if (data.count === 1) {
        connectTime.current = performance.now()
        setConnected(true)
        showToast({ icon: 'monitor', t: t.pcConnected, s: `IP: ${data.clients[data.clients.length - 1]?.ip ?? ''}` })
      }
    }).then(h => { handleCC = h })

    DirectDrop.addListener('fileProgress', (data) => {
      setFiles(fs => fs.map(f => {
        if (f.name !== data.name) return f
        const progress = Math.min(100, Math.round(data.bytesSent / data.total * 100))
        const status: FileItem['status'] = data.bytesSent >= data.total ? 'done' : 'active'
        const elapsed = (performance.now() - connectTime.current) / 1000
        const speed   = elapsed > 0.1 ? data.bytesSent / 1e6 / elapsed : 0
        const eta     = speed > 0 ? (data.total - data.bytesSent) / 1e6 / speed : null
        return { ...f, progress, status, speed, eta }
      }))
    }).then(h => { handleFP = h })

    return () => {
      handleCC?.remove()
      handleFP?.remove()
      handleUI?.remove()
      handleUC?.remove()
    }
  }, [serverActive, showToast, t])

  // ── Completion detection ───────────────────────────────────────────────────

  const allDone   = connected && files.length > 0 && files.every(f => f.status === 'done')
  const anyActive = connected && files.some(f => f.status === 'active' || f.status === 'done')

  useEffect(() => {
    if (!allDone || screen !== 'sharing') return
    const dur     = (performance.now() - connectTime.current) / 1000
    const totalMB = files.reduce((s, f) => s + f.size, 0) / 1e6
    setStats({ duration: dur, avg: totalMB / Math.max(0.5, dur) })
  }, [allDone, screen, files])

  const goToCompleted = useCallback(() => setScreen('completed'), [])

  // ── Clipboard ──────────────────────────────────────────────────────────────

  const copyAddr = () => {
    try { navigator.clipboard?.writeText(address) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="stage" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {toast && (
        <div className="toast">
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={toast.icon as any} size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="t">{toast.t}</div>
            <div className="s">{toast.s}</div>
          </div>
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          t={t} lang={lang} onSetLang={setLang}
          onSelectFiles={pickNative}
          onReceiveFiles={startReceiveMode}
          dark={dark}
          onToggleDark={() => setDark(d => !d)}
          onExit={exitApp}
          howItWorksOpen={howItWorksOpen}
          onToggleHowItWorks={() => setHowItWorksOpen(o => !o)}
        />
      )}
      {screen === 'selection' && (
        <SelectionScreen
          t={t} brand="DirectDrop" files={files} dark={dark}
          onBack={() => { resetToHome(); setScreen('home') }}
          onRemove={removeFile}
          onAddMore={pickNative}
          onStart={startSharing}
          onExit={exitApp}
        />
      )}
      {screen === 'sharing' && (
        <SharingScreen
          t={t} address={address} files={files} clients={clients}
          connectedDevices={connectedDevices}
          anyActive={anyActive} allDone={allDone}
          copied={copied} dark={dark}
          onCopy={copyAddr} onStop={stopSharing} onDone={goToCompleted}
          onExit={exitApp}
          wifiStepsOpen={wifiStepsOpen}
          onToggleWifiSteps={() => setWifiStepsOpen(o => !o)}
        />
      )}
      {screen === 'completed' && (
        <CompletedScreen
          t={t} files={files} durationSec={stats.duration} avgSpeed={stats.avg}
          onMore={() => { resetToHome(); setScreen('selection') }}
          onClose={() => { resetToHome(); stopSharing() }}
          onExit={exitApp}
        />
      )}
      {incomingFile && (
        <IncomingFileDialog
          file={incomingFile}
          status={uploadDialogStatus}
          onAccept={handleAcceptUpload}
          onReject={handleRejectUpload}
          onClose={handleCloseUploadDialog}
          t={t}
        />
      )}
    </div>
  )
}
