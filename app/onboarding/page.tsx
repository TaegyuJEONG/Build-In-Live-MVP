"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Globe, Image as ImageIcon, FileText, HelpCircle, Check, Copy } from "lucide-react"

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
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentDb = db;
    if (!firebaseUser || !currentDb) return
    setLoading(true)
    try {
      // 1. Create project document
      const projectRef = await addDoc(collection(currentDb, "projects"), {
        ownerId: firebaseUser.uid,
        name: formData.name,
        url: formData.url,
        description: formData.description,
        guide: formData.guide,
        createdAt: serverTimestamp(),
        feedbackCount: 0
      })

      // 2. Update user document to mark as having a project
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

  const sdkCodeSnapshot = `<script src="https://build-in-live-mvp.vercel.app/sdk.js" data-project-id="${createdProjectId}"></script>`

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-2xl bg-[#131313] border border-white/10 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-green-500/20 border border-green-500 flex items-center justify-center text-green-500">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase">PROJECT_DEPLOYED</h1>
              <p className="text-[10px] tracking-widest text-white/40 uppercase">Integration Required to Begin Real-time Sync</p>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/50 p-4 mb-4">
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
              ATTENTION: You must deploy your website with the script integrated to enable live sync. 
              Real-time features will only activate once the script is reachable on your live URL.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-6">
              <div className="text-[10px] text-white/60 tracking-widest uppercase mb-4">Step 1: Embed Script</div>
              <p className="text-xs text-white/40 mb-4 leading-relaxed">
                Copy and paste the following code into the <span className="text-white">&lt;head&gt;</span> or at the end of the <span className="text-white">&lt;body&gt;</span> of your website. 
                This enables real-time cursor tracking and feedback collection.
              </p>
              <div className="relative group">
                <pre className="bg-black p-4 text-[11px] text-blue-400 overflow-x-auto border border-white/5 font-mono">
                  {sdkCodeSnapshot}
                </pre>
                <button 
                  onClick={() => navigator.clipboard.writeText(sdkCodeSnapshot)}
                  className="absolute right-2 top-2 p-2 bg-white/10 hover:bg-white text-white hover:text-black transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6">
              <div className="text-[10px] text-white/60 tracking-widest uppercase mb-4">Step 2: Share Feedback URL</div>
              <p className="text-xs text-white/40 mb-4 leading-relaxed">
                Invite users to give feedback by sharing your unique feedback terminal.
              </p>
              <div className="bg-black/50 p-4 border border-white/5 text-[11px] text-white/80 font-mono flex justify-between items-center text-red-400">
                <span>https://build-in-live-mvp.vercel.app/feedback/{createdProjectId}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full h-14 bg-white text-black font-black tracking-[0.3em] text-xs hover:bg-white/90 transition-all uppercase"
            >
              FINALIZE_&_ENTER_DASHBOARD
            </button>
          </div>
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
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Project Name (Title)</label>
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
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Deployment URL (Mandatory)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="url"
                required
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors"
                placeholder="https://myproject.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Description (Option)</label>
            <div className="relative">
              <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-white/20" />
              <textarea
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors min-h-[100px] resize-none"
                placeholder="What is this project about?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">How to use guide (Option)</label>
            <div className="relative">
              <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-white/20" />
              <textarea
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors min-h-[80px] resize-none"
                placeholder="Guide for visitors giving feedback..."
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
            {loading ? "INITIALIZING..." : "GENERATE_ENVIRONMENT"}
          </button>
        </form>
      </div>
    </div>
  )
}
