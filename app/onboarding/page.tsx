"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Globe, FileText, HelpCircle, Check, Copy, AlertTriangle, Terminal, ChevronDown, ChevronUp } from "lucide-react"

export default function OnboardingPage() {
  const { firebaseUser } = useStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    url: "",
    name: "",
    description: "",
    guide: ""
  })
  const [createdProjectId, setCreatedProjectId] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [showNextConfig, setShowNextConfig] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentDb = db;
    if (!firebaseUser || !currentDb) return
    setLoading(true)
    try {
      let finalUrl = formData.url.trim()
      if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`
      }

      const projectRef = await addDoc(collection(currentDb, "projects"), {
        ownerId: firebaseUser.uid,
        name: formData.name,
        url: finalUrl,
        description: formData.description,
        guide: formData.guide,
        createdAt: serverTimestamp(),
        feedbackCount: 0
      })

      await setDoc(doc(currentDb, "users", firebaseUser.uid), {
        hasProject: true,
        primaryProjectId: projectRef.id
      }, { merge: true })

      setCreatedProjectId(projectRef.id)
      setStep(2)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // The correct script: async + inside <body>
  const sdkScript = `<script src="https://build-in-live-mvp.vercel.app/sdk.js" data-project-id="${createdProjectId}" async></script>`

  const nextConfigCode = `// next.config.js (or next.config.mjs)
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'self' https://build-in-live-mvp.vercel.app http://localhost:3000;",
        },
      ],
    },
  ]
},`

  const feedbackUrl = `https://build-in-live-mvp.vercel.app/feedback/${createdProjectId}`

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-2xl space-y-4">

          {/* Header */}
          <div className="bg-[#131313] border border-green-500/30 p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500/20 border border-green-500 flex items-center justify-center text-green-500 shrink-0">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase">PROJECT_CREATED</h1>
              <p className="text-[10px] tracking-widest text-white/40 uppercase mt-0.5">2 steps required to activate live sync</p>
            </div>
          </div>

          {/* Step 1: SDK Script */}
          <div className="bg-[#131313] border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#F95A56] flex items-center justify-center text-white text-[10px] font-black shrink-0">1</div>
              <div className="text-[10px] text-white/60 tracking-widest uppercase">Embed SDK Script in Your Website</div>
            </div>

            <div className="bg-[#F95A56]/10 border border-[#F95A56]/40 p-3 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#F95A56] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#F95A56] leading-relaxed">
                Place this script <strong>inside {"<body>"}</strong> — NOT in {"<head>"}. Using <strong>async</strong> is required for correct initialization timing.
              </p>
            </div>

            <div className="relative group">
              <pre className="bg-black p-4 text-[11px] text-blue-400 overflow-x-auto border border-white/5 font-mono leading-relaxed">
                {sdkScript}
              </pre>
              <button
                onClick={() => copyToClipboard(sdkScript, 'sdk')}
                className="absolute right-2 top-2 p-2 bg-white/10 hover:bg-white text-white hover:text-black transition-colors flex items-center gap-1.5 text-[10px]"
              >
                {copied === 'sdk' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'sdk' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Framework-specific tips */}
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-white/[0.03] border border-white/5 p-3">
                <div className="text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Next.js / React</div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Add inside the <span className="text-white/70">&lt;body&gt;</span> in <span className="text-white/70">app/layout.tsx</span> — after your last provider/component, before the closing <span className="text-white/70">&lt;/body&gt;</span> tag.
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/5 p-3">
                <div className="text-[9px] text-white/50 uppercase tracking-widest mb-1.5">HTML / Other Frameworks</div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Paste just before the closing <span className="text-white/70">&lt;/body&gt;</span> tag in your main HTML template.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: next.config.js headers (collapsible) */}
          <div className="bg-[#131313] border border-white/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#F95A56] flex items-center justify-center text-white text-[10px] font-black shrink-0">2</div>
              <div className="text-[10px] text-white/60 tracking-widest uppercase">Allow iframe Embedding</div>
            </div>

            <p className="text-[10px] text-white/40 leading-relaxed">
              Your site must allow being embedded in our feedback terminal. If you skip this step, the preview will show a blank screen.
            </p>

            <button
              onClick={() => setShowNextConfig(!showNextConfig)}
              className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 hover:border-white/20 transition-colors text-[10px] text-white/60 uppercase tracking-widest"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>Next.js — Add to next.config.js</span>
              </div>
              {showNextConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showNextConfig && (
              <div className="relative group">
                <pre className="bg-black p-4 text-[11px] text-green-400 overflow-x-auto border border-white/5 font-mono leading-relaxed whitespace-pre-wrap">
                  {nextConfigCode}
                </pre>
                <button
                  onClick={() => copyToClipboard(nextConfigCode, 'nextconfig')}
                  className="absolute right-2 top-2 p-2 bg-white/10 hover:bg-white text-white hover:text-black transition-colors flex items-center gap-1.5 text-[10px]"
                >
                  {copied === 'nextconfig' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'nextconfig' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}

            <div className="bg-white/[0.03] border border-white/5 p-3">
              <div className="text-[9px] text-white/50 uppercase tracking-widest mb-1.5">Other Frameworks (HTML / Express / etc.)</div>
              <p className="text-[10px] text-white/40 leading-relaxed">
                Add these HTTP response headers:<br />
                <span className="text-white/60">X-Frame-Options: ALLOWALL</span><br />
                <span className="text-white/60">Content-Security-Policy: frame-ancestors 'self' https://build-in-live-mvp.vercel.app</span>
              </p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-yellow-400/80 leading-relaxed">
                After adding both the script and the headers, <strong>redeploy your site</strong>. Changes only take effect on the live URL after redeployment.
              </p>
            </div>
          </div>

          {/* Feedback URL */}
          <div className="bg-[#131313] border border-white/10 p-6 space-y-4">
            <div className="text-[10px] text-white/60 tracking-widest uppercase">Your Feedback Terminal URL</div>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Share this link with your team or testers. They can leave markers and comments directly on your live site.
            </p>
            <div className="flex items-center justify-between gap-2 bg-black/50 p-4 border border-white/5">
              <span className="text-[11px] text-[#F95A56] font-mono truncate">{feedbackUrl}</span>
              <button
                onClick={() => copyToClipboard(feedbackUrl, 'url')}
                className="p-2 bg-white/10 hover:bg-white text-white hover:text-black transition-colors shrink-0 flex items-center gap-1.5 text-[10px]"
              >
                {copied === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'url' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push("/")}
            className="w-full h-14 bg-white text-black font-black tracking-[0.3em] text-xs hover:bg-white/90 transition-all uppercase"
          >
            ENTER_DASHBOARD →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-xl bg-[#131313] border border-white/10 p-8 shadow-2xl">
        <div className="mb-10">
          <h1 className="text-xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <Globe className="w-6 h-6 text-[#F95A56]" />
            PROVISION_NEW_PROJECT
          </h1>
          <p className="text-[10px] tracking-widest text-white/40 mt-2 uppercase">
            Initialize your live monitoring environment
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Project Name</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                required
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors"
                placeholder="MY_COOL_STARTUP"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">
              Deployment URL <span className="text-[#F95A56]">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                required
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors"
                placeholder="https://myproject.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <p className="text-[9px] text-white/30 pl-1">You can enter with or without https:// — we'll handle it.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Description (Optional)</label>
            <div className="relative">
              <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-white/20" />
              <textarea
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors min-h-[80px] resize-none"
                placeholder="What is this project about?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Feedback Guide (Optional)</label>
            <div className="relative">
              <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-white/20" />
              <textarea
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors min-h-[80px] resize-none"
                placeholder="e.g. Click COMMENTS button and tap anywhere on the page to drop a marker..."
                value={formData.guide}
                onChange={(e) => setFormData({ ...formData, guide: e.target.value })}
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full h-14 bg-white text-black font-black tracking-[0.3em] text-xs hover:bg-white/90 disabled:opacity-50 transition-all uppercase mt-4"
          >
            {loading ? "INITIALIZING..." : "GENERATE_ENVIRONMENT →"}
          </button>
        </form>
      </div>
    </div>
  )
}
