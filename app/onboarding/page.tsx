"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useRouter, useSearchParams } from "next/navigation"
import { Globe, FileText, HelpCircle, Check, Copy, AlertTriangle, Terminal, ChevronDown, ChevronUp, User, Image as ImageIcon, Upload, Plus, Trash2, Loader2, X } from "lucide-react"

export default function OnboardingPage() {
  const { firebaseUser } = useStore()
  const searchParams = useSearchParams()
  const projectIdParam = searchParams.get('projectId')
  
  const [step, setStep] = useState<number | 'report'>(1)
  const [loading, setLoading] = useState(false)
  const [issueMemo, setIssueMemo] = useState("")
  const [formData, setFormData] = useState({
    url: "",
    name: "",
    description: "",
    guide: "",
    userName: ""
  })
  const [createdProjectId, setCreatedProjectId] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [showNextConfig, setShowNextConfig] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([])
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([])
  const router = useRouter()

  // Initial setup based on URL params
  useEffect(() => {
    if (projectIdParam) {
      setCreatedProjectId(projectIdParam);
      setStep(3); // Jump directly to SDK step (now Step 3)
    }
  }, [projectIdParam]);

  // Load existing project if provided
  useEffect(() => {
    const targetId = projectIdParam || createdProjectId;
    if (targetId && db) {
      const fetchProject = async () => {
        try {
          const { getDoc, doc } = await import("firebase/firestore");
          const docRef = doc(db!, "projects", targetId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData(prev => ({
              ...prev,
              name: data.name || "",
              url: data.url || "",
              description: data.description || "",
              guide: data.guide || ""
            }));
          }
        } catch (e) {
          console.error("Error fetching project for onboarding:", e);
        }
      };
      fetchProject();
    }
  }, [projectIdParam, createdProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentDb = db;
    if (!firebaseUser || !currentDb) return
    setLoading(true)
    try {
      const formDataObj = new FormData(e.currentTarget as HTMLFormElement);
      
      // 1. Upload Logo if exists
      let logoUrlValue = "";
      if (logoFile && storage) {
        const logoRef = ref(storage, `projects/${firebaseUser.uid}/${Date.now()}_logo_${logoFile.name}`);
        const uploadResult = await uploadBytes(logoRef, logoFile);
        logoUrlValue = await getDownloadURL(uploadResult.ref);
      }

      // 2. Upload Screenshots
      const uploadedScreenshotUrls: string[] = [];
      if (screenshotFiles.length > 0 && storage) {
        for (const file of screenshotFiles) {
          const ssRef = ref(storage, `projects/${firebaseUser.uid}/${Date.now()}_ss_${file.name}`);
          const uploadResult = await uploadBytes(ssRef, file);
          const url = await getDownloadURL(uploadResult.ref);
          uploadedScreenshotUrls.push(url);
        }
      }

      let finalUrl = (formDataObj.get('url') as string || "").trim()
      if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`
      }

      const projectRef = await addDoc(collection(currentDb, "projects"), {
        ownerId: firebaseUser.uid,
        name: formDataObj.get('name') as string,
        url: finalUrl,
        logoUrl: logoUrlValue,
        screenshots: uploadedScreenshotUrls,
        demoVideo: formDataObj.get('demoVideo') as string || "",
        about: formDataObj.get('about') as string || "",
        categories: (formDataObj.get('categories') as string || "").split(',').map(s => s.trim()).filter(Boolean),
        useCases: (formDataObj.get('useCases') as string || "").split(',').map(s => s.trim()).filter(Boolean),
        targetAudience: (formDataObj.get('targetAudience') as string || "").split(',').map(s => s.trim()).filter(Boolean),
        platforms: (formDataObj.get('platforms') as string || "").split(',').map(s => s.trim()).filter(Boolean),
        techStacks: (formDataObj.get('techStacks') as string || "").split(',').map(s => s.trim()).filter(Boolean),
        createdAt: serverTimestamp(),
        feedbackCount: 0,
        isVerified: false
      })

      await setDoc(doc(currentDb, "users", firebaseUser.uid), {
        hasProject: true,
        primaryProjectId: projectRef.id,
        email: firebaseUser.email
      }, { merge: true })

      setCreatedProjectId(projectRef.id)
      setStep(3)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    if (!firebaseUser) return
    setLoading(true)
    try {
      const currentDb = db;
      if (!currentDb) return;
      await setDoc(doc(currentDb, "users", firebaseUser.uid), {
        hasProject: true,
        skippedOnboarding: true,
        email: firebaseUser.email
      }, { merge: true })
      router.push("/")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDoItLater = async () => {
    if (!firebaseUser || !createdProjectId) return
    setLoading(true)
    try {
      const currentDb = db;
      if (!currentDb) return;
      await setDoc(doc(currentDb, "projects", createdProjectId), {
        scriptSkipped: true
      }, { merge: true })
      router.push("/")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firebaseUser || !createdProjectId) return
    setLoading(true)
    try {
      const currentDb = db;
      if (!currentDb) return;
      await setDoc(doc(currentDb, "projects", createdProjectId), {
        hasIssue: true,
        issueMemo: issueMemo
      }, { merge: true })
      
      router.push("/")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleIdentitySubmit = async (e: any) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!firebaseUser || !db) return
    setLoading(true)
    try {
      await setDoc(doc(db, "users", firebaseUser.uid), {
        displayName: formData.userName || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        email: firebaseUser.email
      }, { merge: true })
      
      setStep(2)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const nextConfigCode = `// next.config.js (or next.config.mjs)
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'self' https://build-in-live-mvp.vercel.app;",
        },
      ],
    },
  ]
},`

  const aiPrompt = `I want to integrate the 'Build In Live' feedback SDK into my project. Please perform the following steps carefully to ensure a seamless integration:

1. **Inject SDK Script Globally**: 
   - Locate ALL entry-point HTML files (e.g., index.html, index.php, or static landing pages like landing.html).
   - For Next.js projects, add this to the RootLayout in 'app/layout.tsx'.
   - Insert the following script tag just before the closing </body> tag in all identified files:
     <script src="https://build-in-live-mvp.vercel.app/sdk.js" data-project-id="${createdProjectId}" async></script>

2. **Configure Security Headers (Crucial for SDK Iframe)**:
   - Configure the site to allow being embedded in an iframe specifically by "https://build-in-live-mvp.vercel.app".
   - **IMPORTANT**: Use 'Content-Security-Policy: frame-ancestors' instead of 'X-Frame-Options'. Avoid using 'ALLOWALL' as it is non-standard.
   - For **Vercel**: Update 'vercel.json' with:
     {
       "headers": [
         {
           "source": "/(.*)",
           "headers": [
             { "key": "Content-Security-Policy", "value": "frame-ancestors 'self' https://build-in-live-mvp.vercel.app" }
           ]
         }
       ]
     }
   - For **Next.js**: Update 'next.config.js' headers function with the same CSP.
   - For **Vite**: Update 'vite.config.ts' server.headers with the same CSP.

Please review the project structure, identify all relevant files, and apply these changes to ensure the feedback system works on every page.`

  const feedbackUrl = `https://build-in-live-mvp.vercel.app/feedback/${createdProjectId}`

  if (step === 'report') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F95A56]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-xl z-10 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-black tracking-tighter text-[#F95A56] uppercase">REPORT_ISSUE</h1>
            <p className="text-xs tracking-[0.2em] text-white/50 uppercase">
              Please describe the problem you encountered
            </p>
          </div>

          <form onSubmit={handleReportIssue} className="bg-[#131313] border border-white/10 p-6 shadow-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">Issue Details</label>
              <textarea
                required
                className="w-full bg-transparent border border-white/20 p-4 text-white text-sm focus:border-white focus:outline-none transition-colors min-h-[150px] resize-none"
                placeholder="What went wrong? e.g. 'I added the script but the cursor is not showing up...'"
                value={issueMemo}
                onChange={(e) => setIssueMemo(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <button
                disabled={loading || !issueMemo.trim()}
                type="submit"
                className="w-full h-14 bg-[#F95A56] hover:brightness-110 text-white font-black tracking-[0.3em] text-xs transition-all uppercase flex items-center justify-center disabled:opacity-50"
              >
                {loading ? "SUBMITTING..." : "SUBMIT & GO TO DASHBOARD"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(3)}
                className="w-full h-14 bg-transparent border border-white/10 text-white/50 hover:text-white hover:bg-white/5 font-black tracking-[0.3em] text-[10px] transition-all uppercase disabled:opacity-50"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
        {/* Background Gradients similar to login */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F95A56]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-xl z-10 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">ADD_SDK_SCRIPT</h1>
            <p className="text-xs tracking-[0.2em] text-white/50 uppercase">
              Paste this prompt into your AI assistant (e.g. Cursor.ai)
            </p>
          </div>

          <div className="bg-[#131313] border border-white/10 p-1 flex flex-col relative group shadow-2xl">
            <div className="absolute top-0 right-0 p-2 opacity-50 text-[9px] font-black uppercase tracking-widest text-[#F95A56]">Prompt</div>
            <pre className="bg-black/50 p-6 text-[12px] text-white/80 overflow-y-auto max-h-[300px] font-mono leading-relaxed whitespace-pre-wrap mt-6 custom-scrollbar">
              {aiPrompt}
            </pre>
            <div className="p-1">
              <button
                onClick={() => copyToClipboard(aiPrompt, 'ai')}
                className="w-full py-4 bg-[#F95A56] hover:brightness-110 text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(249,90,86,0.2)]"
              >
                {copied === 'ai' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copied === 'ai' ? 'COPIED_SUCCESSFULLY' : 'COPY_PROMPT'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative aspect-video w-full bg-[#131313] border border-white/10 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 left-0 p-2 z-10 opacity-50 text-[7px] font-black uppercase tracking-widest text-[#F95A56]">Installation_Guide</div>
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/ZqKPlCPFrLA?vq=hd1080" 
                title="Build In Live SDK Installation" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>

            <div className="space-y-3">
            <button
              disabled={loading}
              onClick={() => setStep(4)}
              className="w-full h-14 bg-white text-black font-black tracking-[0.3em] text-xs hover:bg-white/90 transition-all uppercase flex items-center justify-center disabled:opacity-50 border-4 border-transparent active:scale-[0.98]"
            >
              I ADDED THE SCRIPT →
            </button>
            <button
              disabled={loading}
              onClick={handleDoItLater}
              className="w-full h-14 bg-transparent border border-white/10 text-white/50 hover:text-white hover:bg-white/5 font-black tracking-[0.3em] text-[10px] transition-all uppercase disabled:opacity-50"
            >
              DO IT LATER
            </button>
            
            <button
              disabled={loading}
              onClick={() => setStep('report')}
              className="w-full text-[10px] tracking-[0.2em] text-white/30 hover:text-[#F95A56] uppercase transition-all mt-8 text-center"
            >
              Have a problem? Report Issue
            </button>
          </div>
        </div>
      </div>
    </div>
    )
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F95A56]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md z-10 space-y-10 text-center">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-[#F95A56]/10 border border-[#F95A56]/30 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-[#F95A56] animate-pulse" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">REDEPLOY_CHECK</h1>
            <p className="text-xs tracking-[0.2em] text-white/40 uppercase leading-relaxed">
              Did you redeploy your site?<br />
              The SDK only works on the live version of your deployment.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push(`/feedback/${createdProjectId}?testing=true`)}
              className="w-full h-16 bg-white text-black font-black tracking-[0.3em] text-xs hover:bg-white/90 transition-all uppercase flex items-center justify-center border-4 border-transparent active:scale-[0.98]"
            >
              YES, I REDEPLOYED →
            </button>
            <button
              onClick={() => setStep(3)}
              className="w-full h-14 bg-transparent border border-white/10 text-white/50 hover:text-white hover:bg-white/5 font-black tracking-[0.3em] text-[10px] transition-all uppercase"
            >
              NOT YET, TAKE ME BACK
            </button>

            <button
              disabled={loading}
              onClick={() => setStep('report')}
              className="w-full text-[10px] tracking-[0.2em] text-white/30 hover:text-[#F95A56] uppercase transition-all mt-8 text-center"
            >
              Have a problem? Report Issue
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono py-20">
        <div className="w-full max-w-3xl bg-[#0e0e0e] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-white/10">
            <h1 className="text-xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
              <Globe className="w-6 h-6 text-[#F95A56]" />
              PROVISION_NEW_PROJECT
            </h1>
            <p className="text-[10px] tracking-widest text-white/40 mt-2 uppercase">
              Initialize your live monitoring environment
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-16 overflow-y-auto max-h-[70vh] custom-scrollbar">
            {/* Step 01: Identity & Primary Info */}
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                <div className="text-[11px] font-black text-[#F95A56] tracking-[0.4em] uppercase opacity-70">Step_01 // Identity</div>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
              </div>

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
                  {logoFile ? logoFile.name : "Project_Logo"}
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Project Name *</label>
                  <input name="name" required className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="MY_COOL_UI" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Deployment URL *</label>
                  <input name="url" required className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] uppercase tracking-widest text-white/40">Demo Video (Youtube Embed URL)</label>
                <input name="demoVideo" className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="https://www.youtube.com/embed/..." />
              </div>

              {/* Multiple Screenshot Upload */}
              <div className="space-y-4">
                <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30 border-l-2 border-[#F95A56]/50 pl-2">Gallery_Preview</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  <label className="cursor-pointer">
                    <div className="aspect-video border-2 border-dashed border-white/10 hover:border-[#F95A56]/30 hover:bg-[#F95A56]/5 transition-all flex flex-col items-center justify-center gap-2 rounded group/ss">
                      <Upload className="w-5 h-5 text-white/10 group-hover/ss:text-[#F95A56]/40 transition-all" />
                      <span className="text-[7px] font-black uppercase tracking-widest text-white/20">Add_Image</span>
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

            {/* Step 02: Details & Context */}
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                <div className="text-[11px] font-black text-[#F95A56] tracking-[0.4em] uppercase opacity-70">Step_02 // Context</div>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-white/40">Executive Summary</label>
                  <textarea name="about" className="w-full bg-white/5 border border-white/10 p-5 text-sm focus:border-[#F95A56] outline-none transition-all h-32 resize-none rounded-xl leading-relaxed shadow-inner" placeholder="Tell us more about this project..." />
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Use Cases</label>
                    <input name="useCases" className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Feedback collection, Monitoring" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Categories</label>
                    <input name="categories" className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="SaaS, AI, Web3" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Target Audience</label>
                    <input name="targetAudience" className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Developers, PMs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">Tech Stacks</label>
                    <input name="techStacks" className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Next.js, Firebase..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10 flex flex-col gap-4">
              <button
                disabled={loading}
                type="submit"
                className="w-full h-16 bg-[#F95A56] hover:brightness-110 text-white font-black tracking-[0.3em] text-xs transition-all uppercase flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(249,90,86,0.3)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "PROVISIONING..." : "PROVISION_ENVIRONMENT →"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(1)}
                className="w-full h-14 bg-transparent border border-white/10 text-white/50 hover:text-white hover:bg-white/5 font-black tracking-[0.3em] text-[10px] transition-all uppercase disabled:opacity-50"
              >
                GO BACK
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-xl bg-[#131313] border border-white/10 p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-10">
          <h1 className="text-xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
            <User className="w-6 h-6 text-[#F95A56]" />
            IDENTIFY_USER
          </h1>
          <p className="text-[10px] tracking-widest text-white/40 mt-2 uppercase">
            Initialize your profile identity
          </p>
        </div>

        <form onSubmit={handleIdentitySubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.2em] text-white/50 uppercase block">
              Name <span className="text-[#F95A56]">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                required
                className="w-full bg-transparent border-b border-white/20 px-10 py-3 text-white text-sm focus:border-white focus:outline-none transition-colors"
                placeholder="ENTER_YOUR_NAME"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <button
              disabled={loading || !formData.userName.trim()}
              type="submit"
              className="w-full h-16 bg-white text-black font-black tracking-[0.3em] text-xs hover:bg-white/90 disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase flex items-center justify-center gap-3 active:scale-[0.98] shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
            >
              PROVISION_NEW_PROJECT →
            </button>
            
            <button
              type="button"
              disabled={loading || !formData.userName.trim()}
              onClick={async () => {
                if (formData.userName.trim()) {
                  // Save name even if skipping
                  await handleIdentitySubmit(null);
                }
                handleSkip();
              }}
              className="w-full h-16 bg-transparent border border-white/10 text-white font-black tracking-[0.3em] text-[10px] hover:bg-white/5 transition-all uppercase flex items-center justify-center gap-3 disabled:opacity-20 disabled:cursor-not-allowed"
            >
              EXPLORE_PLATFORM_FIRST
            </button>
          </div>
        </form>
      </div>
    </div>
  )

}
