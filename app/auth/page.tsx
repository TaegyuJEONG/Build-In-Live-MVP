"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth"
import { useRouter } from "next/navigation"
import { Shield, Mail, Lock, Chrome } from "lucide-react"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      router.push("/")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    setLoading(true)
    try {
      await signInWithPopup(auth, provider)
      router.push("/")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-[#131313] border border-white/10 p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 border-2 border-[#F95A56] flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-[#F95A56]" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase">
            BUILD_IN_LIVE // ACCESS_CONTROL
          </h1>
          <p className="text-[10px] tracking-widest text-white/40 mt-2 uppercase">
            Protocol: {isLogin ? "IDENTITY_VERIFICATION" : "ACCOUNT_PROVISIONING"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Terminal Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="email"
                required
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors"
                placeholder="developer@node.sh"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Secret Access Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="password"
                required
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border-l-2 border-red-500 px-4 py-2 text-[10px] text-red-500 uppercase tracking-wider">
              Error // {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <button
              disabled={loading}
              type="submit"
              className="w-full h-12 bg-white text-black font-black tracking-[0.2em] text-xs hover:bg-white/90 disabled:opacity-50 transition-all uppercase"
            >
              {loading ? "PROCESSING..." : isLogin ? "INITIATE_SESSION" : "EXECUTE_REGISTER"}
            </button>
            
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[8px] text-white/20 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full h-12 border border-white/20 text-white font-black tracking-[0.2em] text-xs hover:bg-white/5 flex items-center justify-center gap-2 disabled:opacity-50 transition-all uppercase"
            >
              <Chrome className="w-4 h-4" />
              AUTH_VIA_GOOGLE
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] tracking-[0.2em] text-white/40 hover:text-white transition-colors uppercase"
          >
            {isLogin ? "Switch to > ACCOUNT_CREATION" : "Switch to > SESSION_INIT"}
          </button>
        </div>
      </div>
    </div>
  )
}
