"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { RoomProvider } from "@/liveblocks.config"
import { ClientSideSuspense } from "@liveblocks/react"
import { LiveCursors } from "@/components/LiveCursors"
import { FeedbackSystem } from "@/components/FeedbackSystem"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Loader2, ArrowLeft, Globe, Share2, List, MessageSquarePlus, ChevronLeft, ChevronRight } from "lucide-react"
import { LiveList, LiveMap } from "@liveblocks/client"

export default function FeedbackTerminalPage() {
  const { projectId } = useParams() as { projectId: string }
  const [mounted, setMounted] = useState(false)
  const [projectData, setProjectData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [isFeedOpen, setIsFeedOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [])

  useEffect(() => {
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
    <RoomProvider 
      id={projectId} 
      initialPresence={{ 
        cursor: null, 
        name: "Anonymous", 
        color: `hsl(${Math.random() * 360}, 80%, 70%)` ,
        pathname: "",
      }}
      initialStorage={{ 
        markers: new LiveList([]), 
        comments: new LiveMap() 
      }}
    >
      <ClientSideSuspense fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#F95A56] animate-spin" />
        </div>
      }>
        {() => (
          <div className="h-screen w-screen bg-black overflow-hidden flex flex-col font-mono">
            {/* Dynamic Header */}
            {(!isMobile || !isFeedOpen) && (
              <header className="h-[42px] border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 z-[1000]">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => router.push("/")}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  {!isMobile && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <div>
                        <div className="text-[10px] font-black tracking-tighter text-white uppercase">
                          {projectData.name || 'ANONYMOUS_PROJECT'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard!");
                    }}
                    className={`flex items-center justify-center gap-2 bg-white text-black text-[10px] font-black tracking-widest uppercase hover:bg-white/90 hover:scale-105 active:scale-95 transition-all rounded-full shadow-[0_4px_12px_rgba(255,255,255,0.1)] ${isMobile ? 'w-9 h-9 p-0' : 'px-5 py-1.5'}`}
                    title="Share Project"
                  >
                    <Share2 className={isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} />
                    {!isMobile && "Share"}
                  </button>

                  <div className="w-[1px] h-3 bg-white/10" />

                  <button 
                    onClick={() => {
                      setIsAddingMode(!isAddingMode);
                    }}
                    className={`flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all rounded-full hover:scale-105 active:scale-95 shadow-[0_4px_15_rgba(249,90,86,0.3)] ${isAddingMode ? 'bg-[#F95A56] text-white animate-pulse' : 'bg-[#F95A56] text-white hover:brightness-110'} ${isMobile ? 'w-9 h-9 p-0' : 'px-5 py-1.5'}`}
                    title="Add Comment"
                  >
                    <MessageSquarePlus className={`${isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} transition-transform duration-300 ${isAddingMode ? 'rotate-45' : ''}`} />
                    {!isMobile && "Comments"}
                  </button>

                  {isMobile && (
                    <>
                      <div className="w-[1px] h-3 bg-white/10" />
                      <button 
                        onClick={() => setIsFeedOpen(true)}
                        className={`flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white transition-all hover:bg-white/20 ${isFeedOpen ? 'bg-[#F95A56]' : ''}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </header>
            )}

            {/* Main Content Area */}
            <div 
              className={`flex-1 relative bg-[#0a0a0a] flex transition-all ${isAddingMode ? 'bg-[#F95A56]/20' : ''}`}
              style={isAddingMode ? { cursor: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='10' fill='%23F95A56' stroke='white' stroke-width='2'/%3E%3Cpath d='M16 26L16 30' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 16 16, crosshair` } : {}}
            >
              {/* Mobile Addition Hint */}
              {isMobile && isAddingMode && !isFeedOpen && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none w-full px-6 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="bg-[#F95A56] text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgba(249,90,86,0.4)] flex items-center gap-3 border border-white/20">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span className="text-[11px] font-black tracking-widest uppercase py-0.5">Tap anywhere to drop a marker</span>
                  </div>
                </div>
              )}
              <div className={`flex-1 flex transition-all relative border-2 ${isAddingMode ? 'border-[#F95A56] ring-4 ring-[#F95A56]/20' : 'border-[#F95A56]/30'} ${isMobile && isFeedOpen ? 'hidden' : 'flex'}`}>
                {/* The Hosted Project */}
                <iframe
                  ref={iframeRef}
                  src={projectData.url}
                  className="flex-1 h-full border-none"
                  title="Project Preview"
                  style={isAddingMode ? { pointerEvents: 'auto' } : {}}
                />

                {/* The Collaborative Layers */}
                <div className="absolute inset-0 pointer-events-none">
                  {!isMobile && <LiveCursors projectId={projectId} />}
                </div>
              </div>

              {/* Feed System - Covers full screen on mobile when open */}
              <div className={`${isMobile && isFeedOpen ? 'fixed inset-0 z-[2000] bg-[#131313] pointer-events-auto' : 'absolute inset-0 pointer-events-none'}`}>
                 <FeedbackSystem 
                    projectId={projectId} 
                    iframeRef={iframeRef} 
                    ownerId={projectData.ownerId}
                    isAddingMode={isAddingMode}
                    setIsAddingMode={setIsAddingMode}
                    isFeedOpen={isFeedOpen}
                    setIsFeedOpen={setIsFeedOpen}
                  />
              </div>
            </div>
          </div>
        )}
      </ClientSideSuspense>
    </RoomProvider>
  )
}
