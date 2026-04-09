"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useStore } from "@/lib/store"
import { RoomProvider, useStorage, useOthers } from "@/liveblocks.config"
import { ClientSideSuspense } from "@liveblocks/react"
import { LiveCursors } from "@/components/LiveCursors"
import { FeedbackSystem } from "@/components/FeedbackSystem"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { Loader2, ArrowLeft, Globe, Share2, List, MessageSquarePlus, ChevronLeft, ChevronRight, Check } from "lucide-react"
import { LiveList, LiveMap } from "@liveblocks/client"
import { cn } from "@/lib/utils"

export default function FeedbackTerminalPage() {
  const { projectId } = useParams() as { projectId: string }
  const { firebaseUser } = useStore()
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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [issueMemo, setIssueMemo] = useState("")

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = (text: string, key: string = 'generic') => {
    navigator.clipboard.writeText(text)
    showToast(key === 'url' ? 'LINK_COPIED' : 'TEMPLATE_COPIED', 'success')
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
          issueMemo: issueMemo,
          isVerified: false
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
          <VerificationWrapper 
            projectId={projectId} 
            projectData={projectData} 
            isTesting={isTesting} 
            isAddingMode={isAddingMode} 
            setIsAddingMode={setIsAddingMode} 
            isFeedOpen={isFeedOpen} 
            setIsFeedOpen={setIsFeedOpen} 
            isMobile={isMobile} 
            iframeRef={iframeRef} 
            testState={testState} 
            setTestState={setTestState} 
            issueMemo={issueMemo} 
            setIssueMemo={setIssueMemo} 
            handleIssueSubmit={handleIssueSubmit} 
            handleReport={handleReport} 
            copyToClipboard={copyToClipboard} 
            firebaseUser={firebaseUser} 
            viewMode={searchParams.get('view')}
            toast={toast}
            showToast={showToast}
          />
        )}
      </ClientSideSuspense>
    </RoomProvider>
  )
}

function VerificationWrapper({ 
  projectId, 
  projectData, 
  isTesting, 
  isAddingMode, 
  setIsAddingMode, 
  isFeedOpen, 
  setIsFeedOpen, 
  isMobile, 
  iframeRef, 
  testState, 
  setTestState, 
  issueMemo, 
  setIssueMemo, 
  handleIssueSubmit, 
  handleReport, 
  copyToClipboard,
  firebaseUser,
  viewMode,
  toast,
  showToast
}: any) {
  const markers = useStorage((root) => root.markers);
  const router = useRouter();
  const hasMarkers = markers && markers.length > 0;
  const isOwner = firebaseUser?.uid === projectData?.ownerId;
  const isVerified = projectData?.isVerified;

  const handleWorkingWell = async () => {
    if (!hasMarkers) return; // Prevent if no markers
    setTestState('reporting'); // Reuse reporting state as loading
    try {
      if (db) {
        await setDoc(doc(db, "projects", projectId), {
          isVerified: true,
          hasIssue: false // Clear any previous issues
        }, { merge: true });
      }
      setTestState('success');
    } catch (e) {
      console.error(e);
      setTestState('idle');
    }
  };

  // Special Mode: Only Comments List for Secondary Monitor
  if (viewMode === 'comments') {
    return (
      <div className="h-screen w-screen bg-black overflow-hidden flex flex-col font-mono">
        <header className="h-20 border-b border-white/10 bg-[#0D0D0D] flex items-center justify-between px-8 shrink-0 z-[10000]">
           <div className="flex items-center gap-6">
              <HeaderStatus projectName={projectData?.name} large={true} />
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={() => copyToClipboard(`https://build-in-live-mvp.vercel.app/feedback/${projectId}`, 'url')}
                className="flex items-center justify-center gap-3 bg-white text-black text-[18px] font-bold tracking-widest uppercase hover:bg-white/90 px-10 py-3 rounded-full shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all"
                title="Share Project"
              >
                {toast?.message === 'LINK_COPIED' ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
                {toast?.message === 'LINK_COPIED' ? "Copied" : "Share"}
              </button>
           </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
           <FeedbackSystem 
              projectId={projectId} 
              iframeRef={iframeRef} 
              ownerId={projectData?.ownerId}
              isAddingMode={false}
              setIsAddingMode={() => {}}
              isFeedOpen={true}
              setIsFeedOpen={() => {}}
              viewMode="comments"
            />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col font-mono">
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
                      {toast?.message === 'TEMPLATE_COPIED' ? <Check className="w-4 h-4 text-black" /> : <List className="w-4 h-4" />}
                      {toast?.message === 'TEMPLATE_COPIED' ? 'COPIED' : 'COPY_GUIDE_TEMPLATE'}
                    </button>
                  </div>
                </div>
              </div>

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
                      {toast?.message === 'LINK_COPIED' ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
                      {toast?.message === 'LINK_COPIED' ? 'COPIED' : 'COPY_FEEDBACK_URL'}
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
      ) : (
        <>
          {/* Dynamic Header */}
          {(!isMobile || !isFeedOpen) && viewMode !== 'main' && (
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
                    onClick={() => copyToClipboard(window.location.href, 'url')}
                    className={`flex items-center justify-center gap-2 bg-white text-black text-[10px] font-black tracking-widest uppercase hover:bg-white/90 hover:scale-105 active:scale-95 transition-all rounded-full shadow-[0_4px_12px_rgba(255,255,255,0.1)] ${isMobile ? 'w-9 h-9 p-0' : 'px-5 py-1.5'}`}
                    title="Share Project"
                  >
                    {toast?.message === 'LINK_COPIED' ? <Check className="w-3.5 h-3.5" /> : <Share2 className={isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} />}
                    {!isMobile && (toast?.message === 'LINK_COPIED' ? "Copied" : "Share")}
                  </button>
                ) : (
                  !isAddingMode && !hasMarkers && (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
                      <div className="text-[#F95A56] text-[12px] font-medium uppercase tracking-[0.4em] flex items-center">
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
                    if (!isVerified && !isTesting) {
                      if (isOwner) {
                        showToast("PLEASE_ACTIVATE_COMMENTS", 'error');
                      } else {
                        showToast("COMMENTS_DISABLED_BY_OWNER", 'error');
                      }
                      return;
                    }
                    setIsAddingMode(!isAddingMode);
                  }}
                  disabled={!isVerified && !isTesting}
                  className={`flex items-center justify-center gap-2 text-[10px] font-black tracking-widest uppercase transition-all rounded-full hover:scale-105 active:scale-95 shadow-[0_4px_15_rgba(249,90,86,0.3)] ${isAddingMode ? 'bg-[#F95A56] text-white animate-pulse' : 'bg-[#F95A56] text-white hover:brightness-110'} ${isMobile ? 'w-9 h-9 p-0' : 'px-5 py-1.5'} ${(!isVerified && !isTesting) ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
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
            className={`flex-1 relative bg-[#0a0a0a] flex transition-all overflow-visible ${isAddingMode ? 'bg-[#F95A56]/10' : ''}`}
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

            <div className={`flex-1 flex transition-all relative ${viewMode === 'main' ? 'm-0 p-0 border-none' : 'm-2 md:m-3 p-[2px] border border-[#F95A56]/30 animate-pulse-glow'} overflow-hidden rounded-sm bg-[#131313] shadow-[0_0_40px_rgba(249,90,86,0.1)] ${isMobile && isFeedOpen ? 'hidden' : 'flex'}`}>
              <div className="flex-1 flex flex-col bg-black relative z-10 overflow-hidden rounded-[1px]">
                <iframe
                  ref={iframeRef}
                  src={projectData.url}
                  className="flex-1 h-full border-none"
                  title="Project Preview"
                  style={isAddingMode ? { pointerEvents: 'auto' } : {}}
                />
              </div>
              
              <div className="absolute inset-0 pointer-events-none">
                {!isMobile && viewMode !== 'main' && <LiveCursors projectId={projectId} />}
              </div>
            </div>

            <div className={`${isMobile && isFeedOpen ? 'fixed inset-0 z-[2000] bg-[#131313] pointer-events-auto' : 'absolute inset-0 pointer-events-none'}`}>
                 <FeedbackSystem 
                    projectId={projectId} 
                    iframeRef={iframeRef} 
                    ownerId={projectData.ownerId}
                    isAddingMode={isAddingMode}
                    setIsAddingMode={setIsAddingMode}
                    isFeedOpen={isFeedOpen}
                    setIsFeedOpen={setIsFeedOpen}
                    viewMode={viewMode}
                  />
              </div>
          </div>

          {/* Toast Notification for UI Events */}
          {toast && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-bottom-4 duration-300">
              <div className={cn(
                "border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3",
                toast.type === 'error' ? "bg-red-500/10 border-red-500/20" : "bg-[#1A1A1A]"
              )}>
                 <div className={cn(
                   "w-5 h-5 rounded-full flex items-center justify-center",
                   toast.type === 'error' ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-[#F95A56]"
                 )}>
                    {toast.type === 'error' ? <div className="text-[14px] font-black leading-none">!</div> : <Check className="w-3 h-3 text-white" />}
                 </div>
                 <span className={cn(
                   "text-[11px] font-black tracking-[0.2em] uppercase",
                   toast.type === 'error' ? "text-red-500" : "text-white"
                 )}>
                    {toast.message}
                 </span>
              </div>
            </div>
          )}

          <style jsx global>{`
            html, body {
              overflow: hidden !important;
              height: 100% !important;
              width: 100% !important;
              position: fixed !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          `}</style>

          <style jsx>{`
            @keyframes pulse-glow {
              0%, 100% { 
                box-shadow: 0 0 30px rgba(249,90,86,0.2), inset 0 0 15px rgba(249,90,86,0.1); 
                border-color: rgba(249,90,86,0.4); 
              }
              50% { 
                box-shadow: 0 0 60px rgba(249,90,86,0.6), inset 0 0 30px rgba(249,90,86,0.3); 
                border-color: rgba(249,90,86,1); 
              }
            }
            .animate-pulse-glow {
              animation: pulse-glow 2s ease-in-out infinite;
            }
          `}</style>



          <style jsx>{`
            @keyframes laser-h {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes laser-h-rev {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
            @keyframes laser-v {
              0% { transform: translateY(100%); }
              100% { transform: translateY(-100%); }
            }
            @keyframes laser-v-rev {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100%); }
            }
            .animate-laser-h { animation: laser-h 4s linear infinite; }
            .animate-laser-h-rev { animation: laser-h-rev 4s linear infinite; }
            .animate-laser-v { animation: laser-v 4s linear infinite; }
            .animate-laser-v-rev { animation: laser-v-rev 4s linear infinite; }
          `}</style>


          {/* Test Mode Overlay Panel */}
          {isTesting && testState !== 'success' && (
            <div className="w-full bg-[#131313] border-t border-white/10 p-6 z-[3000] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] pb-8 md:pb-6">
              <div className="max-w-4xl mx-auto">
                {testState === 'idle' && (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center md:text-left">
                      <h3 className="text-white font-black tracking-widest uppercase text-sm">Integration Check</h3>
                      <p className="text-[#F95A56] text-[10px] uppercase font-bold tracking-[0.2em]">
                        {hasMarkers 
                          ? "SDK VERIFIED. YOU CAN NOW COMPLETE THE INSTALLATION." 
                          : "PLEASE DROP AT LEAST ONE MARKER TO VERIFY THE SDK IS WORKING."}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="flex gap-3 flex-1 md:flex-none">
                        <button 
                          onClick={handleReport}
                          className="flex-1 md:flex-none px-6 py-3 border border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-[10px] font-black tracking-widest uppercase transition-colors"
                        >
                          REPORT AN ISSUE
                        </button>
                        <button 
                          onClick={handleWorkingWell}
                          disabled={!hasMarkers}
                          className={`flex-1 md:flex-none px-6 py-3 bg-[#F95A56] text-white hover:brightness-110 text-[10px] font-black tracking-widest uppercase transition-colors shadow-[0_0_15px_rgba(249,90,86,0.3)] ${!hasMarkers ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          WORKING WELL
                        </button>
                      </div>
                      
                      {hasMarkers && (
                        <div className="hidden md:flex items-center gap-2 text-[#F95A56] animate-in fade-in slide-in-from-left-4 duration-700">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-bounce-x">
                            <path d="M13 5L20 12L13 19M4 12H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-[10px] font-black tracking-[0.2em] uppercase">Finish Testing</span>
                        </div>
                      )}
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
                    <span className="ml-3 text-white text-[10px] uppercase tracking-widest">SENDING DATA...</span>
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
          {/* Owner Activation Overlay */}
          {isOwner && !isVerified && !isTesting && !isAddingMode && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] animate-in fade-in slide-in-from-bottom-8 duration-500 w-[90%] md:w-auto">
              <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-[#F95A56]/50 p-1 flex flex-col md:flex-row items-center gap-1 shadow-[0_20px_50px_rgba(249,90,86,0.2)] rounded-sm">
                <div className="px-6 py-4 flex flex-col gap-1 text-center md:text-left">
                  <div className="text-[10px] font-black tracking-[0.3em] text-[#F95A56] uppercase">Incomplete Registration</div>
                  <div className="text-[9px] text-white/40 tracking-widest uppercase">Click the button to activate the SDK and start collecting feedback</div>
                </div>
                <button
                  onClick={() => router.push(`/desk/${projectData?.ownerId}?projectId=${projectId}`)}
                  className="w-full md:w-auto px-8 py-4 bg-[#F95A56] hover:brightness-110 text-white font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {testState === 'reporting' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  ENTER_{projectData?.name}_DESK
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HeaderStatus({ projectName, large = false }: { projectName: string, large?: boolean }) {
  const markers = useStorage((root) => root.markers);
  const others = useOthers();
  const count = markers?.length || 0;
  const viewing = (others?.length || 0) + 1;

  return (
    <div className={cn("flex items-center", large ? "gap-8" : "gap-3")}>
      <div className={cn("flex items-center text-white font-mono", large ? "gap-4" : "gap-2")}>
        <div className={cn("rounded-full bg-red-500 animate-pulse", large ? "w-4 h-4" : "w-2 h-2")} />
        <span className={cn("font-bold", large ? "text-[24px]" : "text-[10px]")}>{count}</span>
      </div>
      <div className={cn("bg-white/20", large ? "w-0.5 h-8" : "w-px h-3")} />
      <div className={cn("flex items-center font-mono", large ? "gap-3" : "gap-1.5 text-white/50")}>
        <span className={cn("uppercase tracking-widest", large ? "text-[12px] text-white/60" : "text-[8px]")}>Viewing</span>
        <span className={cn("font-bold text-white/80", large ? "text-[24px]" : "text-[10px]")}>{viewing}</span>
      </div>
      <div className={cn("bg-white/20", large ? "w-0.5 h-8" : "w-px h-3")} />
      <div>
        <div className={cn("font-black tracking-tighter text-white uppercase", large ? "text-[20px]" : "text-[10px]")}>
          {projectName || 'ANONYMOUS_PROJECT'}
        </div>
      </div>
    </div>
  );
}
