"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import TopNav from "@/components/desk/TopNav";
import Monitor from "@/components/desk/Monitor";
import SecondaryScreen from "@/components/desk/SecondaryScreen";
import Keyboard from "@/components/desk/Keyboard";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { Plus, Minus, Focus, X, Upload, Loader2, Image as ImageIcon, Trash2, Youtube, Link as LinkIcon, Camera, MousePointer2, RotateCw, Maximize2, Link2, ExternalLink, StickyNote } from "lucide-react";
import { useStore, Project as StoreProject, Polaroid } from "@/lib/store";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";

export type Project = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  logoUrl?: string;
  screenshots: string[];
  categories: string[];
  techStacks: string[];
  demoVideo?: string;
  liveUrl?: string;
  feedbackId?: string;
  about?: string;
  useCases: string[];
  targetAudience: string[];
  platforms: string[];
  isVerified?: boolean;
};

const mapProject = (p: any) => ({
  id: p.id,
  name: p.name || "Untitled Project",
  tagline: p.tagline || p.description?.slice(0, 50) || "No tagline provided.",
  description: p.description || "No description provided.",
  logo: p.logoUrl || "/images/desk/vibounder-logo.png",
  logoUrl: p.logoUrl,
  screenshots: p.screenshots && p.screenshots.length > 0 ? p.screenshots : [],
  categories: p.categories || ["General"],
  techStacks: p.techStacks || ["React", "Next.js"],
  liveUrl: p.url || "#",
  feedbackId: p.id,
  demoVideo: p.demoVideo,
  about: p.about || p.description || "",
  useCases: p.useCases || [],
  targetAudience: p.targetAudience || [],
  platforms: p.platforms || [],
  isVerified: p.isVerified
});

const FALLBACK_PROJECTS = [
  {
    id: "vibounder",
    name: "Vibounder",
    tagline: "Unbound your potential.",
    description: "Personal development and productivity platform designed for modern achievers.",
    logo: "/images/desk/vibounder-logo.png",
    screenshots: ["/images/desk/vibounder-login.png"],
    categories: ["Productivity"],
    techStacks: ["Next.js"],
    liveUrl: "https://vibounder.vercel.app",
    feedbackId: "pUJecepg4n9CxWC7JFm2",
    demoVideo: "https://www.youtube.com/embed/fbiU1ubZ_EQ",
    useCases: [],
    targetAudience: [],
    platforms: [],
    isVerified: true
  }
];

export default function UserDeskPage() {
  const params = useParams();
  const uid = params.uid as string;
  const router = useRouter();
  const { projects, init, firebaseUser, currentUser, isLoading, addProject, updateProject, deleteProject: storeDeleteProject } = useStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"screenshots" | "live" | "demo">("screenshots");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [mainTab, setMainTab] = useState("PROJECTS");
  const [profileViewMode, setProfileViewMode] = useState<"polaroid" | "youtube" | "link">("polaroid");
  
  const { polaroids, subscribeToPolaroids, addPolaroid, updatePolaroid, deletePolaroid } = useStore();
  const [placingPolaroid, setPlacingPolaroid] = useState<Omit<Polaroid, 'id' | 'ownerId' | 'createdAt'> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [uploadingPolaroidIds, setUploadingPolaroidIds] = useState<Record<string, boolean>>({});
  const [isYoutubeInputOpen, setIsYoutubeInputOpen] = useState(false);
  const [tempYoutubeUrl, setTempYoutubeUrl] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [tempLinkData, setTempLinkData] = useState({ url: "", label: "" });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  
  const [scale, setScale] = useState(1.0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isOwner = firebaseUser?.uid === uid;
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const id = getYoutubeVideoId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : url;
  };

  useEffect(() => { init(); }, []);
  useEffect(() => { if (uid) return subscribeToPolaroids(uid); }, [uid]);

  const userProjects = useMemo(() => {
    const filtered = projects.filter(p => p.ownerId === uid).map(mapProject);
    if (filtered.length === 0) return isOwner ? [] : FALLBACK_PROJECTS as Project[];
    return filtered as Project[];
  }, [projects, uid, firebaseUser]);

   useEffect(() => {
     if (userProjects.length > 0 && !selectedProjectId) {
       setSelectedProjectId(userProjects[0].id);
     }
   }, [userProjects]);

   // Track last visited desk
   useEffect(() => {
     const saveVisitedDesk = async () => {
       if (uid && firebaseUser && uid !== firebaseUser.uid && db) {
         try {
           const userSnap = await getDoc(doc(db, 'users', uid));
           if (userSnap.exists()) {
             const userData = userSnap.data();
             const ownerName = userData.displayName || userData.name || uid.slice(0, 5).toUpperCase();
             localStorage.setItem('lastVisitedDeskId', selectedProjectId || '');
             localStorage.setItem('lastVisitedDeskOwnerId', uid);
             localStorage.setItem('lastVisitedDeskOwnerName', ownerName);
             // Trigger storage event for BottomNav to update
             window.dispatchEvent(new Event('storage'));
           }
         } catch (err) {
           console.error("Error saving visited desk:", err);
         }
       }
     };
     saveVisitedDesk();
   }, [uid, firebaseUser, selectedProjectId]);

  const handleEditProject = useCallback((project: Project) => {
    setEditingProject(project);
    setLogoPreview(project.logo);
    setScreenshotPreviews(project.screenshots);
    setIsAddModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingProject(null);
    setLogoFile(null);
    setLogoPreview(null);
    setScreenshotFiles([]);
    setScreenshotPreviews([]);
  }, []);

  const selectedProject = userProjects.find((p) => p.id === selectedProjectId) || userProjects[0];

  useEffect(() => {
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const zoomSpeed = 0.005;
        setScale(s => Math.min(Math.max(0.1, s - e.deltaY * zoomSpeed), 5));
      } else {
        setPosition(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleNativeWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleNativeWheel);
    }
  }, [scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (e.button === 0 && !target.closest("button, a, input, textarea, [role='button']")) {
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
    if (placingPolaroid && workspaceRef.current) {
       const rect = workspaceRef.current.getBoundingClientRect();
       const x = (e.clientX - rect.left - rect.width / 2) / scale;
       const y = (e.clientY - rect.top - rect.height / 2) / scale;
       setPlacingPolaroid(prev => prev ? ({ ...prev, x, y } as any) : null);
    }
  }, [isDragging, placingPolaroid, scale]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const PolaroidIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 6h16v12H4z" />
      <path d="M4 14h16" />
      <circle cx="12" cy="10" r="2" />
      <path d="M6 18l3-3 2 2 4-4 3 3" />
    </svg>
  );

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/20 uppercase tracking-[0.4em] text-[10px]">Initializing_Desk...</div>;

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={cn("relative w-screen h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-white/10", isDragging ? "cursor-grabbing" : "cursor-default")}
    >
      {/* FIXED UI OVERLAYS */}
      <div className="absolute inset-0 z-[1000] pointer-events-none">
         <div className="absolute top-0 inset-x-0 p-4 pointer-events-auto">
            <TopNav activeTab={mainTab} onTabChange={setMainTab} />
         </div>
         <div className="absolute bottom-10 inset-x-0 flex justify-center pointer-events-auto">
            <BottomNav />
         </div>
         <aside className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 flex flex-col gap-0 p-0 pointer-events-auto select-none scale-90 md:scale-100 origin-left">
            <div className="px-2 py-4 mb-4 border-l-2 border-white/20">
               <div className="text-[9px] font-black tracking-[0.3em] uppercase text-white/30 mb-1">COORDINATES</div>
               <div className="text-[11px] font-mono text-white">{`${Math.round(-position.x)}.${Math.round(-position.y)}.${scale.toFixed(2)}_INF`}</div>
            </div>
            <button className="w-12 h-12 flex items-center justify-center hover:bg-white/5 text-white/30" onClick={() => setScale(s => Math.min(s + 0.1, 5))}><Plus className="w-4 h-4"/></button>
            <button className="w-12 h-12 flex items-center justify-center hover:bg-white/5 text-white/30" onClick={() => setScale(s => Math.max(s - 0.1, 0.1))}><Minus className="w-4 h-4"/></button>
            <button className="w-12 h-12 flex items-center justify-center bg-white text-black my-2 shadow-xl" onClick={() => { setPosition({ x: 0, y: -80 }); setScale(0.8); }}><Focus className="w-4 h-4"/></button>
            {isOwner && mainTab === "PROFILE" && (
              <div className="flex flex-col gap-3 mt-6">
                <button 
                  onClick={() => setPlacingPolaroid(p => p ? null : { x: 0, y: 0, text: "", rotation: Math.random()*10-5, scale: 1.0, date: new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'2-digit'}).toUpperCase() })}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 border backdrop-blur-xl",
                    placingPolaroid 
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110" 
                      : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                ><PolaroidIcon/></button>
                <button 
                  onClick={() => setIsYoutubeInputOpen(true)}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 border backdrop-blur-xl",
                    isYoutubeInputOpen 
                      ? "bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] scale-110" 
                      : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                ><Youtube className="w-4 h-4"/></button>
                <button 
                  onClick={() => setIsLinkInputOpen(true)}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 border backdrop-blur-xl",
                    isLinkInputOpen 
                      ? "bg-blue-500 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-110" 
                      : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                ><Link2 className="w-4 h-4"/></button>
              </div>
            )}
            
            {mainTab === "ROLLING_PAPER" && (
              <div className="flex flex-col gap-3 mt-6">
                <button 
                  onClick={() => setPlacingPolaroid({ 
                    type: 'POSTIT',
                    scope: 'ROLLING_PAPER',
                    x: 0, y: 0, 
                    text: "", 
                    rotation: Math.random()*10-5, 
                    scale: 1.0, 
                    date: new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'2-digit'}).toUpperCase() 
                  })}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 border backdrop-blur-xl",
                    placingPolaroid?.type === 'POSTIT'
                      ? "bg-yellow-400 text-black border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-110" 
                      : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white"
                  )}
                ><StickyNote className="w-4 h-4"/></button>
              </div>
            )}
         </aside>
      </div>

      {/* PANNING & ZOOMING WORKSPACE */}
      <div 
        ref={workspaceRef}
        onMouseDown={async (e) => {
           setSelectedId(null);
           if (placingPolaroid) {
              e.stopPropagation();
                if (!isOwner && placingPolaroid?.type !== 'POSTIT') return;
                 try {
                   const authorId = currentUser?.id || firebaseUser?.uid || null;
                   const authorName = currentUser?.name || firebaseUser?.displayName || 'Anonymous';
                   
                   const data = { 
                     ...placingPolaroid, 
                     scale: 1.0, 
                     scope: mainTab as 'PROFILE' | 'ROLLING_PAPER',
                     ...(authorId && { authorId }),
                     authorName
                   };
                   
                   await addPolaroid(uid, data);
                   setPlacingPolaroid(null);
                 } catch (err) {
                   console.error("Error adding polaroid:", err);
                 }
              return;
           }
           handleMouseDown(e);
        }}
        className="absolute inset-x-[-100%] inset-y-[-100%] flex items-center justify-center"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? "none" : "transform 0.1s ease-out",
          background: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      >
        {mainTab === "PROJECTS" ? (
          <main className="flex flex-col items-center gap-12 w-full max-w-7xl pt-10">
             <div className="flex flex-col lg:flex-row items-center gap-10 w-full lg:items-end">
                <div className="flex-1 w-full max-w-4xl"><Monitor projects={userProjects} selectedProjectId={selectedProjectId || ""} onSelectProject={setSelectedProjectId} viewMode={viewMode} mainTab={mainTab} profileViewMode={profileViewMode} onEditProject={handleEditProject} onViewModeChange={setViewMode} isOwner={isOwner} /></div>
                <div className="w-full lg:w-96"><SecondaryScreen project={selectedProject} viewMode={viewMode} mainTab={mainTab} /></div>
             </div>
             <div className="w-full max-w-2xl">
                <Keyboard 
                  viewMode={viewMode} 
                  onViewModeChange={setViewMode} 
                  onPrev={() => {
                    const idx = userProjects.findIndex(p => p.id === selectedProjectId);
                    setSelectedProjectId(userProjects[(idx - 1 + userProjects.length) % userProjects.length]?.id);
                  }}
                  onNext={() => {
                    const idx = userProjects.findIndex(p => p.id === selectedProjectId);
                    setSelectedProjectId(userProjects[(idx + 1) % userProjects.length]?.id);
                  }}
                  onAddProject={() => setIsAddModalOpen(true)}
                  isVerified={selectedProject?.isVerified}
                  isOwner={isOwner}
                />
             </div>
          </main>
        ) : (
          <div className="relative w-full h-full pointer-events-none">
             {polaroids
                .filter(p => (p.scope || 'PROFILE') === mainTab)
                .map((p) => {
                  const isSelected = selectedId === p.id;
                  const sc = p.scale || 1;
                  const w = 256 * sc;
                  const h = 320 * sc;
                  return (
                    <div 
                      key={p.id}
                      style={{ 
                         left: `calc(50% + ${p.x}px)`, 
                         top: `calc(50% + ${p.y}px)`, 
                         transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`, 
                         position: 'absolute', 
                         zIndex: isSelected ? 200 : 50, 
                         width: p.type === 'YOUTUBE' ? 400 * sc : (p.type === 'LINK' ? 140 * sc : (p.type === 'POSTIT' ? 280 * sc : w)), 
                      minHeight: p.type === 'YOUTUBE' ? 225 * sc : (p.type === 'LINK' ? 144 * sc : (p.type === 'POSTIT' ? 180 * sc : h)) 
                      }}
                      className={cn("group/card pointer-events-auto flex items-center justify-center", (isOwner || (p.scope !== 'PROFILE' && p.authorId === firebaseUser?.uid)) ? "cursor-move" : "cursor-default")}
                      onMouseDown={(e) => {
                         e.stopPropagation(); setSelectedId(p.id);
                         if ((e.target as HTMLElement).closest("button, textarea, input, label")) return;
                         if (!isOwner && (p.scope === 'PROFILE' || p.authorId !== firebaseUser?.uid)) return;
                         
                         const startX = e.clientX, startY = e.clientY, spX = p.x, spY = p.y;
                         setDraggingId(p.id);

                         const shield = document.createElement('div');
                         shield.style.position = 'fixed';
                         shield.style.inset = '0';
                         shield.style.zIndex = '99999';
                         shield.style.cursor = 'grabbing';
                         document.body.appendChild(shield);

                         const onMM = (m: MouseEvent) => {
                            updatePolaroid(uid, p.id, { 
                               x: spX + (m.clientX - startX) / scale, 
                               y: spY + (m.clientY - startY) / scale 
                            });
                         };

                         const onMU = () => {
                            setDraggingId(null);
                            document.body.removeChild(shield);
                            window.removeEventListener('mousemove', onMM);
                            window.removeEventListener('mouseup', onMU);
                         };

                         window.addEventListener('mousemove', onMM);
                         window.addEventListener('mouseup', onMU);
                      }}
                    >
                       {p.type === 'YOUTUBE' ? (
                         <div className={cn(
                           "relative bg-white border-[4px] shadow-[12px_12px_0px_#FF0000] p-2 flex flex-col gap-2 transition-all",
                           isSelected ? "border-[#4A90E2]" : "border-white"
                         )}
                         style={{ width: 400 * sc }}>
                            <div className="absolute -top-16 -left-10 z-[60] rotate-[-12deg] drop-shadow-[4px_4px_0px_rgba(255,255,255,1)]">
                               <svg viewBox="0 0 24 24" className="w-24 h-24">
                                  <path fill="#FF0000" d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816z" />
                                  <path fill="white" d="M9 16V8l8 4-8 4z" />
                               </svg>
                            </div>

                            <div className="relative aspect-video bg-black overflow-hidden border border-black/5 group/player rounded-sm">
                               {playingVideoId === p.id ? (
                                 <iframe 
                                   src={getYoutubeEmbedUrl(p.youtubeUrl || '')}
                                   className="w-full h-full pointer-events-auto"
                                   frameBorder="0"
                                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                   allowFullScreen
                                 ></iframe>
                               ) : (
                                 <div className="relative w-full h-full group/thumb">
                                    <img 
                                      src={`https://img.youtube.com/vi/${getYoutubeVideoId(p.youtubeUrl || '')}/maxresdefault.jpg`} 
                                      className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity"
                                      alt="Thumbnail"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); setPlayingVideoId(p.id); }}
                                          className="w-14 h-14 flex items-center justify-center relative z-20 group/playbtn"
                                       >
                                          <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full scale-0 group-hover/playbtn:scale-100 transition-transform duration-300" />
                                          <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10 ml-1 relative z-10 drop-shadow-lg">
                                             <path d="M8 5v14l11-7z" />
                                          </svg>
                                       </button>
                                    </div>
                                    <a 
                                       href={p.youtubeUrl} 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       onMouseDown={(e) => e.stopPropagation()}
                                       className="absolute bottom-3 right-3 flex items-center gap-1.5 text-white/40 hover:text-white transition-colors z-20 pointer-events-auto"
                                    >
                                       <span className="text-[8px] font-black uppercase tracking-widest">Open in YouTube</span>
                                       <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
                                       </svg>
                                    </a>
                                 </div>
                               )}
                               
                               <div 
                                 className={cn(
                                   "absolute inset-0 z-10 bg-transparent",
                                   (isOwner && !(isSelected && playingVideoId === p.id && draggingId !== p.id)) ? "cursor-move pointer-events-auto" : "pointer-events-none"
                                 )} 
                               />
                            </div>

                            <textarea 
                               readOnly={!isOwner}
                               maxLength={50} rows={1} placeholder="Video Title..."
                               className={cn(
                                 "w-full bg-transparent border-none outline-none resize-none font-black text-black leading-none text-[18px] uppercase tracking-tighter placeholder:text-black/5 selection:bg-black/10 px-1 overflow-hidden mt-1",
                                 isOwner ? "cursor-text select-text" : "cursor-default select-none"
                               )}
                               value={textDrafts[p.id] !== undefined ? textDrafts[p.id] : p.text}
                               onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}
                               onFocus={() => isOwner && setFocusedId(p.id)}
                               onInput={(e) => { const t = e.target as any; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                               onChange={(e) => isOwner && setTextDrafts(prev => ({ ...prev, [p.id]: e.target.value }))}
                               onBlur={(e) => { if(isOwner) { updatePolaroid(uid, p.id, { text: e.target.value }); setFocusedId(null); } }}
                            />

                            {isOwner && (
                              <button 
                                 onClick={(e) => { e.stopPropagation(); deletePolaroid(uid, p.id); }} 
                                 className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 hover:bg-red-500 transition-opacity z-[300] rounded-full border-2 border-white shadow-xl"
                              >
                                 <X className="w-4 h-4" />
                              </button>
                            )}
                         </div>
                       ) : p.type === 'LINK' ? (
                         <div 
                           className={cn(
                             "relative group/link cursor-pointer transition-all active:translate-y-1",
                             isSelected ? "ring-2 ring-white/50 rounded-[32px]" : ""
                           )}
                           style={{ width: 120 * sc, height: 120 * sc }}
                         >
                            {/* 3D Keycap Base (Extrusion) */}
                            <div className="absolute inset-0 bg-[#E0E0E0] rounded-[32px] translate-y-3 shadow-[0_4px_0_#B0B0B0]" />
                            <a 
                               href={p.url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               onMouseDown={(e) => e.stopPropagation()}
                               className="relative flex flex-col items-center justify-between w-full h-full bg-[#FFFFFF] border border-[#F0F0F0] rounded-[32px] p-6 shadow-sm active:translate-y-1 transition-transform overflow-hidden"
                            >
                               {/* Icon Area */}
                               <div className="flex-1 flex items-center justify-center">
                                  <LinkIcon className="w-8 h-8 text-[#A0A0A0] transition-colors group-hover/link:text-[#404040]" />
                               </div>
                               
                               {/* Label Badge (on the bottom of key) */}
                               <div className="w-full bg-white/80 py-1.5 px-3 flex items-center justify-center border-t border-[#F5F5F5]">
                                  <span className="text-[10px] font-black text-[#505050] uppercase tracking-[0.15em] truncate">{p.text || "LINK"}</span>
                               </div>
                            </a>
                            {isOwner && (
                              <button 
                                 onClick={(e) => { e.stopPropagation(); deletePolaroid(uid, p.id); }} 
                                 className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white flex items-center justify-center opacity-0 group-hover/link:opacity-100 hover:bg-red-500 transition-opacity z-50 rounded-full border-2 border-white shadow-xl"
                              >
                                 <X className="w-4 h-4" />
                              </button>
                            )}
                         </div>
                       ) : p.type === 'POSTIT' ? (
                          <div 
                            className={cn(
                              "relative bg-[#FFEF9C] p-6 shadow-[10px_10px_0px_#000000] flex flex-col gap-4 border-l border-t border-white/40",
                              isSelected ? "ring-4 ring-blue-500" : ""
                            )}
                            style={{ width: 280 * sc, minHeight: 180 * sc }}
                          >
                             {/* Adhesive Tape Effect (Subtle) */}
                             <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/30 backdrop-blur-sm rotate-[-2deg]" />
                             
                             <textarea 
                                readOnly={!isOwner && p.authorId !== firebaseUser?.uid}
                                maxLength={250}
                                placeholder="Write a message..."
                                className={cn(
                                  "w-full bg-transparent border-none outline-none resize-none font-medium text-black/80 leading-relaxed text-[16px] placeholder:text-black/10 selection:bg-black/10 overflow-hidden",
                                  (isOwner || p.authorId === firebaseUser?.uid) ? "cursor-text select-text" : "cursor-default select-none"
                                )}
                                style={{ height: 'auto', minHeight: '100px' }}
                                value={textDrafts[p.id] !== undefined ? textDrafts[p.id] : p.text}
                                onChange={(e) => {
                                  if (isOwner || p.authorId === firebaseUser?.uid) {
                                    setTextDrafts({ ...textDrafts, [p.id]: e.target.value });
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }
                                }}
                                onBlur={() => (isOwner || p.authorId === firebaseUser?.uid) && updatePolaroid(uid, p.id, { text: textDrafts[p.id] })}
                             />

                             <div className="flex justify-between items-end mt-auto pt-4 border-t border-black/5">
                                <div className="flex flex-col gap-0.5">
                                   {p.authorId && (
                                     <button 
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         window.location.href = `/desk/${p.authorId}`;
                                       }}
                                       className="text-[9px] font-black text-black/40 hover:text-black transition-colors text-left uppercase tracking-wider"
                                     >
                                       By {p.authorName || 'Anon'} ↗
                                     </button>
                                   )}
                                   <span className="text-[9px] font-bold text-black/20 tracking-widest">{p.date}</span>
                                </div>
                                <span className="text-[9px] font-black text-black/30">{(textDrafts[p.id] || p.text || "").length}/250</span>
                             </div>

                             {(isOwner || p.authorId === firebaseUser?.uid) && (
                               <button 
                                  onClick={(e) => { e.stopPropagation(); deletePolaroid(uid, p.id); }} 
                                  className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 hover:bg-red-500 transition-opacity z-[300] rounded-full border-2 border-white shadow-xl"
                               >
                                  <X className="w-4 h-4" />
                               </button>
                             )}
                          </div>
                       ) : (
                         <div style={{ width: w, minHeight: h }} className={cn("group/card-inner bg-white border-[4px] shadow-[8px_8px_0px_#F95A56] p-2 flex flex-col gap-2 relative", isSelected ? "border-[#4A90E2]" : "border-white")}>
                            <div className="aspect-square bg-zinc-50 border relative overflow-hidden group/img">
                               {uploadingPolaroidIds[p.id] ? (
                                 <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 animate-pulse">
                                    <Loader2 className="w-6 h-6 text-[#F95A56] animate-spin" />
                                    <span className="text-[7px] font-black uppercase mt-2 text-[#F95A56]">Uploading_Shot...</span>
                                 </div>
                               ) : p.image ? (
                                 <img src={p.image} className="w-full h-full object-cover" />
                               ) : isOwner ? (
                                 <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-100 transition-colors">
                                    <ImageIcon className="w-6 h-6 text-black/10" />
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*" 
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onChange={async (e) => { 
                                        const f = e.target.files?.[0]; 
                                        if (f && storage) { 
                                          setUploadingPolaroidIds(prev => ({ ...prev, [p.id]: true }));
                                          try {
                                             const url = await getDownloadURL((await uploadBytes(ref(storage, `users/${uid}/polaroids/${p.id}_${f.name}`), f)).ref); 
                                             updatePolaroid(uid, p.id, { image: url }); 
                                          } finally {
                                             setUploadingPolaroidIds(prev => ({ ...prev, [p.id]: false }));
                                          }
                                        } 
                                      }} 
                                    />
                                 </label>
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-zinc-50">
                                    <ImageIcon className="w-6 h-6 text-black/5" />
                                 </div>
                               )}
                            </div>
                            <textarea 
                               readOnly={!isOwner}
                               maxLength={150} rows={1} placeholder="Write something..."
                               className={cn(
                                 "w-full bg-transparent border-none outline-none resize-none font-serif italic text-black leading-tight text-[11px] placeholder:text-black/5 selection:bg-[#F95A56]/20 px-1 overflow-hidden",
                                 isOwner ? "cursor-text select-text" : "cursor-default select-none"
                               )}
                               value={textDrafts[p.id] !== undefined ? textDrafts[p.id] : p.text}
                               onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}
                               onFocus={() => isOwner && setFocusedId(p.id)}
                               onInput={(e) => { const t = e.target as any; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                               onChange={(e) => isOwner && setTextDrafts(prev => ({ ...prev, [p.id]: e.target.value }))}
                               onBlur={(e) => { if(isOwner) { updatePolaroid(uid, p.id, { text: e.target.value }); setFocusedId(null); } }}
                            />
                            <div className="flex justify-between items-center pt-1 border-t border-black/5 min-h-[1.2rem]">
                               <span className="text-[8px] font-black text-black/40 uppercase tracking-widest">{p.date}</span>
                               {isOwner && focusedId === p.id && <div className={cn("text-[9px] font-black tabular-nums transition-colors", (textDrafts[p.id] || p.text).length >= 150 ? "text-[#F95A56]" : "text-black/20")}>{(textDrafts[p.id] || p.text).length}/150</div>}
                            </div>

                            {isOwner && (
                              <button 
                                 onClick={(e) => { e.stopPropagation(); deletePolaroid(uid, p.id); }} 
                                 className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 hover:bg-red-500 transition-opacity z-[300] rounded-full border-2 border-white shadow-xl"
                              >
                                 <X className="w-4 h-4" />
                              </button>
                            )}
                         </div>
                       )}
                       {isSelected && (isOwner || (p.scope !== 'PROFILE' && p.authorId === firebaseUser?.uid)) && (
                         <>
                           <div className="absolute inset-1 border-[1.5px] border-[#4A90E2] pointer-events-none" />
                           {['nw', 'ne', 'sw', 'se'].map(pos => {
                             const isN = pos.startsWith('n'), isW = pos.endsWith('w');
                             return (
                               <React.Fragment key={pos}>
                                 <div className={cn("absolute w-3 h-3 bg-white border border-[#4A90E2] z-[210]", isN ? "-top-1" : "-bottom-1", isW ? "-left-1" : "-right-1", (pos === 'ne' || pos === 'sw') ? "cursor-nesw-resize" : "cursor-nwse-resize")}
                                   onMouseDown={(e) => {
                                      e.stopPropagation(); const sX = e.clientX, sT = p.scale || 1;
                                      const onMM = (m: MouseEvent) => updatePolaroid(uid, p.id, { scale: Math.max(0.5, Math.min(2, sT + (m.clientX - sX) * (isW ? -1 : 1) / 100)) });
                                      const onMU = () => { window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); };
                                      window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU);
                                   }}
                                 />
                                 <div className={cn("absolute w-8 h-8 cursor-alias z-[205]", isN ? "-top-6" : "-bottom-6", isW ? "-left-6" : "-right-6")}
                                   onMouseDown={(e) => {
                                      e.stopPropagation(); const sX = e.clientX, sR = p.rotation;
                                      const onMM = (m: MouseEvent) => updatePolaroid(uid, p.id, { rotation: sR + (m.clientX - sX) });
                                      const onMU = () => { window.removeEventListener('mousemove', onMM); window.removeEventListener('mouseup', onMU); };
                                      window.addEventListener('mousemove', onMM); window.addEventListener('mouseup', onMU);
                                   }}
                                 />
                               </React.Fragment>
                             );
                           })}
                         </>
                       )}
                    </div>
                  );
             })}
             {placingPolaroid && (
                <div 
                  style={{ 
                    left: `calc(50% + ${placingPolaroid.x}px)`, 
                    top: `calc(50% + ${placingPolaroid.y}px)`, 
                    transform: `translate(-50%, -50%) rotate(${placingPolaroid.rotation}deg)`, 
                    position: 'absolute' 
                  }} 
                  className={cn(
                    "pointer-events-none opacity-50",
                    placingPolaroid.type === 'POSTIT'
                      ? "bg-[#FFEF9C] w-72 h-44 shadow-[10px_10px_0px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center"
                      : "bg-white border-[4px] border-[#F95A56] w-64 p-4 ring-4 ring-[#F95A56] ring-offset-4 ring-offset-black"
                  )}
                >
                   {placingPolaroid.type === 'POSTIT' ? (
                     <div className="flex flex-col items-center gap-2">
                        <StickyNote className="w-8 h-8 text-black/30 animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Drop_Message</span>
                     </div>
                   ) : (
                     <>
                        <div className="aspect-square bg-zinc-100 border-[3px] border-black/10 flex items-center justify-center"><MousePointer2 className="w-8 h-8 text-[#F95A56] animate-bounce" /></div>
                        <div className="h-24 bg-zinc-50 rounded mt-4" />
                     </>
                   )}
                </div>
             )}
          </div>
        )}
      </div>

      {/* Project Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleCloseModal} />
          <div className="relative w-full max-w-4xl bg-[#0e0e0e] border border-white/10 shadow-2xl flex flex-col font-mono text-white">
             {/* Header */}
             <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <div className="text-xs font-black tracking-[0.3em] uppercase">
                  {editingProject ? `Edit_Project // ${editingProject.name}` : "Add_New_Project"}
                </div>
                <div className="flex items-center gap-6">
                   {editingProject && (
                      <button 
                         type="button" 
                         onClick={async () => {
                           if (confirm(`Are you sure you want to delete ${editingProject.name}?`)) {
                             await storeDeleteProject(editingProject.id);
                             handleCloseModal();
                           }
                         }} 
                         className="flex items-center gap-2 text-[#F95A56]/60 hover:text-[#F95A56] text-[9px] font-black uppercase tracking-widest transition-colors group/del"
                      >
                         <Trash2 className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" />
                         <span className="hidden sm:inline">Delete_Project</span>
                      </button>
                   )}
                   <button onClick={handleCloseModal} className="hover:text-[#F95A56] transition-colors"><X className="w-5 h-5"/></button>
                </div>
             </div>

             {/* Form Content */}
             <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                const formData = new FormData(e.currentTarget);
                
                try {
                  const currentUid = firebaseUser?.uid;
                  if (!currentUid) return;

                  // 1. Upload Logo if exists
                  let logoUrlValue = editingProject?.logoUrl || "/images/desk/vibounder-logo.png";
                  if (logoFile && storage) {
                    const logoRef = ref(storage, `projects/${currentUid}/${Date.now()}_logo_${logoFile.name}`);
                    const uploadResult = await uploadBytes(logoRef, logoFile);
                    logoUrlValue = await getDownloadURL(uploadResult.ref);
                  }

                  // 2. Upload Screenshots
                  const uploadedScreenshotUrls: string[] = [];
                  if (screenshotFiles.length > 0 && storage) {
                    for (const file of screenshotFiles) {
                      const ssRef = ref(storage, `projects/${currentUid}/${Date.now()}_ss_${file.name}`);
                      const uploadResult = await uploadBytes(ssRef, file);
                      const url = await getDownloadURL(uploadResult.ref);
                      uploadedScreenshotUrls.push(url);
                    }
                  }

                  // 3. Combine and validate
                  const finalScreenshots = [
                    ...(editingProject ? editingProject.screenshots.filter((s: string) => screenshotPreviews.includes(s)) : []),
                    ...uploadedScreenshotUrls
                  ];

                  const projectData = {
                    name: formData.get('name') as string,
                    url: formData.get('url') as string,
                    logoUrl: logoUrlValue,
                    screenshots: finalScreenshots,
                    demoVideo: formData.get('demoVideo') as string || "",
                    about: formData.get('about') as string || "",
                    categories: (formData.get('categories') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                    useCases: (formData.get('useCases') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                    targetAudience: (formData.get('targetAudience') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                    platforms: (formData.get('platforms') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                    techStacks: (formData.get('techStacks') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                  };

                  if (editingProject) {
                    await updateProject(editingProject.id, projectData as any);
                  } else {
                    const nId = await addProject(projectData as any);
                    if (nId) setSelectedProjectId(nId);
                  }
                  
                  handleCloseModal();
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsSubmitting(false);
                }
             }} className="p-8 flex flex-col gap-16 overflow-y-auto max-h-[75vh] custom-scrollbar">
                
                {/* Left Monitor Config (Main Screen) */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center gap-4">
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                      <div className="text-[11px] font-black text-[#F95A56] tracking-[0.4em] uppercase opacity-70">
                         Step_01 // Left_Monitor_Config
                      </div>
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                   </div>

                   <div className="flex flex-col gap-10 max-w-2xl mx-auto w-full">
                      <div className="space-y-8">
                        {/* Logo Upload */}
                        <div className="space-y-4">
                          <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30 border-l-2 border-[#F95A56]/50 pl-2">Project_Identity</label>
                          <div className="flex flex-col items-center">
                             <label className="group/logo relative cursor-pointer">
                                <div className="w-40 h-40 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group/logo shadow-2xl backdrop-blur-xl">
                                    {logoPreview ? (
                                       <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                       <div className="flex flex-col items-center gap-3 opacity-30 group-hover/logo:opacity-100 transition-opacity">
                                          <ImageIcon className="w-10 h-10" />
                                          <span className="text-[8px] font-black tracking-widest text-[#F95A56]">UPLOAD_LOGO</span>
                                       </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                                       <Upload className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#F95A56] flex items-center justify-center shadow-lg border-2 border-black group-hover/logo:scale-110 transition-transform">
                                   <Plus className="w-4 h-4 text-white" />
                                </div>
                                <input name="logo" type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setLogoFile(file);
                                    setLogoPreview(URL.createObjectURL(file));
                                  }
                                }} />
                             </label>
                             <div className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                                {logoFile ? logoFile.name : "Square_Ratio_Preferred"}
                             </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-widest text-white/40">Project Name *</label>
                            <input name="name" required defaultValue={editingProject?.name} className="w-full bg-white/5 border-b border-white/20 p-2 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="MY_COOL_UI" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-widest text-white/40">Deployment URL *</label>
                            <input name="url" required defaultValue={editingProject?.liveUrl} className="w-full bg-white/5 border-b border-white/20 p-2 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="https://..." />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">Demo Video (Youtube Embed URL)</label>
                          <input name="demoVideo" defaultValue={editingProject?.demoVideo} className="w-full bg-white/5 border-b border-white/20 p-2 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="https://www.youtube.com/embed/..." />
                        </div>

                        {/* Multiple Screenshot Upload */}
                        <div className="space-y-4">
                          <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30 border-l-2 border-[#F95A56]/50 pl-2">Screenshots_Gallery</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                             {screenshotPreviews.map((pre, i) => (
                               <div key={i} className="aspect-video rounded bg-black/40 border border-white/10 overflow-hidden relative group shadow-lg">
                                  <img src={pre} className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => {
                                      setScreenshotFiles(prev => prev.filter((_, idx) => idx !== i));
                                      setScreenshotPreviews(prev => prev.filter((_, idx) => idx !== i));
                                  }} className="absolute inset-0 bg-[#F95A56]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <X className="w-5 h-5 text-white" />
                                  </button>
                               </div>
                             ))}
                          </div>
                          <label>
                            <div className="w-full py-12 border-2 border-dashed border-white/10 hover:border-[#F95A56]/30 hover:bg-[#F95A56]/5 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl group/ss">
                               <Upload className="w-8 h-8 text-white/10 group-hover/ss:text-[#F95A56]/40 group-hover/ss:scale-110 transition-all" />
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover/ss:text-white/40">Deploy_Multiple_Screenshots_</span>
                            </div>
                            <input name="screenshots" type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setScreenshotFiles(prev => [...prev, ...files]);
                                const newPreviews = files.map(f => URL.createObjectURL(f));
                                setScreenshotPreviews(prev => [...prev, ...newPreviews]);
                            }} />
                          </label>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Right Monitor Config (Secondary Screen) */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <div className="flex items-center gap-4">
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                      <div className="text-[11px] font-black text-[#F95A56] tracking-[0.4em] uppercase opacity-70">
                         Step_02 // Right_Monitor_Config
                      </div>
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                   </div>

                   <div className="flex flex-col gap-10 max-w-2xl mx-auto w-full">
                      <div className="space-y-10">
                        {/* Executive Summary */}
                        <div className="space-y-4">
                          <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30 border-l-2 border-[#F95A56]/50 pl-2">Executive_Summary</label>
                          <textarea name="about" defaultValue={editingProject?.about} className="w-full bg-white/5 border border-white/10 p-5 text-sm focus:border-[#F95A56] outline-none transition-all h-36 resize-none rounded-xl leading-relaxed shadow-inner" placeholder="Tell us more about this project... It will appear on the secondary monitor." />
                        </div>
                        
                        {/* Detailed Specs */}
                        <div className="space-y-8">
                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Use Cases</label>
                              <input name="useCases" defaultValue={editingProject?.useCases?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Internal monitoring, Feedback collection" />
                           </div>
                           
                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Target Audience</label>
                              <input name="targetAudience" defaultValue={editingProject?.targetAudience?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Developers, PMs, Stakeholders" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Categories</label>
                              <input name="categories" defaultValue={editingProject?.categories?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="SaaS, AI, Productivity" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Tech Stacks</label>
                              <input name="techStacks" defaultValue={editingProject?.techStacks?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Next.js, Tailwind, Firebase" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Platforms</label>
                              <input name="platforms" defaultValue={editingProject?.platforms?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Web, Mobile, Desktop" />
                           </div>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="pt-12 border-t border-white/10 flex justify-between gap-6 pb-6 max-w-2xl mx-auto w-full">
                   <button type="button" onClick={handleCloseModal} className="px-10 py-4 text-[10px] uppercase tracking-widest hover:text-white/60 transition-colors font-black">Close_Portal</button>
                   <button disabled={isSubmitting} type="submit" className="px-16 py-4 bg-[#F95A56] hover:brightness-110 text-white font-black text-[12px] uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center gap-3 shadow-[0_15px_40px_rgba(249,90,86,0.3)] rounded-sm">
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                      {isSubmitting ? 'Syncing_Data...' : editingProject ? 'Update_Provisioning →' : 'Provision_Showcase →'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* YOUTUBE INPUT MODAL */}
      {isYoutubeInputOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsYoutubeInputOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 p-10 flex flex-col gap-8 shadow-[0_0_100px_rgba(255,0,0,0.1)] animate-in zoom-in-95 duration-200">
             <div className="flex flex-col gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Inject_Signal // YouTube</div>
                <h3 className="text-xl font-bold tracking-tight">Provision Video Player</h3>
             </div>
             
             <div className="space-y-4">
                <div className="text-[9px] uppercase tracking-widest text-white/30 border-l-2 border-red-500/50 pl-2">Stream Source URL</div>
                <input 
                  autoFocus
                  type="text" 
                  value={tempYoutubeUrl}
                  onChange={(e) => setTempYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-white/5 border-b border-white/10 p-4 text-sm focus:border-red-500 outline-none transition-all font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tempYoutubeUrl) {
                      addPolaroid(uid, {
                        type: 'YOUTUBE',
                        youtubeUrl: tempYoutubeUrl,
                        x: 0, y: 0, text: "",
                        rotation: 0, scale: 1.5,
                        date: new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'2-digit'}).toUpperCase()
                      });
                      setIsYoutubeInputOpen(false);
                      setTempYoutubeUrl("");
                    }
                    if (e.key === 'Escape') setIsYoutubeInputOpen(false);
                  }}
                />
             </div>

             <div className="flex justify-end gap-6 pt-4">
                <button 
                  onClick={() => setIsYoutubeInputOpen(false)} 
                  className="text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-white"
                >Abort_Session</button>
                <button 
                  disabled={!tempYoutubeUrl}
                  onClick={() => {
                    addPolaroid(uid, {
                      type: 'YOUTUBE',
                      youtubeUrl: tempYoutubeUrl,
                      x: 0, y: 0, text: "",
                      rotation: 0, scale: 1.5,
                      date: new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'2-digit'}).toUpperCase()
                    });
                    setIsYoutubeInputOpen(false);
                    setTempYoutubeUrl("");
                  }}
                  className="px-10 py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:brightness-125 disabled:opacity-20 transition-all"
                >Init_Stream →</button>
             </div>
          </div>
        </div>
      )}

      {/* LINK INPUT MODAL */}
      {isLinkInputOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsLinkInputOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#111111] border border-white/10 p-10 flex flex-col gap-8 shadow-[0_0_100px_rgba(255,255,255,0.05)] animate-in zoom-in-95 duration-200">
             <div className="flex flex-col gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Inject_Signal // External_Reference</div>
                <h3 className="text-xl font-bold tracking-tight">Provision Profile Link</h3>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                   <div className="text-[9px] uppercase tracking-widest text-white/30 border-l-2 border-white/20 pl-2">Reference URL</div>
                   <input 
                     autoFocus
                     type="text" 
                     value={tempLinkData.url}
                     onChange={(e) => setTempLinkData({ ...tempLinkData, url: e.target.value })}
                     placeholder="https://linkedin.com/in/..."
                     className="w-full bg-white/5 border-b border-white/10 p-4 text-sm focus:border-white outline-none transition-all font-mono"
                   />
                </div>
                <div className="space-y-2">
                   <div className="text-[9px] uppercase tracking-widest text-white/30 border-l-2 border-white/20 pl-2">Button Label</div>
                   <input 
                     type="text" 
                     value={tempLinkData.label}
                     onChange={(e) => setTempLinkData({ ...tempLinkData, label: e.target.value })}
                     placeholder="LINKEDIN"
                     className="w-full bg-white/5 border-b border-white/10 p-4 text-sm focus:border-white outline-none transition-all font-mono uppercase"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && tempLinkData.url) {
                          addPolaroid(uid, {
                            type: 'LINK',
                            url: tempLinkData.url,
                            text: tempLinkData.label || "LINK",
                            x: 0, y: 0, 
                            rotation: 0, scale: 1.0,
                            date: new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'2-digit'}).toUpperCase()
                          });
                          setIsLinkInputOpen(false);
                          setTempLinkData({ url: "", label: "" });
                       }
                       if (e.key === 'Escape') setIsLinkInputOpen(false);
                     }}
                   />
                </div>
             </div>

             <div className="flex justify-end gap-6 pt-4">
                <button 
                  onClick={() => setIsLinkInputOpen(false)} 
                  className="text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-white"
                >Abort_Session</button>
                <button 
                  disabled={!tempLinkData.url}
                  onClick={() => {
                    addPolaroid(uid, {
                      type: 'LINK',
                      url: tempLinkData.url,
                      text: tempLinkData.label || "LINK",
                      x: 0, y: 0, 
                      rotation: 0, scale: 1.0,
                      date: new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'2-digit'}).toUpperCase()
                    });
                    setIsLinkInputOpen(false);
                    setTempLinkData({ url: "", label: "" });
                  }}
                  className="px-10 py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-neutral-200 disabled:opacity-20 transition-all"
                >Init_Reference →</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
