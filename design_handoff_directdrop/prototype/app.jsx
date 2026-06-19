/* app.jsx — DirectDrop root: state machine, transfer sim, desktop page, stage */

const ADDRESS = 'http://192.168.1.123:8080';
const DEMO_FILES = [
  { name:'video001.mp4',          size:1.24e9, type:'video' },
  { name:'sunset_timelapse.mov',  size:148e6,  type:'video' },
  { name:'IMG_4821.jpg',          size:5.1e6,  type:'image' },
  { name:'IMG_4822.jpg',          size:4.6e6,  type:'image' },
  { name:'ride_2026-06-13.gpx',   size:842e3,  type:'map'   },
];
const NOMINAL = 90; // MB/s demo
let _uid = 1;
const mkFile = (f) => ({ id:_uid++, name:f.name, size:f.size, type:f.type || extType(f.name),
  progress:0, status:'queued', speed:0, eta:null });

const LS = 'directdrop_v1';
function loadPrefs(){ try{ return JSON.parse(localStorage.getItem(LS)) || {}; }catch(e){ return {}; } }
function savePrefs(p){ try{ localStorage.setItem(LS, JSON.stringify(p)); }catch(e){} }

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#1f6feb"
}/*EDITMODE-END*/;

function App(){
  const prefs = React.useRef(loadPrefs()).current;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView]   = useState(prefs.view || 'phone');
  const [dark, setDark]   = useState(prefs.dark || false);
  const [screen, setScreen] = useState('home');
  const [files, setFiles] = useState(() => DEMO_FILES.map(mkFile));
  const [clients, setClients] = useState(0);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ duration:0, avg:NOMINAL });

  const connectTime = useRef(0);
  const durs = useRef({});
  const fileInput = useRef(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  /* theme + accent → DOM */
  useEffect(() => {
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.body.classList.toggle('stage-dark', dark);
    document.documentElement.style.setProperty('--accent', t.accent);
  }, [dark, t.accent]);

  /* persist prefs */
  useEffect(() => { savePrefs({ view, dark }); }, [view, dark]);

  const showToast = (o) => { setToast(o); setTimeout(() => setToast(null), 2600); };

  /* ---------- file selection ---------- */
  const goSelect = () => fileInput.current && fileInput.current.click();
  const onFilesPicked = (e) => {
    const picked = Array.from(e.target.files || []);
    if(picked.length){
      setFiles(picked.map(p => mkFile({ name:p.name, size:p.size })));
    }
    setScreen('selection');
    e.target.value = '';
  };
  const useDemoAndSelect = () => { setFiles(DEMO_FILES.map(mkFile)); setScreen('selection'); };
  const removeFile = (id) => setFiles(fs => fs.filter(f => f.id !== id));

  /* ---------- start sharing ---------- */
  const startSharing = () => {
    setFiles(fs => fs.map(f => ({ ...f, progress:0, status:'queued', speed:0, eta:null })));
    setConnected(false); setClients(0);
    setScreen('sharing');
  };
  const stopSharing = () => { setConnected(false); setClients(0); setScreen('home'); };

  /* auto-connect a PC shortly after sharing opens */
  useEffect(() => {
    if(screen !== 'sharing' || connected) return;
    const id = setTimeout(() => doConnect(), 1800);
    return () => clearTimeout(id);
  }, [screen, connected]);

  const doConnect = () => {
    if(connected) return;
    durs.current = {};
    filesRef.current.forEach((f,i) => { durs.current[f.id] = {
      dur: Math.min(9, Math.max(1.2, (f.size/1e6)/NOMINAL)),
      delay: i*0.45, jitter: 0.85 + Math.random()*0.3 };
    });
    connectTime.current = performance.now();
    setClients(1); setConnected(true);
    showToast({ icon:'monitor', t:'PC-DESKTOP połączony', s:'Pobieranie rozpoczęte przez przeglądarkę' });
  };

  /* ---------- simulation loop ---------- */
  useEffect(() => {
    if(!connected || screen !== 'sharing') return;
    let raf, finished = false;
    const tick = () => {
      const now = performance.now();
      setFiles(fs => fs.map(f => {
        const d = durs.current[f.id]; if(!d) return f;
        const el = (now - connectTime.current)/1000 - d.delay;
        if(el <= 0) return { ...f, status:'queued', speed:0, eta:d.dur };
        const p = Math.min(100, (el/d.dur)*100);
        const done = p >= 100;
        return { ...f, progress:p, status: done ? 'done':'active',
          speed: done ? 0 : (f.size/1e6)/d.dur * d.jitter,
          eta: done ? 0 : (1 - p/100)*d.dur };
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [connected, screen]);

  /* detect completion */
  const allDone = connected && files.length > 0 && files.every(f => f.status === 'done');
  useEffect(() => {
    if(allDone && screen === 'sharing'){
      const duration = (performance.now() - connectTime.current)/1000;
      const totalMB = files.reduce((s,f) => s + f.size, 0)/1e6;
      setStats({ duration, avg: totalMB/Math.max(0.5,duration) });
      const id = setTimeout(() => setScreen('completed'), 1500);
      return () => clearTimeout(id);
    }
  }, [allDone, screen]);

  const anyActive = connected && files.some(f => f.status === 'active' || f.status === 'done');

  const copyAddr = () => {
    try{ navigator.clipboard && navigator.clipboard.writeText(ADDRESS); }catch(e){}
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  /* ---------- render phone ---------- */
  const phoneView = (
    <div className="phone">
      <div className="phone-screen">
        <div className="statusbar">
          <span>9:30</span>
          <span className="punch"/>
          <span className="sb-r">
            <Icon name="wifi" size={15} stroke={2.2}/>
            <svg width="22" height="13" viewBox="0 0 22 13" style={{ display:'block' }}>
              <rect x="0.6" y="0.6" width="18" height="11.8" rx="3" fill="none" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="2.4" y="2.4" width="13" height="8.2" rx="1.6" fill="currentColor"/>
              <rect x="20" y="4" width="1.6" height="5" rx="0.8" fill="currentColor"/>
            </svg>
          </span>
        </div>

        {toast && (
          <div className="toast">
            <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,.14)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name={toast.icon} size={18}/>
            </div>
            <div style={{ flex:1 }}>
              <div className="t">{toast.t}</div>
              <div className="s">{toast.s}</div>
            </div>
          </div>
        )}

        {screen === 'home' &&
          <HomeScreen brand="DirectDrop" onSelectFiles={useDemoAndSelect} />}
        {screen === 'selection' &&
          <SelectionScreen brand="DirectDrop" files={files}
            onBack={() => setScreen('home')} onRemove={removeFile}
            onAddMore={goSelect} onStart={startSharing} />}
        {screen === 'sharing' &&
          <SharingScreen brand="DirectDrop" address={ADDRESS} files={files} clients={clients}
            started={connected} anyActive={anyActive} allDone={allDone}
            onCopy={copyAddr} copied={copied} onStop={stopSharing}
            onPreviewPC={() => setView('desktop')} onConnect={doConnect} />}
        {screen === 'completed' &&
          <CompletedScreen files={files} durationSec={stats.duration} avgSpeed={stats.avg}
            onMore={() => { setFiles(DEMO_FILES.map(mkFile)); setScreen('selection'); }}
            onClose={() => { setFiles(DEMO_FILES.map(mkFile)); setScreen('home'); }} />}

        <input ref={fileInput} type="file" multiple style={{ display:'none' }} onChange={onFilesPicked} />
        <div className="navpill"><i/></div>
      </div>
    </div>
  );

  return (
    <div className="stage">
      <div className="stage-top">
        <div className="brandlock">
          <LogoMark size={34} />
          <div>
            <div className="nm">DirectDrop</div>
            <div className="sub">Przesyłanie plików przez Wi-Fi · prototyp</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="seg">
            <button className={view==='phone'?'on':''} onClick={() => setView('phone')}>
              <Icon name="phone" size={15}/> Telefon
            </button>
            <button className={view==='desktop'?'on':''} onClick={() => setView('desktop')}>
              <Icon name="monitor" size={15}/> Komputer
            </button>
          </div>
          <button className="iconbtn" onClick={() => setDark(d => !d)} title="Motyw">
            <Icon name={dark ? 'sun':'moon'} size={18}/>
          </button>
        </div>
      </div>

      <div className="stage-body">
        {view === 'phone' ? phoneView :
          <DesktopPage onBack={() => setView('phone')} dark={dark} accent={t.accent}/>}
      </div>

      <TweaksPanel>
        <TweakSection label="Marka" />
        <TweakColor label="Kolor akcentu" value={t.accent}
          options={['#1f6feb','#16a34a','#7c3aed','#0d9488','#ea580c','#e5484d']}
          onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </div>
  );
}

/* ===================== DESKTOP DOWNLOAD PAGE ===================== */
function DesktopPage({ onBack, dark, accent }){
  const [items, setItems] = useState(() => DEMO_FILES.map(mkFile));
  const total = items.reduce((s,f) => s + f.size, 0);

  const startDownload = (id) => {
    setItems(it => it.map(f => f.id===id && f.status==='queued' ? { ...f, status:'active', progress:0 } : f));
  };
  const downloadAll = () => setItems(it => it.map(f => f.status==='queued' ? { ...f, status:'active', progress:0 } : f));

  useEffect(() => {
    const active = items.some(f => f.status==='active');
    if(!active) return;
    const id = setInterval(() => {
      setItems(it => it.map(f => {
        if(f.status !== 'active') return f;
        const np = Math.min(100, f.progress + (8 + Math.random()*10));
        return np >= 100 ? { ...f, progress:100, status:'done' } : { ...f, progress:np };
      }));
    }, 140);
    return () => clearInterval(id);
  }, [items]);

  const doneAll = items.length && items.every(f => f.status==='done');

  return (
    <div className="browser">
      <div className="bw-bar">
        <div className="bw-lights">
          <i style={{ background:'#ec6a5e' }}/><i style={{ background:'#f4be4f' }}/><i style={{ background:'#61c454' }}/>
        </div>
        <div className="bw-url"><Icon name="shield" size={14} style={{ color:'var(--success)' }}/> {ADDRESS.replace('http://','')}</div>
        <button className="btn btn--ghost" style={{ height:32, fontSize:13, padding:'0 12px' }} onClick={onBack}>
          <Icon name="phone" size={15}/> Wróć do telefonu
        </button>
      </div>
      <div className="bw-body">
        <div className="dl-wrap">
          {/* header */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:8 }}>
            <LogoMark size={46}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-.03em', color:'var(--ink)' }}>Pliki z telefonu</div>
              <div className="muted" style={{ fontSize:15, fontWeight:500, marginTop:2, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ display:'flex', alignItems:'center', gap:7 }}><Icon name="phone" size={15}/> Pixel 8 Pro</span>
                <span style={{ color:'var(--line-2)' }}>·</span>
                <span className="mono">{items.length} plików · {formatBytes(total)}</span>
              </div>
            </div>
            <span className="pill pill--success pill--live"><span className="dot"/>Połączono</span>
          </div>

          {/* download all */}
          <div className="card" style={{ marginTop:26, padding:'18px 20px', display:'flex', alignItems:'center', gap:16,
            background:'var(--accent-soft)', boxShadow:'inset 0 0 0 1px var(--accent-line)' }}>
            <div style={{ width:46, height:46, borderRadius:14, background:'var(--accent)', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="zip" size={22}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:16, color:'var(--ink)' }}>Pobierz wszystko jako ZIP</div>
              <div className="muted" style={{ fontSize:13.5, fontWeight:500 }}>Jedno archiwum · {formatBytes(total)}</div>
            </div>
            <Button variant="primary" icon="download" onClick={downloadAll}>Pobierz wszystko</Button>
          </div>

          {/* file list */}
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:10 }}>
            {items.map(f => <DesktopFileRow key={f.id} f={f} onDownload={() => startDownload(f.id)} />)}
          </div>

          <div style={{ marginTop:22, display:'flex', alignItems:'center', justifyContent:'center', gap:9,
            fontSize:13, fontWeight:600, color:'var(--ink-3)' }}>
            <Icon name="shield" size={15}/> Transfer odbywa się wyłącznie w Twojej sieci lokalnej. Nic nie trafia do chmury.
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopFileRow({ f, onDownload }){
  const done = f.status==='done', active = f.status==='active';
  return (
    <div className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:16 }}>
      <FileIcon type={f.type} size={46}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:15.5, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.name}</div>
        {active ? (
          <div style={{ marginTop:8, maxWidth:320 }}><ProgressBar value={f.progress}/></div>
        ) : (
          <div className="muted" style={{ fontSize:13.5, fontWeight:600, marginTop:2 }}>{formatBytes(f.size)}</div>
        )}
      </div>
      {done ? (
        <span className="pill pill--success" style={{ padding:'8px 14px' }}><Icon name="check" size={16}/> Pobrano</span>
      ) : active ? (
        <span className="mono" style={{ fontWeight:700, fontSize:15, color:'var(--accent)', width:54, textAlign:'right' }}>{Math.round(f.progress)}%</span>
      ) : (
        <Button variant="secondary" icon="download" onClick={onDownload} style={{ height:44, fontSize:14 }}>Pobierz</Button>
      )}
    </div>
  );
}

Object.assign(window, { App, DesktopPage, DesktopFileRow });

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
