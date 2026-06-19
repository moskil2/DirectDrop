/* ui.jsx — DirectDrop primitives, icons, helpers */
const { useState, useEffect, useRef } = React;

/* ---------------- helpers ---------------- */
function formatBytes(b){
  if(b >= 1e9) return (b/1e9).toFixed(b/1e9 >= 10 ? 0 : 2) + ' GB';
  if(b >= 1e6) return (b/1e6).toFixed(b/1e6 >= 10 ? 0 : 1) + ' MB';
  if(b >= 1e3) return Math.round(b/1e3) + ' KB';
  return b + ' B';
}
function formatSpeed(mbs){ return mbs.toFixed(mbs >= 10 ? 0 : 1) + ' MB/s'; }
function formatTime(s){
  if(s == null || !isFinite(s)) return '—';
  s = Math.max(0, Math.round(s));
  if(s < 60) return s + ' s';
  const m = Math.floor(s/60), r = s%60;
  return m + ' min' + (r ? ' ' + r + ' s' : '');
}

/* ---------------- icons (simple line set) ---------------- */
function Icon({ name, size = 24, stroke = 2, style }){
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none',
    stroke:'currentColor', strokeWidth:stroke, strokeLinecap:'round', strokeLinejoin:'round', style };
  const P = {
    upload:    <><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 20h14"/></>,
    folder:    <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
    arrowR:    <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    chevR:     <><path d="M9 6l6 6-6 6"/></>,
    back:      <><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></>,
    plus:      <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    x:         <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>,
    copy:      <><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></>,
    check:     <><path d="M5 12.5l4.5 4.5L19 7"/></>,
    stop:      <><rect x="6" y="6" width="12" height="12" rx="3"/></>,
    wifi:      <><path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5 12a11 11 0 0 1 14 0"/><path d="M8.5 15.5a6 6 0 0 1 7 0"/><path d="M12 19h.01"/></>,
    monitor:   <><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/></>,
    phone:     <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></>,
    shield:    <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></>,
    download:  <><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></>,
    zip:       <><path d="M5 4a2 2 0 0 1 2-2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M14 2v5h5"/><path d="M11 8h1.5M11 11h1.5M11 14h1.5"/></>,
    video:     <><rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10l5-3v10l-5-3z"/></>,
    image:     <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M5 17l4.5-4.5 4 3.5L17 11l3 3"/></>,
    map:       <><path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z"/><path d="M9 4v14M15 6v14"/></>,
    music:     <><circle cx="7" cy="17" r="2.6"/><circle cx="18" cy="15" r="2.6"/><path d="M9.6 17V6l11-2v11"/></>,
    file:      <><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/></>,
    doc:       <><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16h6"/></>,
    bolt:      <><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></>,
    clock:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    refresh:   <><path d="M4 12a8 8 0 0 1 14-5l2 2"/><path d="M20 5v4h-4"/><path d="M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M4 19v-4h4"/></>,
    sun:       <><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></>,
    moon:      <><path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z"/></>,
    qr:        <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M21 21v-4M14 21h3"/></>,
    link:      <><path d="M9 13a4 4 0 0 0 6 0l2-2a4 4 0 0 0-6-6l-1 1"/><path d="M15 11a4 4 0 0 0-6 0l-2 2a4 4 0 0 0 6 6l1-1"/></>,
    users:     <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9"/></>,
  };
  return <svg {...p}>{P[name] || null}</svg>;
}

/* file-type → icon + tint */
const FTYPE = {
  video: { icon:'video', hue:266 },
  image: { icon:'image', hue:28  },
  map:   { icon:'map',   hue:150 },
  music: { icon:'music', hue:332 },
  doc:   { icon:'doc',   hue:212 },
  file:  { icon:'file',  hue:212 },
};
function extType(name){
  const e = (name.split('.').pop() || '').toLowerCase();
  if(['mp4','mov','mkv','avi','webm','m4v'].includes(e)) return 'video';
  if(['jpg','jpeg','png','heic','webp','gif','raw','dng'].includes(e)) return 'image';
  if(['gpx','kml','geojson'].includes(e)) return 'map';
  if(['mp3','wav','flac','m4a','aac'].includes(e)) return 'music';
  if(['pdf','doc','docx','txt','zip','csv'].includes(e)) return 'doc';
  return 'file';
}
function FileIcon({ type, size = 48 }){
  const t = FTYPE[type] || FTYPE.file;
  const bg = `oklch(0.93 0.06 ${t.hue})`;
  const fg = `oklch(0.52 0.16 ${t.hue})`;
  const dark = document.body.classList.contains('stage-dark');
  return (
    <div className="fic" style={{
      width:size, height:size,
      background: dark ? `oklch(0.32 0.05 ${t.hue})` : bg,
      color: dark ? `oklch(0.82 0.12 ${t.hue})` : fg,
    }}>
      <Icon name={t.icon} size={size*0.5} stroke={2} />
    </div>
  );
}

/* ---------------- Button ---------------- */
function Button({ variant='primary', block, children, icon, iconAfter, ...rest }){
  return (
    <button className={`btn btn--${variant}${block ? ' btn--block':''}`} {...rest}>
      {icon && <Icon name={icon} size={20} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={20} className="chev" />}
    </button>
  );
}

/* ---------------- QR code (real, via qrcode-generator) ---------------- */
function QR({ text, size = 188, fg = '#15130e' }){
  const cells = React.useMemo(() => {
    try{
      const qr = qrcode(0, 'M');
      qr.addData(text); qr.make();
      const n = qr.getModuleCount();
      const arr = [];
      for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(qr.isDark(r,c)) arr.push([r,c]);
      return { n, arr };
    }catch(e){ return { n:21, arr:[] }; }
  }, [text]);
  const { n, arr } = cells;
  const unit = size / n;
  const isFinder = (r,c) => (r<7&&c<7) || (r<7&&c>=n-7) || (r>=n-7&&c<7);
  // finder eyes drawn as rounded squares
  const eye = (R,C) => (
    <g key={`e${R}${C}`}>
      <rect x={C*unit} y={R*unit} width={7*unit} height={7*unit} rx={2.4*unit} fill={fg}/>
      <rect x={(C+1)*unit} y={(R+1)*unit} width={5*unit} height={5*unit} rx={1.7*unit} fill="#fff"/>
      <rect x={(C+2)*unit} y={(R+2)*unit} width={3*unit} height={3*unit} rx={1*unit} fill={fg}/>
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:'block'}}>
      {arr.filter(([r,c]) => !isFinder(r,c)).map(([r,c],i) =>
        <rect key={i} x={c*unit+unit*0.13} y={r*unit+unit*0.13} width={unit*0.74} height={unit*0.74} rx={unit*0.3} fill={fg}/>
      )}
      {eye(0,0)}{eye(0,n-7)}{eye(n-7,0)}
    </svg>
  );
}

/* ---------------- ProgressBar ---------------- */
function ProgressBar({ value, done }){
  return (
    <div className={`prog${done ? ' is-done':''}`}>
      <i style={{ width: Math.max(0, Math.min(100, value)) + '%' }} />
    </div>
  );
}

/* ---------------- Logo mark ---------------- */
function LogoMark({ size = 44, radius }){
  return (
    <div className="logo" style={{ width:size, height:size, borderRadius: radius || size*0.3 }}>
      <svg width={size*0.52} height={size*0.52} viewBox="0 0 24 24" fill="none"
        stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 17V5"/><path d="M6.5 10.5L12 5l5.5 5.5"/><path d="M5 19h14"/>
      </svg>
    </div>
  );
}

Object.assign(window, {
  formatBytes, formatSpeed, formatTime, Icon, FileIcon, extType, FTYPE,
  Button, QR, ProgressBar, LogoMark,
});
