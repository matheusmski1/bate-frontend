import { io, type Socket } from 'socket.io-client'
import { ensureGuestSession } from './auth'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? ''

let socket: Socket | null = null
let connectPromise: Promise<Socket> | null = null

function createSocket(): Socket {
  return SOCKET_URL
    ? io(SOCKET_URL, { autoConnect: true, transports: ['websocket'], withCredentials: true })
    : io({ autoConnect: true, transports: ['websocket'], withCredentials: true })
}

export function getSocket(): Socket {
  if (!socket) socket = createSocket()
  return socket
}

export async function ensureSocketConnected(): Promise<Socket> {
  if (connectPromise) return connectPromise
  connectPromise = (async () => {
    await ensureGuestSession()
    return getSocket()
  })()
  try {
    return await connectPromise
  } catch (err) {
    connectPromise = null
    throw err
  }
}
