"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard as the main landing page for logged-in users
    // AuthGuard will handle the logic if not logged in
    router.replace("/dashboard")
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
      <div className="text-[10px] tracking-[0.4em] text-white/50 animate-pulse uppercase">
        LOADING_DASHBOARD...
      </div>
    </div>
  )
}
