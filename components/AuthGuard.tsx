"use client"

import { useEffect } from "react"
import { useStore } from "@/lib/store"
import { usePathname, useRouter } from "next/navigation"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
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

        // If user already has a project and tries to visit onboarding WITHOUT a projectId, redirect to home
        const hasProjectId = typeof window !== 'undefined' && window.location.search.includes('projectId=');
        if (userData?.hasProject && pathname === '/onboarding' && !hasProjectId) {
          router.push('/');
          return;
        }

        // Skip other checks for auth/feedback pages and onboarding (if not already handled)
        if (pathname === '/onboarding' || pathname.startsWith('/auth') || pathname.startsWith('/feedback') || pathname.startsWith('/activate')) return;
        
        if (!userData?.hasProject) {
          // Fallback: check if user actually has a project in the projects collection
          // (covers users who signed up via CLI before hasProject flag existed)
          const projectsSnap = await getDocs(
            query(collection(db!, 'projects'), where('ownerId', '==', firebaseUser.uid))
          );
          if (!projectsSnap.empty) {
            // They have a project — update the flag and proceed
            const { setDoc } = await import('firebase/firestore');
            await setDoc(doc(db!, 'users', firebaseUser.uid), { hasProject: true }, { merge: true });
          } else {
            router.push('/onboarding');
          }
        }
      }
    }

    if (!isLoading) {
      if (!firebaseUser && !pathname.startsWith('/auth') && !pathname.startsWith('/feedback') && !pathname.startsWith('/desk') && !pathname.startsWith('/activate') && pathname !== '/dashboard' && pathname !== '/') {
        router.push('/auth')
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
