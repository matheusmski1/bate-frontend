import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? ''

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket
  socket = SOCKET_URL
    ? io(SOCKET_URL, { autoConnect: true, transports: ['websocket'] })
    : io({ autoConnect: true, transports: ['websocket'] })
  return socket
}
