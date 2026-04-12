"use client";

import { use, useEffect, useRef, useState } from "react";
import { LiveCursors } from "@/components/LiveCursors";
import { FeedbackSystem } from "@/components/FeedbackSystem";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/store";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Users, MessageSquarePlus } from "lucide-react";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { users, currentUser, markers, comments, projects } = useStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [projectUrl, setProjectUrl] = useState<string | null>(null);

  // Stats
  const activeUsers = users.filter(u => u.projectId === projectId).length + (currentUser?.projectId === projectId ? 1 : 0);
  const currentProjectMarkers = markers.filter(m => m.projectId === projectId);
  const totalComments = currentProjectMarkers.reduce((sum, m) => sum + (comments[m.id]?.length || 0), 0);

  useEffect(() => {
    if (projectId) {
      localStorage.setItem('lastVisitedDesk', projectId);
    }
  }, [projectId]);

  // Resolve project URL: check store first, then fetch from Firestore
  useEffect(() => {
    const fromStore = projects.find(p => p.id === projectId);
    if (fromStore?.url) {
      setProjectUrl(fromStore.url);
      return;
    }
    if (!db) return;
    getDoc(doc(db, 'projects', projectId)).then(snap => {
      if (snap.exists()) {
        setProjectUrl(snap.data().url || '');
      }
    });
  }, [projectId, projects]);

  const url = projectUrl ?? '';

  if (projectUrl === null) {
    return (
      <div className="w-screen h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="text-[10px] tracking-[0.4em] text-[#F95A56] animate-pulse uppercase">
          LOADING_PROJECT...
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#0a0a0a] flex flex-col overflow-hidden relative select-none" style={{ fontFamily: "Inter, sans-serif" }}>

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

      <BottomNav />

      {/* Studio Analysis Overlay (Bottom Left) */}
      <div className="fixed bottom-12 left-12 w-64 p-0 bg-transparent pointer-events-none z-[10000]">
        <div className="space-y-6 mb-6">
          <div className="flex justify-between items-end">
            <span className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Viewing</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F95A56] animate-pulse shadow-[0_0_8px_rgba(249,90,86,0.6)]" />
              <span className="text-[10px] text-[#F95A56] font-mono font-bold tracking-widest">{activeUsers}</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Comments</span>
            <span className="text-[10px] text-white/60 font-mono font-bold tracking-widest">{totalComments}</span>
          </div>
        </div>
        <div className="font-bold text-[8px] tracking-[0.4em] text-white/20 mt-6 uppercase border-t border-white/10 pt-2 flex justify-between items-start">
          <span>STUDIO_ANALYSIS</span>
          <span className="text-white/40 font-medium tracking-widest leading-none">
            {projectId.toUpperCase()} // WORKSPACE
          </span>
        </div>
      </div>
    </div>
  );
}
