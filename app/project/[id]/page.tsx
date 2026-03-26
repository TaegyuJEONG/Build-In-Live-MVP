"use client";

import { use, useEffect } from "react";
import { LiveCursors } from "@/components/LiveCursors";
import { FeedbackSystem } from "@/components/FeedbackSystem";
import { useStore } from "@/lib/store";
import { Users, AlertCircle } from "lucide-react";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { users, currentUser } = useStore();

  // Find users currently in this project
  const activeUsers = users.filter(u => u.projectId === projectId).length + (currentUser?.projectId === projectId ? 1 : 0);

  // Mock URL mapping based on Project ID (in a real app, from DB)
  const projectUrls: Record<string, string> = {
    axiom: "https://axiom.co",
    retool: "https://retool.com",
    linear: "https://linear.app",
    cal: "https://cal.com",
  };

  const url = projectUrls[projectId] || "https://example.com";

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] overflow-hidden relative select-none" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header Overlay */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="text-lg font-black tracking-tighter text-white uppercase drop-shadow-md">
            {projectId} <span className="text-white/30 font-light">WORKSPACE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#131313]/80 border border-white/10 px-4 py-2 rounded-full pointer-events-auto backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-[#F95A56] animate-pulse" />
            <span className="text-[10px] font-bold text-white tracking-widest uppercase">{activeUsers} VIEWING</span>
          </div>
          <div className="bg-[#131313]/80 border border-[#F95A56]/30 px-4 py-2 rounded-full pointer-events-auto backdrop-blur-md text-[#F95A56] flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[10px] font-bold tracking-widest uppercase">IFRAME SANDBOXED</span>
          </div>
        </div>
      </header>

      {/* Main Iframe */}
      <div className="w-full h-full pt-0">
        <iframe 
          src={url}
          className="w-full h-full border-none pointer-events-auto"
          title={`Project ${projectId}`}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>

      {/* Collaboration Overlays */}
      <LiveCursors projectId={projectId} />
      <FeedbackSystem projectId={projectId} />
      
      {/* Tech Metadata (as per design) */}
      <div className="fixed bottom-12 left-12 text-left text-[8px] leading-loose tracking-[0.3em] text-white/30 pointer-events-none uppercase z-[9000] drop-shadow-md bg-black/20 p-2 rounded">
        PROJECT_ID: {projectId.toUpperCase()}<br />
        SYNC_MODE: REALTIME_WSS<br />
        FRAME_SRC: {url}
      </div>
    </div>
  );
}
