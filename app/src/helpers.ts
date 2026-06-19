export function formatBytes(b: number): string {
  if (b >= 1e9) return (b / 1e9).toFixed(b / 1e9 >= 10 ? 0 : 2) + ' GB'
  if (b >= 1e6) return (b / 1e6).toFixed(b / 1e6 >= 10 ? 0 : 1) + ' MB'
  if (b >= 1e3) return Math.round(b / 1e3) + ' KB'
  return b + ' B'
}

export function formatSpeed(mbs: number): string {
  return mbs.toFixed(mbs >= 10 ? 0 : 1) + ' MB/s'
}

export function formatTime(s: number | null): string {
  if (s == null || !isFinite(s)) return '--'
  s = Math.max(0, Math.round(s))
  if (s < 60) return s + ' s'
  const m = Math.floor(s / 60), r = s % 60
  return m + ' min' + (r ? ' ' + r + ' s' : '')
}

export type FileType = 'video' | 'image' | 'map' | 'music' | 'doc' | 'file'

export function extType(name: string): FileType {
  const e = (name.split('.').pop() || '').toLowerCase()
  if (['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'].includes(e)) return 'video'
  if (['jpg', 'jpeg', 'png', 'heic', 'webp', 'gif', 'raw', 'dng'].includes(e)) return 'image'
  if (['gpx', 'kml', 'geojson'].includes(e)) return 'map'
  if (['mp3', 'wav', 'flac', 'm4a', 'aac'].includes(e)) return 'music'
  if (['pdf', 'doc', 'docx', 'txt', 'zip', 'csv'].includes(e)) return 'doc'
  return 'file'
}

export const FTYPE: Record<FileType, { icon: string; hue: number }> = {
  video: { icon: 'video', hue: 266 },
  image: { icon: 'image', hue: 28 },
  map:   { icon: 'map',   hue: 150 },
  music: { icon: 'music', hue: 332 },
  doc:   { icon: 'doc',   hue: 212 },
  file:  { icon: 'file',  hue: 212 },
}

export interface FileItem {
  id: number
  name: string
  size: number
  type: FileType
  progress: number
  status: 'queued' | 'active' | 'done'
  speed: number
  eta: number | null
}

export interface ParsedUserAgent {
  category: 'desktop' | 'mobile'
  os: string
  browser: string
}

export function parseUserAgent(ua: string): ParsedUserAgent {
  const isMobile = /Mobi|iPhone|iPad|Android/.test(ua)
  let os = 'Unknown'
  if (/Windows NT/.test(ua)) os = 'Windows'
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/Linux/.test(ua)) os = 'Linux'

  let browser = 'Unknown'
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/OPR\//.test(ua)) browser = 'Opera'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Safari\//.test(ua)) browser = 'Safari'

  return { category: isMobile ? 'mobile' : 'desktop', os, browser }
}

let _uid = 1
export const mkFile = (f: { name: string; size: number; type?: FileType }): FileItem => ({
  id: _uid++,
  name: f.name,
  size: f.size,
  type: f.type ?? extType(f.name),
  progress: 0,
  status: 'queued',
  speed: 0,
  eta: null,
})
