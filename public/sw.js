// Minimal service worker for PWA installability and offline readiness.
// Keeps the app installable; does not cache pages to avoid breaking dynamic/RemoteStorage data.

const CACHE_NAME = 'next-rs-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  // Let all requests go to the network; no offline cache for app shell.
  // Add precaching or runtime caching here if you want offline support later.
  event.respondWith(fetch(event.request))
})
