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
        const userDoc = await getDoc(doc(db!, 'users', firebaseUser.uid));
        const userData = userDoc.data();

        // If user already has a project and tries to visit onboarding, redirect to home
        if (userData?.hasProject && pathname === '/onboarding') {
          router.push('/');
          return;
        }

        // Skip other checks for auth/feedback pages and onboarding (if not already handled)
        if (pathname === '/onboarding' || pathname.startsWith('/auth') || pathname.startsWith('/feedback')) return;
        
        if (!userData?.hasProject) {
          router.push('/onboarding');
        }
      }
    }

    if (!isLoading) {
      if (!firebaseUser && !pathname.startsWith('/auth') && !pathname.startsWith('/feedback') && !pathname.startsWith('/desk') && pathname !== '/dashboard' && pathname !== '/') {
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
