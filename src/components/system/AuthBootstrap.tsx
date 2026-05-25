'use client'

import { useEffect } from 'react'
import { ensureGuestSession } from '@/lib/auth'

export function AuthBootstrap() {
  useEffect(() => {
    ensureGuestSession().catch(err => {
      console.error('[auth] guest session failed', err)
    })
  }, [])
  return null
}
