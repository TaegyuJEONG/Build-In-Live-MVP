"use client"

import { useEffect, useState, useRef } from "react"
import { useStore } from "@/lib/store"
import { useParams, useRouter } from "next/navigation"
import { LiveCursors } from "@/components/LiveCursors"
import { FeedbackSystem } from "@/components/FeedbackSystem"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Loader2, ArrowLeft, Globe, Share2 } from "lucide-react"

export default function FeedbackTerminalPage() {
  const { projectId } = useParams() as { projectId: string }
  const { init, setProject } = useStore()
  const [mounted, setMounted] = useState(false)
  const [projectData, setProjectData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    init()
    setProject(projectId)

    const fetchProject = async () => {
      const currentDb = db;
      if (!currentDb) return;
      try {
        const projectDoc = await getDoc(doc(currentDb, "projects", projectId))
        if (projectDoc.exists()) {
          setProjectData(projectDoc.data())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F95A56] animate-spin" />
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 text-center">
        <div>
          <h1 className="text-xl font-bold text-white mb-4">PROJECT_NOT_FOUND</h1>
          <button 
            onClick={() => router.push("/")}
            className="text-xs text-[#F95A56] tracking-widest uppercase hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col font-mono">
      {/* Dynamic Header */}
      <header className="h-14 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 z-[1000]">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push("/")}
            className="text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div>
              <div className="text-[10px] font-black tracking-tighter text-white uppercase">
                {projectData.name || 'ANONYMOUS_PROJECT'} // LIVE_FEEDBACK
              </div>
              <div className="text-[8px] tracking-widest text-white/40 uppercase">
                Monitoring: {new URL(projectData.url).hostname}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 border-x border-white/5 px-6">
            <div className="flex flex-col items-end">
              <span className="text-[7px] text-white/30 uppercase tracking-[0.2em]">Session ID</span>
              <span className="text-[9px] text-white/60">#FB-{projectId.slice(0, 6).toUpperCase()}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[7px] text-white/30 uppercase tracking-[0.2em]">Environment</span>
              <span className="text-[9px] text-[#F95A56]">PRODUCTION</span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link copied to clipboard!");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[9px] font-black tracking-widest uppercase hover:bg-white/90 transition-colors"
          >
            <Share2 className="w-3 h-3" />
            Share
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-white">
        {/* The Hosted Project */}
        <iframe
          ref={iframeRef}
          src={projectData.url}
          className="w-full h-full border-none"
          title="Project Preview"
        />

        {/* The Collaborative Layers */}
        <div className="absolute inset-0 pointer-events-none">
          <LiveCursors projectId={projectId} />
          <FeedbackSystem projectId={projectId} iframeRef={iframeRef} />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between px-6 z-[1000]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-white/20" />
            <span className="text-[8px] text-white/30 tracking-widest uppercase">
              {projectData.url}
            </span>
          </div>
        </div>
        <div className="text-[8px] text-white/20 tracking-[0.3em] uppercase">
          Build In Live // Collaborative Debugging Protocol v1.0.4
        </div>
      </footer>
    </div>
  )
}
