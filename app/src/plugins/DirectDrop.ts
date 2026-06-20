import { registerPlugin } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'

export interface NativeFile {
  name: string
  size: number
  uri: string
}

export interface ServerInfo {
  ip: string
  port: number
  address: string
}

export interface ConnectedClient {
  ip: string
  userAgent: string
  connectedAt: number
}

export interface DirectDropPlugin {
  /** Open Android file picker; returns selected files with content URIs */
  pickFiles(): Promise<{ files: NativeFile[] }>

  /** Start embedded HTTP server on given port */
  startServer(opts: { port: number }): Promise<ServerInfo>

  /** Stop HTTP server */
  stopServer(): Promise<void>

  /** Update the list of files served (after server is already running) */
  registerFiles(opts: { files: NativeFile[] }): Promise<void>

  /** Sync dark/light theme to PC download page */
  setTheme(opts: { dark: boolean }): Promise<void>

  /** Sync UI language to PC download page */
  setLang(opts: { lang: string }): Promise<void>

  /** Stop server and kill the app process */
  exitApp(): Promise<void>

  /** Check server status */
  getStatus(): Promise<{ running: boolean; ip: string }>

  /** Fired when a PC browser connects for the first time */
  addListener(
    event: 'clientConnected',
    cb: (data: { count: number; clients: ConnectedClient[] }) => void
  ): Promise<PluginListenerHandle>

  /** Fired every ~64KB of a file being downloaded */
  addListener(
    event: 'fileProgress',
    cb: (data: { name: string; bytesSent: number; total: number }) => void
  ): Promise<PluginListenerHandle>

  /** Fired when PC selects a file to send to the phone */
  addListener(
    event: 'uploadIntent',
    cb: (data: { files: Array<{ name: string; size: number }>; total: number }) => void
  ): Promise<PluginListenerHandle>

  /** Fired when an incoming file from PC has been saved */
  addListener(
    event: 'uploadComplete',
    cb: (data: { name: string; path: string }) => void
  ): Promise<PluginListenerHandle>

  /** Accept or reject an incoming file from PC */
  confirmUpload(opts: { accepted: boolean }): Promise<void>

  /** Check for files shared via Android share sheet on cold start */
  getPendingShare(): Promise<{ files: NativeFile[] }>

  /** Fired when files are shared to DirectDrop while app is already running */
  addListener(
    event: 'filesFromShare',
    cb: (data: { files: NativeFile[] }) => void
  ): Promise<PluginListenerHandle>

  removeAllListeners(): Promise<void>
}

// Web stub — used when running in browser (demo mode)
const webStub: DirectDropPlugin = {
  pickFiles: () => Promise.resolve({ files: [] }),
  startServer: () => Promise.resolve({ ip: window.location.hostname, port: 8080, address: `http://${window.location.hostname}:8080` }),
  stopServer: () => Promise.resolve(),
  registerFiles: () => Promise.resolve(),
  setTheme: () => Promise.resolve(),
  setLang: () => Promise.resolve(),
  exitApp: () => Promise.resolve(),
  getStatus: () => Promise.resolve({ running: false, ip: window.location.hostname }),
  addListener: (_e, _cb) => Promise.resolve({ remove: () => Promise.resolve() }),
  confirmUpload: () => Promise.resolve(),
  getPendingShare: () => Promise.resolve({ files: [] }),
  removeAllListeners: () => Promise.resolve(),
}

export const DirectDrop = registerPlugin<DirectDropPlugin>('DirectDrop', {
  web: () => webStub,
})
