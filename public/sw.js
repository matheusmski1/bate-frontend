const CACHE_VERSION = 'batinho-v1'
const STATIC_ASSETS = ['/icon.png', '/icon-large.png', '/apple-icon.png', '/manifest.webmanifest']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => undefined),
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/cards/') || url.pathname.startsWith('/batinho/')) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async cache => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        try {
          const fresh = await fetch(event.request)
          if (fresh.ok) cache.put(event.request, fresh.clone())
          return fresh
        } catch {
          return cached ?? Response.error()
        }
      }),
    )
    return
  }
  if (url.pathname.startsWith('/socket.io/') || url.pathname.startsWith('/auth/') || url.pathname.startsWith('/health')) {
    return
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(r => r ?? Response.error())),
  )
})
