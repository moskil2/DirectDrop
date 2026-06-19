/* screens.jsx — DirectDrop screen views */

/* ===================== HOME ===================== */
function HomeScreen({ brand, onSelectFiles }){
  return (
    <div className="screen-scroll view-anim">
      <div style={{ padding:'28px 24px 120px', minHeight:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <LogoMark size={38} />
            <span style={{ fontWeight:800, fontSize:18, letterSpacing:'-.02em', color:'var(--ink)' }}>{brand}</span>
          </div>
          <span className="chip"><Icon name="shield" size={14}/> Lokalnie</span>
        </div>

        {/* hero */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'34px 0' }}>
          <div className="card" style={{ padding:'30px 26px', textAlign:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(420px 200px at 50% -20%, var(--accent-soft), transparent 70%)', pointerEvents:'none' }}/>
            <div style={{ position:'relative' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:22 }}>
                <HeroBeam/>
              </div>
              <div className="h1" style={{ marginBottom:12 }}>Wyślij pliki<br/>prosto na komputer</div>
              <div className="muted" style={{ fontSize:15.5, lineHeight:1.5, fontWeight:500, maxWidth:300, margin:'0 auto' }}>
                Twój telefon staje się serwerem. Pobieranie przez przeglądarkę w tej samej sieci Wi-Fi — bez chmury i kabli.
              </div>
            </div>
          </div>
        </div>

        {/* feature chips */}
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:22, flexWrap:'wrap' }}>
          {[['bolt','Duże pliki'],['shield','Bez konta'],['wifi','Tylko Wi-Fi']].map(([ic,t]) =>
            <span key={t} className="chip"><Icon name={ic} size={14}/>{t}</span>
          )}
        </div>

        <div className="bottombar">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Button variant="primary" block icon="upload" onClick={onSelectFiles}>Wybierz pliki</Button>
            <Button variant="secondary" block icon="folder" disabled>
              Wybierz folder <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)', background:'var(--accent-soft)', padding:'3px 8px', borderRadius:99, marginLeft:2 }}>Wkrótce</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroBeam(){
  return (
    <div style={{ display:'flex', alignItems:'center', gap:18 }}>
      <Dev icon="phone" label="Telefon" accent/>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
        {[0,1,2].map(i =>
          <span key={i} style={{ width:7, height:7, borderRadius:99, background:'var(--accent)',
            opacity:.85, animation:`beam 1.2s ${i*0.18}s infinite` }}/>
        )}
        <style>{`@keyframes beam{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}`}</style>
      </div>
      <Dev icon="monitor" label="PC"/>
    </div>
  );
}
function Dev({ icon, label, accent }){
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ width:62, height:62, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center',
        background: accent ? 'var(--accent)' : 'var(--card-2)', color: accent ? '#fff' : 'var(--ink-2)',
        boxShadow: accent ? '0 8px 20px color-mix(in srgb,var(--accent) 38%,transparent)' : 'inset 0 0 0 1px var(--line)' }}>
        <Icon name={icon} size={28}/>
      </div>
      <span style={{ fontSize:12, fontWeight:700, color:'var(--ink-2)' }}>{label}</span>
    </div>
  );
}

/* ===================== SELECTION ===================== */
function SelectionScreen({ brand, files, onBack, onRemove, onAddMore, onStart }){
  const total = files.reduce((s,f) => s + f.size, 0);
  return (
    <div className="screen-scroll view-anim">
      <div style={{ padding:'20px 20px 150px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
          <button className="iconbtn" onClick={onBack}><Icon name="back" size={20}/></button>
          <div style={{ flex:1 }}>
            <div className="h2">Wybrane pliki</div>
            <div className="muted" style={{ fontSize:13, fontWeight:600, marginTop:1 }}>{files.length} {files.length===1?'plik':'plików'} · {formatBytes(total)}</div>
          </div>
          <button className="iconbtn" onClick={onAddMore}><Icon name="plus" size={20}/></button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {files.map(f =>
            <div key={f.id} className="frow">
              <FileIcon type={f.type}/>
              <div className="meta">
                <div className="nm">{f.name}</div>
                <div className="sz">{formatBytes(f.size)}</div>
              </div>
              <button className="iconbtn" style={{ width:36, height:36 }} onClick={() => onRemove(f.id)}>
                <Icon name="x" size={17}/>
              </button>
            </div>
          )}
          <button className="btn btn--ghost" style={{ marginTop:2, justifyContent:'center' }} onClick={onAddMore}>
            <Icon name="plus" size={18}/> Dodaj więcej plików
          </button>
        </div>
      </div>

      <div className="bottombar">
        <div className="row">
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12.5, fontWeight:600, color:'var(--ink-2)' }}>Łącznie</div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-.02em', color:'var(--ink)', fontFamily:'var(--mono)' }}>{formatBytes(total)}</div>
          </div>
          <Button variant="primary" icon="wifi" iconAfter="arrowR" onClick={onStart} disabled={!files.length}>Udostępnij</Button>
        </div>
      </div>
    </div>
  );
}

/* ===================== SHARING ===================== */
function SharingScreen({ brand, address, files, clients, started, anyActive, allDone,
  onCopy, copied, onStop, onPreviewPC, onConnect }){
  const total = files.reduce((s,f) => s + f.size, 0);
  const doneCount = files.filter(f => f.status==='done').length;
  const overall = total ? files.reduce((s,f) => s + f.size*(f.progress/100), 0)/total*100 : 0;
  const showActivity = anyActive || allDone;
  return (
    <div className="screen-scroll view-anim">
      <div style={{ padding:'18px 20px 120px' }}>
        {/* status header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <span className="pill pill--success pill--live"><span className="dot"/>Udostępnianie aktywne</span>
          <button className="iconbtn" onClick={onPreviewPC} title="Podgląd strony PC"><Icon name="monitor" size={19}/></button>
        </div>

        {!showActivity ? (
          <React.Fragment>
            {/* big QR */}
            <div className="card" style={{ padding:'24px 22px', textAlign:'center' }}>
              <div className="eyebrow" style={{ marginBottom:14 }}>Zeskanuj telefonem lub wpisz adres</div>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
                <div className="qrbox"><QR text={address} size={188}/></div>
              </div>
              <div className="addr">
                <Icon name="link" size={17} style={{ color:'var(--ink-3)', flexShrink:0 }}/>
                <span className="url" style={{ textAlign:'left' }}>{address.replace('http://','')}</span>
                <button className={`btn btn--${copied ? 'secondary':'primary'}`} onClick={onCopy}
                  title="Kopiuj adres" style={{ height:40, width:40, padding:0, borderRadius:12, flexShrink:0 }}>
                  <Icon name={copied ? 'check':'copy'} size={18}/>
                </button>
              </div>
              {copied && <div style={{ marginTop:8, fontSize:12.5, fontWeight:700, color:'var(--success)' }}>Skopiowano do schowka</div>}
            </div>

            <div className="stats" style={{ marginTop:14 }}>
              <div className="stat"><div className="v">{files.length}</div><div className="k">plików</div></div>
              <div className="stat"><div className="v">{formatBytes(total)}</div><div className="k">rozmiar</div></div>
              <div className="stat"><div className="v">{clients}</div><div className="k">{clients===1?'urządzenie':'urządzeń'}</div></div>
            </div>

            <div className="card" style={{ marginTop:14, padding:'20px 18px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:13, background:'var(--amber-soft)', color:'var(--amber)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span className="dot" style={{ width:10, height:10, borderRadius:99, background:'currentColor', animation:'livePulse 1.4s infinite' }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15, color:'var(--ink)' }}>Oczekiwanie na komputer…</div>
                <div className="muted" style={{ fontSize:13, fontWeight:500, marginTop:1 }}>Otwórz adres w przeglądarce na PC</div>
              </div>
              <button className="btn btn--secondary" style={{ height:38, fontSize:13, padding:'0 12px' }} onClick={onConnect}>Symuluj</button>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            {/* compact share bar */}
            <div className="card" style={{ padding:14, display:'flex', alignItems:'center', gap:14 }}>
              <div className="qrbox" style={{ padding:8, borderRadius:16 }}><QR text={address} size={62}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="mono" style={{ fontWeight:700, fontSize:14.5, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{address.replace('http://','')}</div>
                <div className="muted" style={{ fontSize:12.5, fontWeight:600, marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
                  <Icon name="monitor" size={13}/> {clients} {clients===1?'urządzenie połączone':'urządzeń połączonych'}
                </div>
              </div>
              <button className="iconbtn" onClick={onCopy} title="Kopiuj adres"><Icon name={copied?'check':'copy'} size={18}/></button>
            </div>

            {/* overall progress */}
            <div className="card" style={{ marginTop:12, padding:'16px 18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:11 }}>
                <div style={{ fontWeight:800, fontSize:15.5, color:'var(--ink)', letterSpacing:'-.01em' }}>{allDone ? 'Zakończono' : 'Przesyłanie…'}</div>
                <div className="mono" style={{ fontWeight:800, fontSize:16, color: allDone?'var(--success)':'var(--accent)' }}>{Math.round(overall)}%</div>
              </div>
              <ProgressBar value={overall} done={allDone}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, fontSize:12.5, fontWeight:600 }}>
                <span className="muted">{doneCount} z {files.length} plików</span>
                <span className="muted mono">{formatBytes(total*overall/100)} / {formatBytes(total)}</span>
              </div>
            </div>

            {/* list */}
            <div style={{ marginTop:18 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div className="eyebrow">Transfery na żywo</div>
                <span className="pill pill--success pill--live" style={{ padding:'5px 11px', fontSize:12 }}><span className="dot"/>na żywo</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {files.map(f => <TransferRow key={f.id} f={f}/>)}
              </div>
            </div>
          </React.Fragment>
        )}
      </div>

      <div className="bottombar">
        <Button variant="danger" block icon="stop" onClick={onStop}>Zatrzymaj udostępnianie</Button>
      </div>
    </div>
  );
}

function TransferRow({ f }){
  const done = f.status==='done';
  const speed = f.speed || 0;
  return (
    <div className="card" style={{ padding:'14px 15px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:11 }}>
        <FileIcon type={f.type} size={40}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="nm" style={{ fontWeight:700, fontSize:14.5, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.name}</div>
          <div style={{ fontSize:12.5, fontWeight:600, color:'var(--ink-2)', marginTop:1 }}>
            {formatBytes(f.size*f.progress/100)} / {formatBytes(f.size)}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontWeight:800, fontSize:15, fontFamily:'var(--mono)', color: done ? 'var(--success)':'var(--ink)' }}>
            {Math.round(f.progress)}%
          </div>
        </div>
      </div>
      <ProgressBar value={f.progress} done={done}/>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:9, fontSize:12.5, fontWeight:600 }}>
        {done ? (
          <span style={{ color:'var(--success)', display:'flex', alignItems:'center', gap:6 }}><Icon name="check" size={15}/> Zakończono</span>
        ) : (
          <span style={{ color:'var(--accent)', display:'flex', alignItems:'center', gap:6 }}><Icon name="bolt" size={14}/> {formatSpeed(speed)}</span>
        )}
        <span className="muted" style={{ display:'flex', alignItems:'center', gap:6 }}>
          {!done && <><Icon name="clock" size={14}/> {formatTime(f.eta)}</>}
        </span>
      </div>
    </div>
  );
}

/* ===================== COMPLETED ===================== */
function CompletedScreen({ files, durationSec, avgSpeed, onMore, onClose }){
  const total = files.reduce((s,f) => s + f.size, 0);
  return (
    <div className="screen-scroll view-anim">
      <div style={{ padding:'24px 24px 130px', minHeight:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', textAlign:'center' }}>
          <div className="checkring">
            <div className="core"><Icon name="check" size={38} stroke={2.6} style={{ color:'#fff' }}/></div>
          </div>
          <div className="h1" style={{ marginTop:30, marginBottom:8 }}>Przesłano!</div>
          <div className="muted" style={{ fontSize:15.5, fontWeight:500, maxWidth:280, margin:'0 auto' }}>
            Wszystkie pliki zostały pobrane na komputer w sieci lokalnej.
          </div>

          <div className="card" style={{ marginTop:30, padding:'6px' }}>
            <div className="stats" style={{ gap:6 }}>
              <div className="stat" style={{ background:'transparent', boxShadow:'none' }}><div className="v">{files.length}</div><div className="k">plików</div></div>
              <div className="stat" style={{ background:'transparent', boxShadow:'none' }}><div className="v">{formatBytes(total)}</div><div className="k">przesłano</div></div>
              <div className="stat" style={{ background:'transparent', boxShadow:'none' }}><div className="v">{Math.round(avgSpeed)}</div><div className="k">MB/s śr.</div></div>
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <span className="chip"><Icon name="clock" size={14}/> Czas: {formatTime(durationSec)}</span>
          </div>
        </div>

        <div className="bottombar">
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <Button variant="primary" block icon="upload" onClick={onMore}>Udostępnij kolejne pliki</Button>
            <Button variant="secondary" block onClick={onClose}>Zamknij sesję</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, SelectionScreen, SharingScreen, TransferRow, CompletedScreen });
