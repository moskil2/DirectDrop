import React from 'react'

export type IconName =
  | 'upload' | 'folder' | 'arrowR' | 'chevR' | 'back' | 'plus' | 'x'
  | 'copy' | 'check' | 'stop' | 'wifi' | 'monitor' | 'phone' | 'shield'
  | 'download' | 'zip' | 'video' | 'image' | 'map' | 'music' | 'file'
  | 'doc' | 'bolt' | 'clock' | 'refresh' | 'sun' | 'moon' | 'qr' | 'link' | 'users'
  | 'menu' | 'device' | 'mail' | 'heart'

interface IconProps {
  name: IconName
  size?: number
  stroke?: number
  style?: React.CSSProperties
  className?: string
}

const PATHS: Record<IconName, React.ReactNode> = {
  upload:   <><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 20h14"/></>,
  folder:   <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
  arrowR:   <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
  chevR:    <><path d="M9 6l6 6-6 6"/></>,
  back:     <><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></>,
  plus:     <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  x:        <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>,
  copy:     <><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></>,
  check:    <><path d="M5 12.5l4.5 4.5L19 7"/></>,
  stop:     <><rect x="6" y="6" width="12" height="12" rx="3"/></>,
  wifi:     <><path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5 12a11 11 0 0 1 14 0"/><path d="M8.5 15.5a6 6 0 0 1 7 0"/><path d="M12 19h.01"/></>,
  monitor:  <><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/></>,
  phone:    <><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></>,
  shield:   <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></>,
  download: <><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></>,
  zip:      <><path d="M5 4a2 2 0 0 1 2-2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M14 2v5h5"/><path d="M11 8h1.5M11 11h1.5M11 14h1.5"/></>,
  video:    <><rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10l5-3v10l-5-3z"/></>,
  image:    <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M5 17l4.5-4.5 4 3.5L17 11l3 3"/></>,
  map:      <><path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z"/><path d="M9 4v14M15 6v14"/></>,
  music:    <><circle cx="7" cy="17" r="2.6"/><circle cx="18" cy="15" r="2.6"/><path d="M9.6 17V6l11-2v11"/></>,
  file:     <><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/></>,
  doc:      <><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16h6"/></>,
  bolt:     <><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></>,
  clock:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  refresh:  <><path d="M4 12a8 8 0 0 1 14-5l2 2"/><path d="M20 5v4h-4"/><path d="M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M4 19v-4h4"/></>,
  sun:      <><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></>,
  moon:     <><path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z"/></>,
  qr:       <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M21 21v-4M14 21h3"/></>,
  link:     <><path d="M9 13a4 4 0 0 0 6 0l2-2a4 4 0 0 0-6-6l-1 1"/><path d="M15 11a4 4 0 0 0-6 0l-2 2a4 4 0 0 0 6 6l1-1"/></>,
  users:    <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9"/></>,
  menu:     <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  device:   <><rect x="1.5" y="8" width="9.5" height="8" rx="1"/><circle cx="6.25" cy="8.8" r="0.5" fill="currentColor" stroke="none"/><rect x="1" y="20" width="10.5" height="2" rx="0.7"/><line x1="4" y1="21" x2="7.5" y2="21"/><rect x="12.5" y="12.5" width="5" height="9.5" rx="1.2"/><circle cx="15" cy="13.3" r="0.5" fill="currentColor" stroke="none"/><rect x="18.5" y="15" width="3.5" height="7" rx="1.2"/><line x1="19.3" y1="16.3" x2="21.2" y2="16.3"/><line x1="19.3" y1="21" x2="21.2" y2="21"/></>,
  mail:     <><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7l8 6 8-6"/></>,
  heart:    <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
}

export default function Icon({ name, size = 24, stroke = 2, style, className }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className}
    >
      {PATHS[name]}
    </svg>
  )
}
