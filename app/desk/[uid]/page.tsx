"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import TopNav from "@/components/desk/TopNav";
import Monitor from "@/components/desk/Monitor";
import SecondaryScreen from "@/components/desk/SecondaryScreen";
import Keyboard from "@/components/desk/Keyboard";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { Plus, Minus, Focus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useStore, Project as StoreProject } from "@/lib/store";
import { X, Upload, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export type Project = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  logoUrl?: string; // Standardized with store
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
};

// Map our Firestore Project to the Desk Project type
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
  feedbackId: p.id, // Linking to the same project ID for feedback terminal
  demoVideo: p.demoVideo,
  about: p.about || p.description || "",
  useCases: p.useCases || [],
  targetAudience: p.targetAudience || [],
  platforms: p.platforms || [],
});

// Hardcoded fallback projects for specific users or as a demo
const FALLBACK_PROJECTS = [
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
    feedbackId: "pUJecepg4n9CxWC7JFm2",
    demoVideo: "https://www.youtube.com/embed/fbiU1ubZ_EQ",
    useCases: [],
    targetAudience: [],
    platforms: [],
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
    useCases: [],
    targetAudience: [],
    platforms: [],
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
    useCases: [],
    targetAudience: [],
    platforms: [],
  },
];

export default function UserDeskPage() {
  const params = useParams();
  const uid = params.uid as string;
  const router = useRouter();
  const { projects, init, firebaseUser, isLoading, addProject } = useStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"screenshots" | "live" | "demo">("screenshots");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Upload States
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [scale, setScale] = useState(1.0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
  }, []);

  // Filter projects for this specific user
  const userProjects = useMemo(() => {
    const filtered = projects.filter(p => p.ownerId === uid).map(mapProject);
    
    // If it's taegyujeong's page ... OR if it's ANY user with no projects yet
    // BUT! If the current logged in user IS the owner and they have no projects,
    // we should show a blank state instead of taegyujeong's content to avoid confusion.
    const isOwner = firebaseUser?.uid === uid;
    
    if (filtered.length === 0) {
      if (isOwner) return []; // Owner sees blank desk to upload
      return FALLBACK_PROJECTS; // Others see fallback demo
    }
    
    return filtered;
  }, [projects, uid, firebaseUser]);

  useEffect(() => {
    if (userProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(userProjects[0].id);
    }
  }, [userProjects]);

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

  // Prevent browser-triggered auto-scrolling
  useEffect(() => {
    const lockScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', lockScroll);
    window.scrollTo(0, 0);
    return () => window.removeEventListener('scroll', lockScroll);
  }, [viewMode, selectedProjectId]);

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
    }
  }, [scale]);

  // Pan Logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest("button, a, input, [role='button']");
    if (e.button === 0 && !isInteractive) {
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

  if (isLoading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/20 uppercase tracking-[0.5em] text-[10px]">Initializing_Desk...</div>;
  }



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
      {/* Background Grid */}
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
            <div className="flex-1 w-full max-w-3xl">
              <Monitor 
                projects={userProjects} 
                selectedProjectId={selectedProjectId || ""} 
                onSelectProject={setSelectedProjectId}
                viewMode={viewMode}
                onEditProject={handleEditProject}
              />
            </div>
            <div className="w-full lg:w-80">
              <SecondaryScreen project={selectedProject} viewMode={viewMode} />
            </div>
          </div>

          <div className="w-full max-w-2xl">
            <Keyboard 
              viewMode={viewMode} 
              onViewModeChange={setViewMode} 
              onPrev={() => {
                if (userProjects.length === 0) return;
                const idx = userProjects.findIndex(p => p.id === selectedProjectId);
                const prevIdx = (idx - 1 + userProjects.length) % userProjects.length;
                setSelectedProjectId(userProjects[prevIdx].id);
              }}
              onNext={() => {
                if (userProjects.length === 0) return;
                const idx = userProjects.findIndex(p => p.id === selectedProjectId);
                const nextIdx = (idx + 1) % userProjects.length;
                setSelectedProjectId(userProjects[nextIdx].id);
              }}
              onAddProject={() => setIsAddModalOpen(true)}
            />
          </div>
        </main>
      </div>

      <div className="relative z-50">
        <BottomNav />
      </div>

      <aside className="fixed left-4 md:left-12 top-1/2 -translate-y-1/2 flex flex-col gap-0 z-50 p-0 bg-transparent scale-90 md:scale-100 origin-left pointer-events-auto select-none">
        <div className="px-2 py-4 mb-4 border-l-2 border-white/20">
          <div className="text-[9px] font-black tracking-[0.3em] uppercase text-white/30 mb-1">COORDINATES</div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-white">
            {`${Math.round(-position.x)}.${Math.round(-position.y)}.${scale.toFixed(2)}_INF`}
          </div>
        </div>
        
        <button className="flex items-center justify-center w-12 h-12 hover:bg-white/5 text-white/30 transition-all cursor-pointer group" onClick={() => setScale(s => Math.min(s + 0.1, 2))}>
          <Plus className="w-4 h-4 group-hover:scale-110" />
        </button>
        <button className="flex items-center justify-center w-12 h-12 hover:bg-white/5 text-white/30 transition-all cursor-pointer group" onClick={() => setScale(s => Math.max(s - 0.1, 0.4))}>
          <Minus className="w-4 h-4 group-hover:scale-110" />
        </button>
        <button className="flex items-center justify-center w-12 h-12 bg-white text-black hover:bg-white/90 transition-all my-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]" onClick={() => { setPosition({ x: 0, y: 0 }); setScale(1.0); }}>
          <Focus className="w-4 h-4" />
        </button>
      </aside>

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
                             await useStore.getState().deleteProject(editingProject.id);
                             setSelectedProjectId(null);
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
                  // 1. Upload Logo if exists
                  let logoUrl = editingProject?.logoUrl || "/images/desk/vibounder-logo.png";
                  if (logoFile && storage) {
                    const logoRef = ref(storage, `projects/${uid}/${Date.now()}_logo_${logoFile.name}`);
                    const uploadResult = await uploadBytes(logoRef, logoFile);
                    logoUrl = await getDownloadURL(uploadResult.ref);
                  }

                  // 2. Upload Screenshots
                  const uploadedScreenshotUrls: string[] = [];
                  if (screenshotFiles.length > 0 && storage) {
                    for (const file of screenshotFiles) {
                      const ssRef = ref(storage, `projects/${uid}/${Date.now()}_ss_${file.name}`);
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
                    logoUrl: logoUrl,
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
                    await useStore.getState().updateProject(editingProject.id, projectData as any);
                  } else {
                    const newId = await addProject(projectData as any);
                    if (newId) setSelectedProjectId(newId);
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
                                       <img 
                                          src={logoPreview} 
                                          alt="Logo" 
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                             (e.target as HTMLImageElement).style.display = 'none';
                                             setLogoPreview(null);
                                          }}
                                       />
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
                                
                                {/* Badge-like indicator */}
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#F95A56] flex items-center justify-center shadow-lg border-2 border-black group-hover/logo:scale-110 transition-transform">
                                   <Plus className="w-4 h-4 text-white" />
                                </div>

                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setLogoFile(file);
                                      setLogoPreview(URL.createObjectURL(file));
                                    }
                                  }} 
                                />
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
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setScreenshotFiles(prev => prev.filter((_, idx) => idx !== i));
                                      setScreenshotPreviews(prev => prev.filter((_, idx) => idx !== i));
                                    }}
                                    className="absolute inset-0 bg-[#F95A56]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                  >
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
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setScreenshotFiles(prev => [...prev, ...files]);
                                const newPreviews = files.map(f => URL.createObjectURL(f));
                                setScreenshotPreviews(prev => [...prev, ...newPreviews]);
                              }}
                            />
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
                              <input name="useCases" defaultValue={editingProject?.useCases.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Internal monitoring, Feedback collection" />
                           </div>
                           
                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Target Audience</label>
                              <input name="targetAudience" defaultValue={editingProject?.targetAudience.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Developers, PMs, Stakeholders" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Categories</label>
                              <input name="categories" defaultValue={editingProject?.categories.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="SaaS, AI, Productivity" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Tech Stacks</label>
                              <input name="techStacks" defaultValue={editingProject?.techStacks.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Next.js, Tailwind, Firebase" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Platforms</label>
                              <input name="platforms" defaultValue={editingProject?.platforms.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Web, Mobile, Desktop" />
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
    </div>
  );
}
