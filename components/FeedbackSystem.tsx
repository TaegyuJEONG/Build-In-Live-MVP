"use client";

import { useState, useEffect, RefObject } from "react";
import { useStorage, useMutation, useSelf } from "@/liveblocks.config";
import { LiveList } from "@liveblocks/client";
import { MessageSquarePlus, X, List, Trash2, Edit3, MapPin, Layout, ChevronLeft, ChevronRight } from "lucide-react";
import { auth, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { User, Ghost, CheckCircle } from "lucide-react";
import { Comment, Marker } from "@/liveblocks.config";
import { SnapshotOverlay } from "./SnapshotOverlay";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

const getTimeAgo = (timestamp?: string) => {
  if (!timestamp) return 'just now';
  const diff = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export function FeedbackSystem({ 
  projectId, 
  iframeRef, 
  ownerId,
  isAddingMode,
  setIsAddingMode,
  isFeedOpen,
  setIsFeedOpen,
  viewMode
}: { 
  projectId: string; 
  iframeRef?: RefObject<HTMLIFrameElement | null>; 
  ownerId?: string;
  isAddingMode: boolean;
  setIsAddingMode: (val: boolean) => void;
  isFeedOpen: boolean;
  setIsFeedOpen: (val: boolean) => void;
  viewMode?: "main" | "comments" | null | string;
}) {
  // 1. Storage access
  const markers = useStorage((root) => root.markers);
  const commentsMap = useStorage((root) => root.comments);
  const me = useSelf();
  
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [isNewMarker, setIsNewMarker] = useState(false);
  const [trackedScrollY, setTrackedScrollY] = useState(0);
  const [trackedPathname, setTrackedPathname] = useState(`/${projectId}`);
  const [trackedSearch, setTrackedSearch] = useState("");
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [elementRects, setElementRects] = useState<Record<string, { top: number, left: number, width: number, height: number, visible: boolean }>>({});
  const [viewingSnapshotMarker, setViewingSnapshotMarker] = useState<Marker | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isProjectOwner = currentUserUid && ownerId && currentUserUid === ownerId;

  const uploadScreenshot = async (base64: string): Promise<string | null> => {
    if (!storage) return null;
    try {
      const fileName = `screenshots/${projectId}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      const res = await fetch(base64);
      const blob = await res.blob();
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      return await getDownloadURL(storageRef);
    } catch (err) {
      console.error("Screenshot upload failed", err);
      return null;
    }
  };

  // Filtering local visibility (Strict by Path + Search)
  const visibleMarkers = (markers || []).filter(m => 
    m.pathname === trackedPathname && (m.search || "") === trackedSearch
  );

  // 2. Sync Logic (iframe/SDK)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'BUILD_IN_LIVE_SYNC') {
        if (typeof e.data.scrollY === 'number') setTrackedScrollY(e.data.scrollY);
        if (typeof e.data.pathname === 'string') setTrackedPathname(e.data.pathname);
        if (typeof e.data.search === 'string') setTrackedSearch(e.data.search);
      }
      if (e.data?.type === 'BUILD_IN_LIVE_RECTS_SYNC') {
        setElementRects(e.data.rects || {});
      }
      if (e.data?.type === 'BUILD_IN_LIVE_ELEMENT_CLICK') {
        processClick(e.data);
      }
      if (e.data?.type === 'BUILD_IN_LIVE_CANCEL_ADDING') {
        setIsAddingMode(false);
      }
    };

    const processClick = async (data: any) => {
        setIsCapturing(true);
        try {
          let screenshotUrl = undefined;
          if (data.screenshot) {
            screenshotUrl = await uploadScreenshot(data.screenshot) || undefined;
          }

          addMarker({ 
            x: data.x, 
            y: data.y, 
            scrollY: trackedScrollY, 
            pathname: trackedPathname,
            search: data.search || trackedSearch,
            selector: data.selector,
            xPercent: data.xPercent,
            yPercent: data.yPercent,
            screenshotUrl: screenshotUrl
          });
        } finally {
          setIsCapturing(false);
          setIsAddingMode(false);
        }
    };
    window.addEventListener('message', handleMessage);
    
    // Auth Listener
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUserUid(user?.uid || null);
      });
      return () => {
        window.removeEventListener('message', handleMessage);
        unsubscribe();
      };
    }
    
    return () => window.removeEventListener('message', handleMessage);
  }, [trackedScrollY, trackedPathname, trackedSearch]); 

  // View Sync Logic (Dual Monitor selection)
  useEffect(() => {
    const handleSync = (e: MessageEvent) => {
      if (e.data?.type === 'BUILD_IN_LIVE_SELECTION_SYNC') {
        const sid = e.data.markerId;
        if (sid !== activeMarkerId) {
          setActiveMarkerId(sid);
          
          // If we are in the comments view, we also need to scroll to the item
          if (viewMode === 'comments' && sid) {
            setTimeout(() => {
              const el = document.getElementById(`comment-${sid}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 150); // Slightly more delay to account for navigation/render
          }
        }
      }
    };
    window.addEventListener('message', handleSync);
    return () => window.removeEventListener('message', handleSync);
  }, [activeMarkerId, viewMode, trackedPathname]);

  const handleSelection = (id: string | null) => {
    setActiveMarkerId(id);
    window.parent.postMessage({ type: 'BUILD_IN_LIVE_SELECTION_SYNC', markerId: id }, '*');
  };

  // 3-Tier Bridge: Parent (Desk) -> This document -> Internal SDK IFrame
  useEffect(() => {
     const bridgeToChild = (e: MessageEvent) => {
        // Forward commands from Desk parent into the project preview SDK
        if (e.data?.type?.startsWith('BUILD_IN_LIVE_') && e.source === window.parent) {
           if (iframeRef?.current?.contentWindow) {
             iframeRef.current.contentWindow.postMessage(e.data, '*');
           }
        }
     };
     window.addEventListener('message', bridgeToChild);
     return () => window.removeEventListener('message', bridgeToChild);
  }, [iframeRef]);

  // 2.1 Element Tracking Loop
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    
    const syncRects = () => {
      if (iframeRef?.current) {
        const selectors = markers.filter(m => m.pathname === trackedPathname && m.selector).map(m => m.selector!);
        if (selectors.length > 0) {
          iframeRef.current.contentWindow?.postMessage({
            type: 'BUILD_IN_LIVE_GET_ELEMENT_RECTS',
            selectors
          }, '*');
        }
      }
    };

    const interval = setInterval(syncRects, 100); // 10fps tracking
    return () => clearInterval(interval);
  }, [markers, trackedPathname]);

  // 2.2 Adding Mode Trigger
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddingMode) {
        setIsAddingMode(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    if (isAddingMode) {
      setActiveMarkerId(null);
      setIsFeedOpen(false);
      
      if (iframeRef?.current) {
        iframeRef.current.contentWindow?.postMessage({ type: 'BUILD_IN_LIVE_START_ADDING' }, '*');
      }
    } else {
      if (iframeRef?.current) {
        iframeRef.current.contentWindow?.postMessage({ type: 'BUILD_IN_LIVE_STOP_ADDING' }, '*');
      }
    }

    return () => window.removeEventListener('keydown', handleEsc);
  }, [isAddingMode, setIsAddingMode, iframeRef]);

  // 3. Liveblocks Mutations
  const addMarker = useMutation(({ storage }, markerData: Partial<Marker>) => {
    const newId = Math.random().toString(36).substring(7);
    const newMarker: Marker = {
      id: newId,
      x: markerData.x!,
      y: markerData.y!,
      projectId,
      author: me?.presence.name || "Anonymous",
      authorId: me?.connectionId.toString() || "",
      authorColor: me?.presence.color || "#F95A56",
      scrollY: markerData.scrollY!,
      pathname: markerData.pathname!,
      search: markerData.search,
      selector: markerData.selector,
      xPercent: markerData.xPercent,
      yPercent: markerData.yPercent,
      screenshotUrl: markerData.screenshotUrl
    };
    storage.get("markers").push(newMarker);
    storage.get("comments").set(newId, new LiveList([]));
    
    if (db) {
      updateDoc(doc(db, "projects", projectId), {
        feedbackCount: increment(1)
      }).catch(e => console.error("Firestore sync failed", e));
    }

    handleSelection(newId);
    setIsNewMarker(true);
    setIsFeedOpen(true);
  }, [me, projectId]);

  const addComment = useMutation(({ storage }, markerId: string, text: string) => {
    const commentsMap = storage.get("comments");
    let commentsList = commentsMap.get(markerId);
    
    if (!commentsList) {
      const newList = new LiveList<Comment>([]);
      commentsMap.set(markerId, newList);
      commentsList = newList;
    }

    commentsList.push({
      id: Math.random().toString(36).substring(7),
      text,
      author: me?.presence.name || "Anonymous",
      authorId: me?.connectionId.toString() || "",
      timestamp: new Date().toISOString()
    });
  }, [me]);

  const deleteMarker = useMutation(({ storage: liveblocksStorage }, markerId: string) => {
    const markers = liveblocksStorage.get("markers");
    const index = markers.findIndex(m => m.id === markerId);
    if (index !== -1) {
      const marker = markers.get(index);
      if (marker && marker.screenshotUrl && storage) {
        try {
          const screenshotRef = ref(storage, marker.screenshotUrl);
          deleteObject(screenshotRef).catch(e => console.error("Could not delete from storage", e));
        } catch (e) {
          console.error("Cleanup failed", e);
        }
      }
      markers.delete(index);
    }
    liveblocksStorage.get("comments").delete(markerId);
    
    if (db && projectId) {
      updateDoc(doc(db, "projects", projectId), {
        feedbackCount: increment(-1)
      }).catch(e => console.error("Firestore decrement failed", e));
    }

    handleSelection(null);
  }, [storage, projectId]);

  const editComment = useMutation(({ storage }, markerId: string, commentId: string, newText: string) => {
    const commentsList = storage.get("comments").get(markerId);
    if (commentsList) {
      const commentIndex = commentsList.findIndex(c => c.id === commentId);
      if (commentIndex !== -1) {
        const comment = commentsList.get(commentIndex);
        if (comment) {
          commentsList.set(commentIndex, { ...comment, text: newText });
        }
      }
    }
  }, []);

  const deleteComment = useMutation(({ storage }, markerId: string, commentId: string) => {
    const commentsList = storage.get("comments").get(markerId);
    if (commentsList) {
      const index = commentsList.findIndex(c => c.id === commentId);
      if (index !== -1) commentsList.delete(index);
    }
  }, []);

  return (
    <>
      {/* Markers Layer - Hidden on Comments View */}
      {viewMode !== 'comments' && (
        <div className="pointer-events-none absolute inset-0 z-[9001]">
          {(markers || []).filter(m => m.pathname === trackedPathname && (m.search || "") === trackedSearch).map(marker => {
            let displayX = marker.x;
            let displayY = marker.y - trackedScrollY;
            let isVisible = true;

            if (marker.selector && elementRects[marker.selector]) {
              const rect = elementRects[marker.selector];
              if (rect.visible) {
                displayX = rect.left + (rect.width * (marker.xPercent || 50) / 100);
                displayY = rect.top + (rect.height * (marker.yPercent || 50) / 100);
              } else {
                isVisible = false;
              }
            }

            if (!isVisible) return null;

            return (
              <div
                key={marker.id}
                className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-transform ${activeMarkerId === marker.id ? 'scale-110 z-[9002]' : 'hover:scale-110 z-[9001]'}`}
                style={{ left: displayX, top: displayY }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsFeedOpen(true); 
                  setIsNewMarker(false); 
                  const nextId = marker.id === activeMarkerId ? null : marker.id;
                  handleSelection(nextId);
                  if (nextId) {
                    setTimeout(() => {
                      document.getElementById(`comment-${nextId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }
                }}
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer shadow-lg transition-all overflow-hidden
                  ${activeMarkerId === marker.id ? 'border-[#F95A56] scale-110' : 'border-white hover:border-[#F95A56]'}`}
                  style={{ backgroundColor: marker.authorColor }}
                >
                  {marker.author === "Anonymous" ? (
                    <User className="w-5 h-5 text-white/80" />
                  ) : (
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(marker.author)}&background=random`} 
                      alt={marker.author}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side Feed Panel */}
      {viewMode !== 'main' && (
        <div 
          className={`${viewMode === 'comments' ? 'relative w-full h-full' : 'absolute right-0 top-0 bottom-0 w-full md:w-[400px] border-l translate-x-full'} bg-[#131313] border-[#2A2A2A] z-[9003] shadow-2xl flex flex-col p-0 transition-all duration-300 ease-in-out pointer-events-auto ${
            viewMode === 'comments' ? '' : (isFeedOpen || activeMarkerId ? 'translate-x-0' : '')
          }`}
        >
          {!isMobile && viewMode !== 'comments' && viewMode !== 'main' && (
            <button 
              onClick={() => {
              if (isFeedOpen || activeMarkerId) {
                setIsFeedOpen(false);
                handleSelection(null);
              } else {
                setIsFeedOpen(true);
              }
            }}
            className="absolute top-1/2 -left-6 -translate-y-1/2 w-6 h-20 bg-[#F95A56] hover:brightness-110 hover:w-7 flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(249,90,86,0.4)] rounded-l-[20px]"
          >
            {isFeedOpen || activeMarkerId ? <ChevronRight className="w-5 h-5 text-white" /> : <ChevronLeft className="w-5 h-5 text-white" />}
          </button>
        )}

        <div className={`flex-1 overflow-y-auto w-full bg-[#131313] p-4 flex flex-col gap-4 px-5 pb-12 scroll-smooth ${isMobile || viewMode === 'comments' ? 'pt-4' : 'pt-12'}`}>
          {(markers || []).length === 0 && (
            <div className="p-6 text-center text-[#919191] text-xs">No comments yet. Drop a marker to start!</div>
          )}
          
          {(markers || []).map((marker) => {
             const markerThread = (commentsMap as any)?.get?.(marker.id) || [];
             const isActive = activeMarkerId === marker.id;
             const text = replyText[marker.id] || "";
             
             return (
               <div key={marker.id} id={`comment-${marker.id}`} className={`bg-[#1A1A1A]/60 backdrop-blur-sm rounded-2xl p-4 pt-3.5 shadow-lg border transition-all cursor-pointer ${isActive ? 'border-[#F95A56]' : 'border-white/[0.05] hover:border-white/10'}`}
                    onClick={() => {
                       handleSelection(marker.id);
                       setIsNewMarker(false);
                       
                       const needsNav = marker.pathname !== trackedPathname;
                       const navMsg = {
                         type: 'BUILD_IN_LIVE_NAVIGATE',
                         pathname: marker.pathname,
                         search: marker.search || ""
                       };
                       const focusMsg = {
                         type: 'BUILD_IN_LIVE_FOCUS_SELECTOR',
                         selector: marker.selector
                       };

                       // Send to local reference (Internal SDK)
                       if (iframeRef?.current) {
                         if (needsNav) iframeRef.current.contentWindow?.postMessage(navMsg, '*');
                         setTimeout(() => {
                           iframeRef.current?.contentWindow?.postMessage(focusMsg, '*');
                         }, needsNav ? 800 : 50);
                       }

                       // ALWAYS ALSO send to parent (for Dual-Monitor bridge)
                       if (window.parent !== window) {
                         if (needsNav) window.parent.postMessage(navMsg, '*');
                         setTimeout(() => {
                           window.parent.postMessage(focusMsg, '*');
                         }, needsNav ? 800 : 50);
                       }
                    }}>
                 <div className="space-y-4">
                   {markerThread.map((comment: Comment, idx: number) => {
                     const isAuthor = me?.connectionId.toString() === comment.authorId;
                     const canDelete = isAuthor || isProjectOwner;
                     const isEditing = editingCommentId === comment.id;

                     return (
                       <div key={comment.id} className={`flex flex-col ${idx > 0 ? 'ml-4 mt-4 pt-4 border-t border-white/5' : ''}`}>
                         <div className="flex justify-between items-center mb-1">
                           <div className="flex items-center gap-2">
                             <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 flex items-center justify-center border border-white/10">
                               {comment.author === "Anonymous" ? <User className="w-3 h-3 text-white/60" /> : <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author)}&background=random`} alt={comment.author} className="w-full h-full object-cover" />}
                             </div>
                             <span className="text-[#E5E5E5] text-[13px] font-medium">{comment.author} <span className="text-[#A3A3A3] text-[11px] ml-1 font-normal">{getTimeAgo(comment.timestamp)}</span></span>
                           </div>
                           {canDelete && (
                             <div className="flex gap-2">
                               {isAuthor && <button onClick={() => { setEditingCommentId(comment.id); setEditingText(comment.text); }}><Edit3 className="w-3 h-3 text-white/40 hover:text-white" /></button>}
                               <button onClick={() => idx === 0 ? deleteMarker(marker.id) : deleteComment(marker.id, comment.id)}><Trash2 className="w-3 h-3 text-white/40 hover:text-red-500" /></button>
                             </div>
                           )}
                         </div>

                         {marker.screenshotUrl && (
                           <div className="mt-3 relative aspect-video rounded-lg overflow-hidden border border-white/5 cursor-zoom-in group transition-all hover:border-[#F95A56]/30" onClick={(e) => { e.stopPropagation(); setViewingSnapshotMarker(marker); }}>
                             <img src={marker.screenshotUrl} alt="Snapshot" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                           </div>
                         )}

                         <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-white/30">
                           <div className="bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1.5"><Layout className="w-2.5 h-2.5" />{marker.pathname}</div>
                         </div>

                         {isEditing ? (
                           <textarea className="mt-2 w-full bg-[#1F1F1F] text-white border border-[#F95A56] p-2 rounded text-sm outline-none" value={editingText} onChange={(e) => setEditingText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (editComment(marker.id, comment.id, editingText), setEditingCommentId(null))} autoFocus />
                         ) : (
                           <div className="text-[#D4D4D4] text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</div>
                         )}
                       </div>
                     );
                   })}
                 </div>

                 {isActive && (markerThread.length === 0 || isNewMarker) && (
                   <div className="mt-4" onClick={e => e.stopPropagation()}>
                     <form onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; addComment(marker.id, text.trim()); setReplyText(prev => ({...prev, [marker.id]: ""})); setIsNewMarker(false); handleSelection(null); setIsFeedOpen(false); }}>
                       <textarea placeholder="The issue is..." className="w-full bg-transparent text-white border-none outline-none text-sm p-0 placeholder:text-white/20 resize-none min-h-[80px]" value={text} onChange={(e) => setReplyText(prev => ({...prev, [marker.id]: e.target.value}))} autoFocus />
                       <div className="mt-2 flex justify-end"><button type="submit" className="text-xs text-[#F95A56] font-medium">Submit</button></div>
                     </form>
                   </div>
                 )}
               </div>
             );
          })}
        </div>
      </div>
      )}

      {isCapturing && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center pointer-events-none">
          <div className="bg-[#1A1A1A]/80 backdrop-blur-md px-6 py-4 rounded-3xl flex items-center gap-4 animate-in zoom-in-95">
            <div className="w-5 h-5 border-2 border-[#F95A56] border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm font-medium">Capturing visual context...</span>
          </div>
        </div>
      )}

      {viewingSnapshotMarker && (
        <SnapshotOverlay marker={viewingSnapshotMarker} onClose={() => setViewingSnapshotMarker(null)} />
      )}
    </>
  );
}
