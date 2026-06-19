import { useEffect, useRef, useCallback } from 'react'
import type { FileItem } from '../helpers'

const CHUNK     = 65_536        // 64 KB per binary frame
const MAX_BUF   = 4_194_304     // 4 MB WebSocket backpressure ceiling

export interface TransferCallbacks {
  onProgress:       (name: string, bytesSent: number) => void
  onClientStatus:   (clients: number) => void
  onConnected:      () => void
  onDisconnected:   () => void
}

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

// Build binary frame: [4B reqId uint32BE][1B flags 0x01=last][...data]
function makeFrame(reqId: number, data: Uint8Array, isLast: boolean): ArrayBuffer {
  const frame = new ArrayBuffer(5 + data.byteLength)
  const dv    = new DataView(frame)
  dv.setUint32(0, reqId)
  dv.setUint8(4, isLast ? 1 : 0)
  new Uint8Array(frame, 5).set(data)
  return frame
}

// Send an empty "last" frame to unblock server when file is unavailable
function sendEndFrame(ws: WebSocket, reqId: number) {
  const frame = new ArrayBuffer(5)
  new DataView(frame).setUint32(0, reqId)
  new Uint8Array(frame)[4] = 1
  ws.send(frame)
}

export function useServerTransfer(
  active:      boolean,
  serverHost:  string,
  files:       FileItem[],
  fileObjects: React.MutableRefObject<Map<string, File>>,
  cbs:         TransferCallbacks,
) {
  const wsRef      = useRef<WebSocket | null>(null)
  const cancelled  = useRef(new Set<number>())
  const filesRef   = useRef(files)
  filesRef.current = files

  const streamFile = useCallback(
    async (ws: WebSocket, reqId: number, file: File) => {
      let offset = 0
      while (offset < file.size) {
        if (cancelled.current.has(reqId)) return

        // Backpressure: pause until WebSocket buffer drains
        while (ws.bufferedAmount > MAX_BUF) await sleep(50)

        const end  = Math.min(offset + CHUNK, file.size)
        const ab   = await file.slice(offset, end).arrayBuffer()
        const last = end >= file.size

        ws.send(makeFrame(reqId, new Uint8Array(ab), last))
        offset = end
        cbs.onProgress(file.name, offset)
      }
      cancelled.current.delete(reqId)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    if (!active || !serverHost) return

    const url = `ws://${serverHost}:8080/ws`
    const ws  = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      cbs.onConnected()
      // Register current file metadata with server
      const meta = filesRef.current.map(f => ({ name: f.name, size: f.size, type: f.type }))
      ws.send(JSON.stringify({ type: 'register', files: meta }))
    }

    ws.onmessage = (ev) => {
      if (typeof ev.data !== 'string') return
      const msg = JSON.parse(ev.data as string)

      if (msg.type === 'request') {
        const file = fileObjects.current.get(msg.filename as string)
        if (!file) { sendEndFrame(ws, msg.reqId as number); return }
        cancelled.current.delete(msg.reqId as number)
        streamFile(ws, msg.reqId as number, file).catch(() => {})
      }

      if (msg.type === 'cancel') {
        cancelled.current.add(msg.reqId as number)
      }

      if (msg.type === 'clientStatus') {
        cbs.onClientStatus(msg.clients as number)
      }
    }

    ws.onclose = () => {
      cbs.onDisconnected()
      cancelled.current.clear()
      wsRef.current = null
    }

    ws.onerror = () => ws.close()

    return () => {
      ws.close()
      wsRef.current = null
      cancelled.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, serverHost])
}
