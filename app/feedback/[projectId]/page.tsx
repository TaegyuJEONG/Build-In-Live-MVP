"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { RoomProvider, useStorage, useOthers } from "@/liveblocks.config"
import { ClientSideSuspense } from "@liveblocks/react"
import { LiveCursors } from "@/components/LiveCursors"
import { FeedbackSystem } from "@/components/FeedbackSystem"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Loader2, ArrowLeft, Globe, Share2, List, MessageSquarePlus, ChevronLeft, ChevronRight, Check } from "lucide-react"
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
  const searchParams = useSearchParams()
  const isTesting = searchParams.get('testing') === 'true'
  const [testState, setTestState] = useState<'idle' | 'input-issue' | 'reporting' | 'reported' | 'success'>('idle')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [issueMemo, setIssueMemo] = useState("")

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleReport = () => {
    setTestState('input-issue')
  }

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueMemo.trim()) return;
    
    setTestState('reporting')
    try {
      const currentDb = db;
      if (currentDb) {
        await setDoc(doc(currentDb, "projects", projectId), {
          hasIssue: true,
          issueMemo: issueMemo
        }, { merge: true })
      }
      
      // Auto redirect to dashboard
      router.push('/')
    } catch (e) {
      console.error(e)
      setTestState('input-issue')
    }
  }

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
          <div className="h-screen w-screen bg-black overflow-hidden flex flex-col font-mono relative">
            {testState === 'success' ? (
              <div className="fixed inset-0 z-[5000] bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-mono overflow-y-auto">
                {/* Background Gradients */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F95A56]/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-xl z-10 space-y-8 my-auto">
                  <div className="text-center space-y-4">
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase">INTEGRATION_SUCCESSFUL</h1>
                    <p className="text-xs tracking-[0.2em] text-white/40 uppercase">
                      Your collaborative environment is ready.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                       <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase pl-1">Final Feedback URL</p>
                       <div className="bg-[#131313] border border-white/10 p-1 flex flex-col relative group shadow-2xl">
                        <div className="absolute top-0 right-0 p-2 opacity-50 text-[9px] font-black uppercase tracking-widest text-[#F95A56]">Link</div>
                        <pre className="bg-black/50 p-4 text-[12px] text-white/80 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap mt-6">
                          {`https://build-in-live-mvp.vercel.app/feedback/${projectId}`}
                        </pre>
                        <div className="p-1">
                          <button
                            onClick={() => copyToClipboard(`https://build-in-live-mvp.vercel.app/feedback/${projectId}`, 'url')}
                            className="w-full py-3 bg-[#F95A56] hover:brightness-110 text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(249,90,86,0.2)]"
                          >
                            {copiedKey === 'url' ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
                            {copiedKey === 'url' ? 'COPIED' : 'COPY_FEEDBACK_URL'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase pl-1">Pre-written Guide (For your users)</p>
                       <div className="bg-[#131313] border border-white/10 p-1 flex flex-col relative group shadow-2xl">
                        <div className="absolute top-0 right-0 p-2 opacity-50 text-[9px] font-black uppercase tracking-widest text-[#F95A56]">Template</div>
                        <pre className="bg-black/50 p-4 text-[12px] text-white/80 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap mt-6 italic">
                          "Help us improve! Click the 'Comments' button and tap ANYWHERE on the page to drop a marker at the exact location you want to give feedback on. Your insights are invaluable."
                        </pre>
                        <div className="p-1">
                          <button
                            onClick={() => copyToClipboard("Help us improve! Click the 'Comments' button and tap ANYWHERE on the page to drop a marker at the exact location you want to give feedback on. Your insights are invaluable.", 'guide')}
                            className="w-full py-3 bg-white hover:bg-white/90 text-black font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            {copiedKey === 'guide' ? <Check className="w-4 h-4 text-black" /> : <List className="w-4 h-4" />}
                            {copiedKey === 'guide' ? 'COPIED' : 'COPY_GUIDE_TEMPLATE'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => router.push('/')}
                      className="w-full h-14 bg-transparent border border-white/10 text-white/50 hover:text-white hover:bg-white/5 font-black tracking-[0.3em] text-[10px] transition-all uppercase flex items-center justify-center group"
                    >
                      SHARING COMPLETE <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

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
                  
                  {!isMobile && <HeaderStatus projectName={projectData.name} />}
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  {!isTesting ? (
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
                  ) : (
                    !isAddingMode && (
                      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="bg-[#F95A56] text-white px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(249,90,86,0.4)] flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                           Start here
                        </div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#F95A56] animate-bounce-x">
                          <path d="M13 5L20 12L13 19M4 12H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )
                  )}

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

            {/* Test Mode Overlay Panel */}
            {isTesting && testState !== 'success' && (
              <div className="fixed bottom-0 left-0 w-full bg-[#131313] border-t border-white/10 p-6 z-[3000] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-8 md:pb-6">
                <div className="max-w-4xl mx-auto">
                  {testState === 'idle' && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center md:text-left">
                        <h3 className="text-white font-black tracking-widest uppercase text-sm">Integration Check</h3>
                        <p className="text-[#F95A56] text-[10px] uppercase font-bold tracking-[0.2em]">
                          Is the page rendering properly? Can you drop markers and add comments?
                        </p>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button 
                          onClick={handleReport}
                          className="flex-1 md:flex-none px-6 py-3 border border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-[10px] font-black tracking-widest uppercase transition-colors"
                        >
                          REPORT AN ISSUE
                        </button>
                        <button 
                          onClick={() => setTestState('success')}
                          className="flex-1 md:flex-none px-6 py-3 bg-[#F95A56] text-white hover:brightness-110 text-[10px] font-black tracking-widest uppercase transition-colors shadow-[0_0_15px_rgba(249,90,86,0.3)]"
                        >
                          WORKING WELL
                        </button>
                      </div>
                    </div>
                  )}

                  {testState === 'input-issue' && (
                    <form onSubmit={handleIssueSubmit} className="flex flex-col gap-4">
                      <div className="space-y-1">
                        <h3 className="text-white font-black tracking-widest uppercase text-sm">Report Issue</h3>
                        <p className="text-[#F95A56] text-[10px] uppercase tracking-[0.2em]">
                          Please describe the problem you encountered.
                        </p>
                      </div>
                      <textarea
                        required
                        className="w-full bg-[#0a0a0a] border border-white/20 p-4 text-white text-[12px] focus:border-[#F95A56] focus:outline-none transition-colors min-h-[100px] resize-none"
                        placeholder="What went wrong? e.g. 'I added the script but the cursor is not showing up...'"
                        value={issueMemo}
                        onChange={(e) => setIssueMemo(e.target.value)}
                      />
                      <div className="flex gap-3 justify-end">
                        <button 
                          type="button"
                          onClick={() => setTestState('idle')}
                          className="px-6 py-3 border border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-[10px] font-black tracking-widest uppercase transition-colors"
                        >
                          CANCEL
                        </button>
                        <button 
                          type="submit"
                          disabled={!issueMemo.trim()}
                          className="px-6 py-3 bg-[#F95A56] text-white hover:brightness-110 disabled:opacity-50 text-[10px] font-black tracking-widest uppercase transition-colors shadow-[0_0_15px_rgba(249,90,86,0.3)]"
                        >
                          SUBMIT & RETURN TO DASHBOARD
                        </button>
                      </div>
                    </form>
                  )}

                  {testState === 'reporting' && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-6 h-6 text-[#F95A56] animate-spin" />
                      <span className="ml-3 text-white text-[10px] uppercase tracking-widest">SENDING REPORT...</span>
                    </div>
                  )}

                  {testState === 'reported' && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center md:text-left">
                        <h3 className="text-white font-black tracking-widest uppercase text-sm flex items-center justify-center md:justify-start gap-2">
                          <Check className="w-5 h-5 text-green-500" />
                          REPORT SUBMITTED
                        </h3>
                        <p className="text-white/50 text-[10px] uppercase tracking-[0.2em]">
                          We've received your issue. You can explore the dashboard while we look into it.
                        </p>
                      </div>
                      <button 
                        onClick={() => router.push('/')}
                        className="w-full md:w-auto px-8 py-3 bg-white text-black hover:bg-white/90 text-[10px] font-black tracking-widest uppercase transition-colors"
                      >
                        EXPLORE DASHBOARD →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </ClientSideSuspense>
    </RoomProvider>
  )
}

function HeaderStatus({ projectName }: { projectName: string }) {
  const markers = useStorage((root) => root.markers);
  const others = useOthers();
  const count = markers?.length || 0;
  const viewing = (others?.length || 0) + 1;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-white font-mono">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-bold">{count}</span>
      </div>
      <div className="w-px h-3 bg-white/20" />
      <div className="flex items-center gap-1.5 text-white/50 font-mono">
        <span className="text-[8px] uppercase tracking-widest">Viewing</span>
        <span className="text-[10px] font-bold text-white/80">{viewing}</span>
      </div>
      <div className="w-px h-3 bg-white/20" />
      <div>
        <div className="text-[10px] font-black tracking-tighter text-white uppercase">
          {projectName || 'ANONYMOUS_PROJECT'}
        </div>
      </div>
    </div>
  );
}
