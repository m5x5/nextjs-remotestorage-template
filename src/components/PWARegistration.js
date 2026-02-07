'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker for PWA installability and offline readiness.
 * Runs only in the browser and when the app is served over HTTPS (or localhost).
 */
export function PWARegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        if (reg.waiting) {
          // New version available; could show an "Update available" toast here.
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available; optionally prompt reload.
            }
          })
        })
      } catch (err) {
        console.warn('Service worker registration failed:', err)
      }
    }

    register()
  }, [])

  return null
}
