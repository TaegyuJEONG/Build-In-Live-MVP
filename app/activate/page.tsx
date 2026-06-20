"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Terminal, Check, Loader2, ShieldCheck, LogIn, User } from "lucide-react"

function ActivateContent() {
  const { firebaseUser } = useStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const codeParam = searchParams.get('code')

  const [inputCode, setInputCode] = useState(codeParam || '')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [needsName, setNeedsName] = useState(false)
  const [userName, setUserName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)

  // Pre-fill code from URL
  useEffect(() => {
    if (codeParam) setInputCode(codeParam.toUpperCase())
  }, [codeParam])

  // Check if logged-in user has a name set
  useEffect(() => {
    if (firebaseUser === null) { setCheckingProfile(false); return }
    if (!firebaseUser || !db) return
    const check = async () => {
      const userSnap = await getDoc(doc(db!, 'users', firebaseUser.uid))
      const data = userSnap.data()
      if (!data?.displayName && !firebaseUser.displayName) {
        setNeedsName(true)
      }
      setCheckingProfile(false)
    }
    check()
  }, [firebaseUser])

  const handleNameSubmit = async () => {
    if (!firebaseUser || !db || !userName.trim()) return
    setNameSaving(true)
    try {
      await setDoc(doc(db!, 'users', firebaseUser.uid), {
        displayName: userName.trim(),
        email: firebaseUser.email,
      }, { merge: true })
      setNeedsName(false)
    } finally {
      setNameSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!firebaseUser || !auth) return
    if (!inputCode.trim()) {
      setErrorMsg('Please enter the code shown in your terminal.')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const idToken = await firebaseUser.getIdToken()

      const res = await fetch('/api/auth/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode: inputCode.trim(), idToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || 'Authorization failed. Please check the code and try again.')
        return
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  // Profile check in progress
  if (firebaseUser && checkingProfile) {
    return (
      <div className="text-[10px] tracking-[0.4em] text-[#F95A56] animate-pulse uppercase">
        Verifying...
      </div>
    )
  }

  // Logged in but needs to set a name first
  if (firebaseUser && needsName) {
    return (
      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#F95A56]/10 border border-[#F95A56]/30 mx-auto flex items-center justify-center">
            <User className="w-8 h-8 text-[#F95A56]" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Set_Your_Name</h1>
          <p className="text-xs tracking-[0.2em] text-white/40 uppercase">
            Choose a name for your Build In Live profile before authorizing.
          </p>
        </div>
        <div className="bg-[#131313] border border-white/10 p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Name</label>
            <input
              className="w-full bg-transparent border border-white/20 px-4 py-4 text-white text-center text-lg font-black tracking-widest focus:border-[#F95A56] focus:outline-none transition-colors uppercase"
              placeholder="YOUR_NAME"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={nameSaving}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            />
          </div>
          <button
            onClick={handleNameSubmit}
            disabled={nameSaving || !userName.trim()}
            className="w-full h-14 bg-[#F95A56] hover:brightness-110 text-white font-black tracking-[0.3em] text-xs transition-all uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {nameSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> SAVING...</> : 'CONTINUE →'}
          </button>
        </div>
      </div>
    )
  }

  // Not logged in
  if (firebaseUser === null) {
    return (
      <div className="w-full max-w-md z-10 space-y-8 text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-[#F95A56]/10 border border-[#F95A56]/30 mx-auto flex items-center justify-center">
            <LogIn className="w-8 h-8 text-[#F95A56]" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Sign_In_Required</h1>
          <p className="text-xs tracking-[0.2em] text-white/40 uppercase">
            Log in or create a free account to authorize your CLI device.
          </p>
        </div>
        <button
          onClick={() => router.push(`/auth?mode=signup&redirect=${encodeURIComponent(`/activate${codeParam ? `?code=${codeParam}` : ''}`)}`)}
          className="w-full h-14 bg-[#F95A56] hover:brightness-110 text-white font-black tracking-[0.3em] text-xs transition-all uppercase"
        >
          SIGN UP / LOG IN →
        </button>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="w-full max-w-md z-10 space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 mx-auto flex items-center justify-center">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Device_Authorized!</h1>
          <p className="text-xs tracking-[0.2em] text-white/40 uppercase leading-relaxed">
            Your terminal is now connected.<br />
            You can close this tab and return to your terminal.
          </p>
        </div>
        <div className="bg-[#131313] border border-white/10 p-4 text-left">
          <p className="text-[10px] tracking-widest text-[#F95A56] font-black uppercase mb-1">Terminal</p>
          <p className="text-xs text-white/60 font-mono">✅ Successfully logged in!</p>
        </div>
      </div>
    )
  }

  // Main auth form
  return (
    <div className="w-full max-w-md z-10 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-[#F95A56]/10 border border-[#F95A56]/30 mx-auto flex items-center justify-center">
          <Terminal className="w-8 h-8 text-[#F95A56]" />
        </div>
        <h1 className="text-2xl font-black tracking-tighter text-white uppercase">CLI_Device_Authorization</h1>
        <p className="text-xs tracking-[0.2em] text-white/40 uppercase">
          Enter the code displayed in your terminal to connect your CLI.
        </p>
      </div>

      {/* Logged-in user badge */}
      <div className="bg-white/5 border border-white/10 p-3 flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] text-white/40 uppercase tracking-widest">Logged in as</p>
          <p className="text-xs text-white truncate">{firebaseUser?.email}</p>
        </div>
      </div>

      <div className="bg-[#131313] border border-white/10 p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">
            Terminal Code
          </label>
          <input
            className="w-full bg-transparent border border-white/20 px-4 py-4 text-white text-center text-2xl font-black tracking-[0.4em] focus:border-[#F95A56] focus:outline-none transition-colors uppercase"
            placeholder="XXXX-XXXX"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            maxLength={9}
            disabled={status === 'loading'}
          />
        </div>

        {errorMsg && (
          <p className="text-[11px] text-[#F95A56] text-center">{errorMsg}</p>
        )}

        <button
          onClick={handleApprove}
          disabled={status === 'loading' || !inputCode.trim()}
          className="w-full h-14 bg-[#F95A56] hover:brightness-110 text-white font-black tracking-[0.3em] text-xs transition-all uppercase flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {status === 'loading' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> AUTHORIZING...</>
          ) : (
            'AUTHORIZE_DEVICE →'
          )}
        </button>
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F95A56]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-6 left-6 text-[10px] tracking-[0.4em] text-white/20 uppercase font-black">
        Build_In_Live
      </div>
      <Suspense fallback={
        <div className="text-[10px] tracking-[0.4em] text-[#F95A56] animate-pulse uppercase">Loading...</div>
      }>
        <ActivateContent />
      </Suspense>
    </div>
  )
}
