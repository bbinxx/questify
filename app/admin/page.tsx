"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/config/app-config'

// Keep a lightweight redirect in place so any existing links to /admin
// continue to work and are forwarded to the new `/manage` dashboard.
export default function AdminRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.manage)
  }, [router])
  return null
}