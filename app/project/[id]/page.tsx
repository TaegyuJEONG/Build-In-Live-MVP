"use client";

import { use, useEffect, useRef } from "react";
import { LiveCursors } from "@/components/LiveCursors";
import { FeedbackSystem } from "@/components/FeedbackSystem";
import { useStore } from "@/lib/store";
import { Users, MessageSquarePlus } from "lucide-react";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { users, currentUser, markers, comments } = useStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Stats
  const activeUsers = users.filter(u => u.projectId === projectId).length + (currentUser?.projectId === projectId ? 1 : 0);
  const currentProjectMarkers = markers.filter(m => m.projectId === projectId);
  const totalComments = currentProjectMarkers.reduce((sum, m) => sum + (comments[m.id]?.length || 0), 0);

  // Map Project IDs to live URLs. 
  // Portfolio_Website runs locally on 3001 for SDK testing
  const projectUrls: Record<string, string> = {
    portfolio: "http://localhost:3001/company",
    axiom: "https://axiom.co",
    retool: "https://retool.com",
    linear: "https://linear.app",
    cal: "https://cal.com",
  };

  const url = projectUrls[projectId] || "https://example.com";

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] flex flex-col overflow-hidden relative select-none" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <header className="flex-none w-full z-[10000] flex justify-between items-center px-8 h-18 bg-[#131313] border-b border-white/5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tighter text-white uppercase drop-shadow-md">
            {projectId === 'portfolio' ? 'JTG.ai' : projectId} <span className="text-white/20 font-light ml-2">WORKSPACE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#131313]/80 border border-white/10 px-4 py-2 rounded-full cursor-default">
            <div className="w-2 h-2 rounded-full bg-[#F95A56] animate-pulse" />
            <span className="text-[10px] font-bold text-white tracking-widest uppercase">{activeUsers} VIEWING</span>
          </div>
          <div className="bg-[#131313]/80 border border-[#F95A56]/30 px-4 py-2 rounded-full text-[#F95A56] flex items-center gap-2 cursor-default transition-all">
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-widest uppercase">{totalComments} COMMENTS</span>
          </div>
        </div>
      </header>

      {/* Main Iframe + Overlay Container */}
      <div className="flex-1 w-full relative">
        <iframe 
          ref={iframeRef}
          src={url}
          className="absolute inset-0 w-full h-full border-none"
          title={`Project ${projectId}`}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
        
        {/* Collaboration Overlays — inside the iframe container so absolute positioning works */}
        <FeedbackSystem projectId={projectId} iframeRef={iframeRef} />
      </div>

      <LiveCursors projectId={projectId} />
      
      {/* Tech Metadata (as per design) */}
      <div className="fixed bottom-12 left-12 text-left text-[8px] leading-loose tracking-[0.3em] text-white/30 pointer-events-none uppercase z-[9000] drop-shadow-md bg-black/20 p-2 rounded">
        PROJECT_ID: {projectId.toUpperCase()}<br />
        SYNC_MODE: REALTIME_WSS<br />
        FRAME_SRC: {url}
      </div>
    </div>
  );
}
