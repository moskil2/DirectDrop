import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import Button from '../components/Button'
import Icon, { type IconName } from '../components/Icon'
import LogoMark from '../components/LogoMark'
import { type Translations, type LangCode, LANGUAGES } from '../i18n'

const VERSION = 'V0.47'
const BUILD = '20260622.1800'

interface Props {
  t: Translations
  lang: LangCode
  onSetLang: (lang: LangCode) => void
  onSelectFiles: () => void
  onReceiveFiles: () => void
  dark: boolean
  onToggleDark: () => void
  onExit: () => void
  howItWorksOpen: boolean
  onToggleHowItWorks: () => void
}

function randomBit() { return Math.random() > 0.5 ? '1' : '0' }

function AnimatedBalls() {
  const [bits, setBits] = useState(() => [randomBit(), randomBit(), randomBit(), randomBit()])

  const rollBit = (i: number) => {
    setBits(b => b.map((v, idx) => (idx === i ? randomBit() : v)))
  }

  return (
    <div style={{
      position: 'relative', width: 80, height: 26, overflow: 'hidden', flexShrink: 0,
      alignSelf: 'flex-start', marginTop: 18,
    }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} onAnimationIteration={() => rollBit(i)} style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: 16,
          height: 16,
          marginTop: -8,
          borderRadius: '50%',
          background: '#3ec27a',
          boxShadow: '0 0 8px rgba(62,194,122,0.65)',
          animation: `ballFlow 2.25s ease-in-out ${i * 0.56}s infinite`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, lineHeight: 1,
            color: 'rgba(0,0,0,.75)', userSelect: 'none',
          }}>
            {bits[i]}
          </span>
        </div>
      ))}
    </div>
  )
}

function DevTile({ icon, label, accent, tileSize = 62, iconSize = 28 }: { icon: 'phone' | 'device'; label: string; accent?: boolean; tileSize?: number; iconSize?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: tileSize, height: tileSize, borderRadius: Math.round(tileSize * 0.32), display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: accent ? 'var(--accent)' : 'var(--card-2)',
        color: accent ? '#fff' : 'var(--ink-2)',
        boxShadow: accent ? '0 8px 20px color-mix(in srgb,var(--accent) 38%,transparent)' : 'inset 0 0 0 1px var(--line)',
      }}>
        <Icon name={icon} size={iconSize} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>{label}</span>
    </div>
  )
}

function HeroBeam({ t }: { t: Translations }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <DevTile icon="phone" label={t.phone} accent />
      <AnimatedBalls />
      <DevTile icon="device" label={t.device} accent />
    </div>
  )
}

function LangSheet({ lang, onSetLang, onClose, t }: {
  lang: LangCode; onSetLang: (l: LangCode) => void; onClose: () => void; t: Translations
}) {
  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />
        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', marginBottom: 18, letterSpacing: '-.02em' }}>
          {t.languageLabel}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 18, overflow: 'hidden', background: 'var(--card-2)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
          {LANGUAGES.map((l, i) => (
            <button
              key={l.code}
              onClick={() => { onSetLang(l.code); onClose() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px',
                borderTop: i > 0 ? '1px solid var(--line)' : 'none',
                background: lang === l.code ? 'var(--accent-soft)' : 'transparent',
                border: 'none', cursor: 'pointer', width: '100%', textAlign: 'start',
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>{l.flag}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: lang === l.code ? 'var(--accent)' : 'var(--ink)' }}>
                {l.name}
              </span>
              {lang === l.code && (
                <span style={{ marginLeft: 'auto' }}>
                  <Icon name="check" size={18} style={{ color: 'var(--accent)' }} />
                </span>
              )}
            </button>
          ))}
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

const HOW_ICONS: Array<'wifi' | 'upload' | 'phone' | 'qr' | 'download'> = ['wifi', 'upload', 'phone', 'qr', 'download']

function HowItWorksPanel({ t, open, onToggle }: { t: Translations; open: boolean; onToggle: () => void }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)
  const [autoPlay, setAutoPlay] = useState(true)

  const steps = [
    { icon: HOW_ICONS[0], text: t.howStep1 },
    { icon: HOW_ICONS[1], text: t.howStep2 },
    { icon: HOW_ICONS[2], text: t.howStep3 },
    { icon: HOW_ICONS[3], text: t.howStep4 },
    { icon: HOW_ICONS[4], text: t.howStep5 },
  ]

  useEffect(() => {
    if (!open || !autoPlay) return
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setStep(s => (s + 1) % 5)
        setVisible(true)
      }, 200)
    }, 4000)
    return () => clearInterval(id)
  }, [open, autoPlay])

  const current = steps[step]

  return (
    <div style={{ marginTop: 12, borderRadius: 18, background: 'var(--card-2)', boxShadow: 'inset 0 0 0 1px var(--line)', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '10px 18px 8px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'start',
          borderBottom: open ? '1px solid var(--line)' : 'none',
          fontSize: 12, fontWeight: 700, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--ink-3)',
          display: 'flex', alignItems: 'center', gap: 7,
        }}
      >
        <span style={{ flex: 1 }}>{t.howItWorksTitle}</span>
        <Icon name="chevR" size={13} style={{ color: 'var(--ink-3)', flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
      <div style={{ padding: '12px 18px 14px' }}>
        <div style={{ minHeight: 52, overflow: 'hidden' }}>
          <div
            key={step}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(4px)',
              transition: 'opacity .2s, transform .2s',
              animation: visible ? 'stepIn .35s cubic-bezier(.22,1,.36,1)' : 'none',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={current.icon} size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35 }}>
                {current.text}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 16 : 6, height: 6, borderRadius: 3,
                  background: i === step ? 'var(--accent)' : 'var(--line-2)',
                  transition: 'width .3s, background .3s',
                }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, marginTop: 10 }}>
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => { setAutoPlay(false); setStep(i); setVisible(true) }}
              style={{
                flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
                background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                opacity: i === step ? 1 : 0.45, transition: 'opacity .2s',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: i === step ? 'var(--accent)' : 'var(--card)',
                color: i === step ? '#fff' : 'var(--ink-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 0 0 1px var(--line)',
                transition: 'background .2s, color .2s',
              }}>
                <Icon name={s.icon} size={15} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: i === step ? 'var(--accent)' : 'var(--ink-3)', letterSpacing: '.02em', transition: 'color .2s' }}>
                {i + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}

const ANDROID_VERSIONS = [
  { name: 'Android 8.0–8.1 (Oreo)', api: '26–27' },
  { name: 'Android 9 (Pie)', api: '28' },
  { name: 'Android 10', api: '29' },
  { name: 'Android 11', api: '30' },
  { name: 'Android 12–12L', api: '31–32' },
  { name: 'Android 13', api: '33' },
  { name: 'Android 14', api: '34' },
  { name: 'Android 15', api: '35' },
  { name: 'Android 16', api: '36' },
]

function CollapsibleSection({ icon, title, defaultOpen = false, children }: {
  icon?: IconName; title: string; defaultOpen?: boolean; children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginTop: 14, borderRadius: 18, overflow: 'hidden', background: 'var(--card-2)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '11px 18px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'start',
          borderBottom: open ? '1px solid var(--line)' : 'none',
          fontSize: 11, fontWeight: 700, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--ink-3)',
          display: 'flex', alignItems: 'center', gap: 7,
        }}
      >
        {icon && <Icon name={icon} size={13} style={{ color: 'var(--success)' }} />}
        <span style={{ flex: 1 }}>{title}</span>
        <Icon name="chevR" size={13} style={{ color: 'var(--ink-3)', flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && children}
    </div>
  )
}

const SUPPORT_URL = 'spotrobotics.app'

function SupportSheet({ onClose, t }: { onClose: () => void; t: Translations }) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    try { navigator.clipboard?.writeText('https://' + SUPPORT_URL) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="menu-overlay menu-overlay--top" onClick={onClose}>
      <div className="menu-sheet menu-sheet--top" onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'color-mix(in srgb,#3ec27a 14%,transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="heart" size={20} style={{ color: '#3ec27a' }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em', color: 'var(--ink)' }}>
            {t.supportTitle}
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)', lineHeight: 1.65 }}>
          {t.supportBody}
        </div>

        <div style={{
          marginTop: 18, borderRadius: 14, overflow: 'hidden',
          background: 'var(--card-2)', boxShadow: 'inset 0 0 0 1px var(--line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px' }}>
            <Icon name="link" size={15} style={{ color: '#3ec27a', flexShrink: 0 }} />
            <a
              href={'https://' + SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, fontSize: 14, fontWeight: 700, color: '#3ec27a',
                textDecoration: 'none', wordBreak: 'break-all',
              }}
            >
              {SUPPORT_URL}
            </a>
            <button onClick={copyLink} className="iconbtn" title={t.copyLink} style={{ flexShrink: 0 }}>
              <Icon name={copied ? 'check' : 'copy'} size={16} style={{ color: copied ? '#3ec27a' : undefined }} />
            </button>
          </div>
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

const CONTACT_EMAIL = 'tomasz.pieczara@gazeta.pl'

function MenuSheet({ dark, onToggleDark, onClose, t }: {
  dark: boolean; onToggleDark: () => void; onClose: () => void; t: Translations
}) {
  const [copiedEmail, setCopiedEmail] = useState(false)
  const copyEmail = () => {
    try { navigator.clipboard?.writeText(CONTACT_EMAIL) } catch {}
    setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 1800)
  }
  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-sheet" onClick={e => e.stopPropagation()}>
        <div className="drag-handle" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <LogoMark size={48} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', color: 'var(--ink)' }}>DirectDrop</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginTop: 2 }}>{t.versionLabel} {VERSION}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', marginTop: 1 }}>Build {BUILD}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 18, overflow: 'hidden', background: 'var(--card-2)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t.darkTheme}</div>
            <button
              onClick={onToggleDark}
              style={{
                width: 48, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: dark ? 'var(--accent)' : 'var(--line-2)',
                position: 'relative', transition: 'background .2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 4, left: dark ? 24 : 4,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left .2s', display: 'block',
                boxShadow: '0 1px 4px rgba(0,0,0,.25)',
              }} />
            </button>
          </div>
          <div style={{ padding: '15px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{t.developerLabel}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>Tomasz Pieczara</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginTop: 1 }}>SpotRobotics</div>
          </div>
        </div>

        <CollapsibleSection icon="shield" title={t.privacyTitle}>
          <div style={{ padding: '14px 18px 16px', display: 'flex', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'color-mix(in srgb,var(--success) 14%,transparent)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <Icon name="shield" size={18} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              {t.privacyBody}
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection icon="wifi" title={t.wifiHotspotTitle}>
          <div style={{ padding: '14px 18px 16px', display: 'flex', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'color-mix(in srgb,var(--success) 14%,transparent)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <Icon name="wifi" size={18} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              {t.wifiHotspotBody}
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection icon="doc" title={t.rodoTitle}>
          <div style={{ padding: '14px 18px 16px', display: 'flex', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'color-mix(in srgb,var(--success) 14%,transparent)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <Icon name="doc" size={18} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              {t.rodoBody}
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection icon="mail" title={t.contactTitle}>
          <div style={{ padding: '14px 18px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'color-mix(in srgb,var(--success) 14%,transparent)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="mail" size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 9 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {CONTACT_EMAIL}
              </div>
            </div>
            <button onClick={copyEmail} className="iconbtn" title={t.copyEmail} style={{ flexShrink: 0 }}>
              <Icon name={copiedEmail ? 'check' : 'copy'} size={16} />
            </button>
          </div>
        </CollapsibleSection>

        <CollapsibleSection icon="check" title={t.compatTitle}>
          <div style={{ padding: '4px 18px 8px' }}>
            {ANDROID_VERSIONS.map((v, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{v.name}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>API {v.api}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

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

export default function HomeScreen({ t, lang, onSetLang, onSelectFiles, onReceiveFiles, dark, onToggleDark, onExit, howItWorksOpen, onToggleHowItWorks }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  const currentFlag = LANGUAGES.find(l => l.code === lang)?.flag ?? '🇺🇸'

  return (
    <div className="screen-scroll view-anim">
      <div style={{ padding: '28px 24px 160px', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="iconbtn" onClick={() => setMenuOpen(true)} title="Menu">
              <Icon name="menu" size={20} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setSupportOpen(true)}
              style={{
                height: 42, borderRadius: 13, border: 0, cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px',
                background: 'color-mix(in srgb,#3ec27a 10%,transparent)',
                boxShadow: 'inset 0 0 0 1.5px #3ec27a',
                color: '#3ec27a', fontSize: 12, fontWeight: 700,
                transition: '.15s',
              }}
            >
              <Icon name="heart" size={13} />
              <span>{t.supportBtn}</span>
            </button>
            <button
              className="iconbtn"
              onClick={() => setLangOpen(true)}
              title={t.languageLabel}
              style={{ fontSize: 20, lineHeight: 1 }}
            >
              {currentFlag}
            </button>
            <button className="iconbtn" onClick={onExit} title="Zamknij">
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 0 0' }}>
          <div className="card" style={{ padding: '18px 26px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(420px 200px at 50% -20%, var(--accent-soft), transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <HeroBeam t={t} />
              </div>
              <div className="h1" style={{ marginBottom: 6, fontSize: 25 }}>
                {t.heroTitle.split('\n').map((line, i) => (
                  <span key={i}>{line}{i < t.heroTitle.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
              <div className="muted" style={{ fontSize: 14, lineHeight: 1.5, fontWeight: 500, maxWidth: 300, margin: '0 auto' }}>
                {t.heroSub}
              </div>
            </div>
          </div>
          <HowItWorksPanel t={t} open={howItWorksOpen} onToggle={onToggleHowItWorks} />
        </div>

        <div style={{ flex: howItWorksOpen ? 1 : 0 }} />

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: howItWorksOpen ? 18 : 8, marginBottom: 22, flexWrap: 'wrap' }}>
          {(['bolt', 'shield', 'wifi'] as const).map((ic, idx) => {
            const labels = [t.tagLarge, t.tagNoAccount, t.tagWifi]
            return (
              <span key={ic} className="chip"><Icon name={ic} size={14} />{labels[idx]}</span>
            )
          })}
        </div>

        <div className="bottombar">
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
            <Button variant="primary" icon="upload" onClick={onSelectFiles}
              style={{ flex: 1, fontSize: 14, padding: '10px 10px', whiteSpace: 'normal', height: 'auto', minHeight: 52, border: '2px solid #3ec27a' }}>
              {t.sendFiles}
            </Button>
            <Button variant="secondary" icon="download" onClick={onReceiveFiles}
              style={{ flex: 1, fontSize: 14, padding: '10px 10px', whiteSpace: 'normal', height: 'auto', minHeight: 52, border: '2px solid #3ec27a' }}>
              {t.receiveFiles}
            </Button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <MenuSheet dark={dark} onToggleDark={onToggleDark} onClose={() => setMenuOpen(false)} t={t} />
      )}
      {langOpen && (
        <LangSheet lang={lang} onSetLang={onSetLang} onClose={() => setLangOpen(false)} t={t} />
      )}
      {supportOpen && (
        <SupportSheet onClose={() => setSupportOpen(false)} t={t} />
      )}
    </div>
  )
}
