"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { usePathname, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, isLoading, init } = useStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    const checkOnboarding = async () => {
      if (firebaseUser && !isLoading) {
        // Skip check for onboarding/auth/feedback pages
        if (pathname === '/onboarding' || pathname.startsWith('/auth') || pathname.startsWith('/feedback')) return;

        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        if (!userData?.hasProject) {
          router.push('/onboarding');
        }
      }
    }

    if (!isLoading) {
      if (!firebaseUser && !pathname.startsWith('/auth') && !pathname.startsWith('/feedback')) {
        router.push('/auth')
      } else if (firebaseUser && pathname === '/auth') {
        router.push('/')
      } else {
        checkOnboarding();
      }
    }
  }, [firebaseUser, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="text-[10px] tracking-[0.4em] text-[#F95A56] animate-pulse uppercase">
          SYSTEM_INITIALIZING...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
