"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import TopNav from "@/components/desk/TopNav";
import Monitor from "@/components/desk/Monitor";
import SecondaryScreen from "@/components/desk/SecondaryScreen";
import Keyboard from "@/components/desk/Keyboard";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { Plus, Minus, Focus, Layers } from "lucide-react";

export type Project = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  screenshots: string[];
  categories: string[];
  techStacks: string[];
  demoVideo?: string;
  liveUrl?: string;
  feedbackId?: string;
};

const PROJECTS: Project[] = [
  {
    id: "vibounder",
    name: "Vibounder",
    tagline: "Unbound your potential.",
    description: "Personal development and productivity platform designed for modern achievers.",
    logo: "/images/desk/vibounder-logo.png",
    screenshots: [
      "/images/desk/vibounder-login.png",
      "/images/desk/vibounder-ss-1.png",
      "/images/desk/vibounder-ss-2.png",
      "/images/desk/vibounder-ss-3.png",
      "/images/desk/vibounder-ss-4.png",
      "/images/desk/vibounder-ss-5.png",
    ],
    categories: ["Productivity", "Personal Development", "SaaS"],
    techStacks: ["Next.js", "TypeScript", "Tailwind CSS", "Firebase"],
    liveUrl: "https://vibounder.vercel.app",
    feedbackId: "pUJecepg4n9CxWC7JFm2", // Reusing the same ID for now so it works
    demoVideo: "https://www.youtube.com/embed/fbiU1ubZ_EQ",
  },
  {
    id: "jtg-ai",
    name: "JTG-AI",
    tagline: "Build. Validate. Ship AI Products.",
    description: "AI Native development agency for Enterprises, Founders, and AI development enthusiast.",
    logo: "/images/desk/jtg-logo.png",
    screenshots: [
      "/images/desk/jtg-hero.png",
    ],
    categories: ["Analytics & Monitoring", "Developer Tools", "Free & Open Source"],
    techStacks: ["Vercel", "LangChain", "Supabase", "Pinecone"],
    liveUrl: "https://jtg-ai.com",
    feedbackId: "pUJecepg4n9CxWC7JFm2",
  },
  {
    id: "tsf",
    name: "TSF",
    tagline: "Technical Software Foundation",
    description: "Building the infrastructure for the next generation of software engineering.",
    logo: "/images/desk/tsf-logo.png",
    screenshots: [
      "/images/desk/tsf-hero.png",
    ],
    categories: ["Infrastructure", "Open Source", "Performance"],
    techStacks: ["Rust", "Kubernetes", "GCP"],
    demoVideo: "https://www.youtube.com/embed/5wvEfj9L8CE",
  },
];

export default function DeskPage() {
  const [selectedProjectId, setSelectedProjectId] = useState(PROJECTS[0].id);
  const [viewMode, setViewMode] = useState<"screenshots" | "live" | "demo">("screenshots");
  
  // Canvas State
  const [scale, setScale] = useState(1.0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProject = PROJECTS.find((p) => p.id === selectedProjectId) || PROJECTS[0];

  // Prevent browser-triggered auto-scrolling (important for iframes-in-isometric-layout stability)
  useEffect(() => {
    const lockScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', lockScroll);
    window.scrollTo(0, 0);
    return () => window.removeEventListener('scroll', lockScroll);
  }, [viewMode, selectedProjectId]); // Re-sync on view changes

  // Cross-Monitor Protocol Sync Bridge
  useEffect(() => {
    const handleBridge = (e: MessageEvent) => {
      if (e.data?.type?.startsWith('BUILD_IN_LIVE_')) {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          if (iframe.contentWindow && iframe.contentWindow !== e.source) {
            iframe.contentWindow.postMessage(e.data, '*');
          }
        });
      }
    };
    window.addEventListener('message', handleBridge);
    return () => window.removeEventListener('message', handleBridge);
  }, []);

  // Zoom Logic
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = 0.001;
      const newScale = Math.min(Math.max(scale - e.deltaY * zoomFactor, 0.4), 2);
      setScale(newScale);
    } else if (isDragging) {
      // Normal scroll is disabled when dragging (prevent interference)
    }
  }, [scale, isDragging]);

  // Pan Logic Start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if the click target is a button, link, or inside one
    const target = e.target as HTMLElement;
    const isInteractive = target.closest("button, a, input, [role='button']");

    if (e.button === 1) { // Middle mouse: Always pan
      e.preventDefault();
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 0 && !isInteractive) { // Left mouse on non-interactive: Pan
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div 
      id="canvas-root"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={cn(
        "relative min-h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-white/10 select-none",
        isDragging ? "cursor-grabbing" : "cursor-default"
      )}
    >
      {/* Background Grid - Transforms with the canvas but much larger */}
      <div 
        className="absolute inset-x-[-100%] inset-y-[-100%] z-0 pointer-events-none opacity-20"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.1s ease-out"
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]"></div>
      </div>

      {/* Static Overlay UI */}
      <div className="relative z-50 pointer-events-none w-full h-full">
         <div className="pointer-events-auto">
            <TopNav />
         </div>
      </div>

      {/* Pannable / Zoomable Workspace */}
      <div 
        className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 pt-16 pb-8"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.1s ease-out",
          transformOrigin: "center center"
        }}
      >
        <main className="flex flex-col items-center justify-center w-full max-w-6xl gap-6 mt-4">
          <div className="flex flex-col lg:flex-row items-center justify-end gap-6 w-full lg:items-end">
            {/* Monitor Section (Main Screen) */}
            <div className="flex-1 w-full max-w-3xl">
              <Monitor 
                projects={PROJECTS} 
                selectedProjectId={selectedProjectId} 
                onSelectProject={setSelectedProjectId}
                viewMode={viewMode}
              />
            </div>

            {/* Secondary Screen Section (Vertical) */}
            <div className="w-full lg:w-80">
              <SecondaryScreen project={selectedProject} viewMode={viewMode} />
            </div>
          </div>

          {/* Keyboard Section */}
          <div className="w-full max-w-2xl">
            <Keyboard 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              onPrev={() => {
                const idx = PROJECTS.findIndex(p => p.id === selectedProjectId);
                const prevIdx = (idx - 1 + PROJECTS.length) % PROJECTS.length;
                setSelectedProjectId(PROJECTS[prevIdx].id);
              }}
              onNext={() => {
                const idx = PROJECTS.findIndex(p => p.id === selectedProjectId);
                const nextIdx = (idx + 1) % PROJECTS.length;
                setSelectedProjectId(PROJECTS[nextIdx].id);
              }}
            />
          </div>
        </main>
      </div>

      {/* Static Navigation */}
      <div className="relative z-50">
        <BottomNav />
      </div>

      {/* Lateral Spatial Controls - Coordinate Tool Style (Main Page Replica) */}
      <aside className="fixed left-4 md:left-12 top-1/2 -translate-y-1/2 flex flex-col gap-0 z-50 p-0 bg-transparent scale-90 md:scale-100 origin-left pointer-events-auto select-none">
        <div className="px-2 py-4 mb-4 border-l-2 border-white/20">
          <div className="text-[9px] font-black tracking-[0.3em] uppercase text-white/30 mb-1">COORDINATES</div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-white">
            {`${Math.round(-position.x)}.${Math.round(-position.y)}.${scale.toFixed(2)}_INF`}
          </div>
        </div>
        
        <button 
          className="flex items-center justify-center w-12 h-12 hover:bg-white/5 text-white/30 transition-all cursor-pointer group"
          onClick={() => setScale(s => Math.min(s + 0.1, 2))}
        >
          <Plus className="w-4 h-4 group-hover:scale-110 active:scale-90" />
        </button>
        
        <button 
          className="flex items-center justify-center w-12 h-12 hover:bg-white/5 text-white/30 transition-all cursor-pointer group"
          onClick={() => setScale(s => Math.max(s - 0.1, 0.4))}
        >
          <Minus className="w-4 h-4 group-hover:scale-110 active:scale-90" />
        </button>
        
        <button 
          className="flex items-center justify-center w-12 h-12 bg-white text-black hover:bg-white/90 transition-all my-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          onClick={() => { setPosition({ x: 0, y: 0 }); setScale(1.0); }}
        >
          <Focus className="w-4 h-4" />
        </button>
      </aside>
    </div>
  );
}
