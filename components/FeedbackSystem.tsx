"use client";

import { useState, useEffect, useRef, useCallback, RefObject } from "react";
import { useStore } from "@/lib/store";
import { MessageSquarePlus, X, List, Trash2, Users, Edit3 } from "lucide-react";

const getTimeAgo = (timestamp?: string) => {
  if (!timestamp) return 'just now';
  const diff = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
};

interface FeedbackProps {
  projectId: string;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
}

export function FeedbackSystem({ projectId, iframeRef }: FeedbackProps) {
  const { markers, comments, currentUser, currentProject, addMarker, addComment, editComment, deleteMarker, deleteComment } = useStore();
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [isNewMarker, setIsNewMarker] = useState(false);
  const [trackedScrollY, setTrackedScrollY] = useState(0);
  const [trackedPathname, setTrackedPathname] = useState(`/${projectId}`);

  const projectMarkers = markers.filter(m => 
    m.projectId === projectId && m.pathname === trackedPathname
  );
  
  const allProjectMarkers = markers.filter(m => m.projectId === projectId);

  // Listen for sync messages from the injected SDK (postMessage)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // Validate the message type
      if (e.data && e.data.type === 'BUILD_IN_LIVE_SYNC') {
        if (typeof e.data.scrollY === 'number') {
          setTrackedScrollY(e.data.scrollY);
        }
        if (typeof e.data.pathname === 'string') {
          setTrackedPathname(e.data.pathname);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-scroll to active marker in sidebar
  useEffect(() => {
    if (activeMarkerId) {
      setTimeout(() => {
        const element = document.getElementById(`marker-card-${activeMarkerId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
    }
  }, [activeMarkerId]);

  // Click handler — only active during marker-adding mode
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isAddingMode) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Content-relative Y = viewport-relative Y + current scroll offset from the SDK
    const y = (e.clientY - rect.top) + trackedScrollY;
    
    const newId = Math.random().toString(36).substring(7);
    addMarker({ 
      id: newId,
      x, 
      y, 
      projectId, 
      scrollY: trackedScrollY, 
      pathname: trackedPathname 
    });
    
    setIsAddingMode(false);
    
    // For NEW marker: Open feed AND expand with focus
    setIsFeedOpen(true);
    setIsNewMarker(true);
    setActiveMarkerId(newId);
  };
  
  const handleMarkerClick = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    setIsFeedOpen(true);
    setIsNewMarker(false); // Existing marker, just expand to show, don't focus
    setActiveMarkerId(markerId === activeMarkerId ? null : markerId);
  };



  return (
    <>
      {/* Full overlay — ONLY during marker-adding mode */}
      {isAddingMode && (
        <div 
          className="absolute inset-0 z-[9000] cursor-crosshair"
          style={{ pointerEvents: 'auto' }}
          onClick={handleCanvasClick}
        />
      )}

      {/* Render Markers — always visible, pointer-events only on marker bubbles */}
      <div className="pointer-events-none absolute inset-0 z-[9001]">
        {projectMarkers.map(marker => {
          const isActive = marker.id === activeMarkerId;
          const markerComments = comments[marker.id] || [];
          
          // Content-anchored: marker.y is content-relative, subtract current scroll to get viewport position
          const visualY = marker.y - trackedScrollY;
          
          return (
            <div
              key={marker.id}
              className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-transform ${isActive ? 'scale-110 z-[9002]' : 'hover:scale-110 z-[9001]'}`}
              style={{ left: marker.x, top: visualY }}
              onClick={(e) => handleMarkerClick(e, marker.id)}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer shadow-lg transition-all overflow-hidden
                ${isActive ? 'border-[#F95A56] scale-110' : 'border-white hover:border-[#F95A56]'}`}
                style={{ backgroundColor: marker.authorColor || '#131313' }}
                title={`Marker by ${marker.author}`}
              >
                <img 
                  src={`https://i.pravatar.cc/100?u=${encodeURIComponent(marker.author)}`} 
                  alt={marker.author}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(marker.author)}&background=random`; }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Feed Side Panel - Use absolute to stay within the content area below the header */}
      {(isFeedOpen || activeMarkerId) && (
        <div className="absolute right-0 top-0 bottom-0 w-[400px] bg-[#131313] border-l border-[#2A2A2A] z-[9003] shadow-2xl flex flex-col p-0 animate-in slide-in-from-right duration-200">
           {/* Sidebar Actions Overlay */}
           <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => { setIsFeedOpen(false); setActiveMarkerId(null); }} 
                className="text-[#919191] hover:text-white transition-colors cursor-pointer bg-black/20 p-1.5 rounded-full hover:bg-black/40"
              >
                <X className="w-4 h-4" />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto w-full bg-[#131313] p-4 flex flex-col gap-4 px-5 pt-12 pb-12 scroll-smooth">
             {allProjectMarkers.length === 0 && (
               <div className="p-6 text-center text-[#919191] text-xs">No comments yet. Drop a marker to start!</div>
             )}
             {allProjectMarkers.map((marker, index) => {
                const markerThread = comments[marker.id] || [];
                const isProjectOwner = true; 
                const text = replyText[marker.id] || "";
                const isActive = activeMarkerId === marker.id;
                
                return (
                  <div key={marker.id} 
                       id={`marker-card-${marker.id}`}
                       className={`bg-[#1A1A1A]/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border transition-all cursor-pointer ${isActive ? 'border-[#F95A56]' : 'border-white/[0.05] hover:border-white/10'}`}
                       onClick={() => {
                          setActiveMarkerId(marker.id);
                          setIsNewMarker(false);
                          
                          if (marker.pathname && iframeRef?.current) {
                            if (marker.pathname !== trackedPathname) {
                              try {
                                const currentUrl = new URL(iframeRef.current.src);
                                currentUrl.pathname = marker.pathname;
                                // Add scroll target to hash for the SDK to read on load
                                currentUrl.hash = `bil_scroll=${Math.round(marker.scrollY || 0)}`;
                                iframeRef.current.src = currentUrl.toString();
                              } catch (e) { console.error(e); }
                            } else {
                              iframeRef.current.contentWindow?.postMessage({
                                type: 'BUILD_IN_LIVE_SCROLL',
                                scrollY: marker.scrollY
                              }, '*');
                            }
                          }
                       }}>
                    
                    {markerThread.length > 0 ? (
                      <div className="space-y-4">
                        {markerThread.map((comment, idx) => {
                          const isCommentAuthor = currentUser?.id === comment.authorId;
                          const isEditing = editingCommentId === comment.id;
                          const canEdit = isCommentAuthor;
                          const canDelete = isCommentAuthor || isProjectOwner;

                          return (
                            <div key={comment.id} className={`flex flex-col relative group/comment ${idx > 0 ? 'ml-4 mt-4 pt-4 border-t border-white/5' : ''}`}>
                              {/* Top Row */}
                              <div className="flex justify-between items-start">
                                {/* Avatar */}
                                {idx === 0 ? (
                                  <div className="w-10 h-10 bg-[#1c1c1c] rounded-full flex items-center justify-center border border-white/5 overflow-hidden">
                                    <img 
                                      src={`https://i.pravatar.cc/100?u=${encodeURIComponent(comment.author)}`} 
                                      alt={comment.author}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author)}&background=random`; }}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#E5E5E5] text-[14px] font-medium">{comment.author}</span>
                                    <span className="text-[#A3A3A3] text-[13px]">{getTimeAgo(comment.timestamp)}</span>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-3 text-[#A3A3A3] opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                  {canEdit && !isEditing && (
                                    <button onClick={(e) => { e.stopPropagation(); setEditingCommentId(comment.id); setEditingText(comment.text); }} className="hover:text-white transition-colors">
                                      <Edit3 className="w-[18px] h-[18px]" />
                                    </button>
                                  )}
                                  {canDelete && !isEditing && (
                                    <button onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (confirm("Delete this?")) {
                                        if (idx === 0) deleteMarker(marker.id);
                                        else deleteComment(marker.id, comment.id);
                                      } 
                                    }} className="hover:text-[#F95A56] transition-colors">
                                      <Trash2 className="w-[18px] h-[18px]" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Info for root comment */}
                              {idx === 0 && (
                                <>
                                  <div className="mt-3 text-[#A3A3A3] text-[13px]">
                                    #{index + 1} · {marker.pathname === '/genkle.html' ? 'Page 1' : marker.pathname?.replace('/', '') || 'Home'}
                                  </div>
                                  <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-[#E5E5E5] text-[14px] font-medium">{comment.author}</span>
                                    <span className="text-[#A3A3A3] text-[13px]">{getTimeAgo(comment.timestamp)}</span>
                                  </div>
                                </>
                              )}

                              {/* Body */}
                              {isEditing ? (
                                <form className="mt-2" onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); if (editingText.trim()) { editComment(marker.id, comment.id, editingText.trim()); setEditingCommentId(null); } }}>
                                  <textarea 
                                    className="w-full bg-[#1F1F1F] text-white border border-[#F95A56] outline-none text-[14px] p-3 rounded resize-none min-h-[80px]" 
                                    value={editingText} 
                                    onChange={(e) => setEditingText(e.target.value)} 
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (editingText.trim()) {
                                          editComment(marker.id, comment.id, editingText.trim());
                                          setEditingCommentId(null);
                                        }
                                      }
                                    }}
                                    onClick={e => e.stopPropagation()} 
                                    autoFocus 
                                  />
                                  <div className="flex justify-end gap-3 mt-2">
                                     <button type="button" onClick={(e) => { e.stopPropagation(); setEditingCommentId(null); }} className="text-[12px] text-[#A3A3A3] font-medium hover:text-white">Cancel</button>
                                     <button type="submit" onClick={e => e.stopPropagation()} className="text-[12px] text-[#F95A56] font-medium hover:brightness-125">Save</button>
                                  </div>
                                </form>
                              ) : (
                                <div className="mt-2 text-[#D4D4D4] text-[14px] leading-relaxed whitespace-pre-wrap tracking-wide">
                                  {comment.text}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#A3A3A3] italic py-2">
                        📍 Marker placed. Write a comment!
                      </div>
                    )}

                    {/* New Reply Field logic */}
                    {isNewMarker && (allProjectMarkers[allProjectMarkers.length - 1]?.id === marker.id) && (
                      <div className="mt-4 pt-4 border-t border-white/5" onClick={e => e.stopPropagation()}>
                        <form onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; addComment(marker.id, text.trim()); setReplyText(prev => ({...prev, [marker.id]: ""})); setIsNewMarker(false); }}>
                          <textarea 
                            placeholder="Write a reply..." 
                            className="w-full bg-[#1F1F1F] text-white border border-[#444] outline-none text-[14px] p-3 rounded-lg focus:border-[#F95A56] transition-colors resize-none min-h-[80px]" 
                            value={text} 
                            onChange={(e) => setReplyText(prev => ({...prev, [marker.id]: e.target.value}))} 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (text.trim()) {
                                  addComment(marker.id, text.trim());
                                  setReplyText(prev => ({...prev, [marker.id]: ""}));
                                  setIsNewMarker(false);
                                } else {
                                  // Submit empty = cleanup
                                  deleteMarker(marker.id);
                                  setIsNewMarker(false);
                                }
                              } else if (e.key === 'Escape') {
                                deleteMarker(marker.id);
                                setIsNewMarker(false);
                              }
                            }}
                            onBlur={() => {
                              // If blurred without content, remove the marker
                              if (!text.trim()) {
                                deleteMarker(marker.id);
                                setIsNewMarker(false);
                              }
                            }}
                            autoFocus 
                          />
                          <div className="mt-2 flex justify-end">
                            <button type="submit" className="text-[12px] text-[#F95A56] font-medium hover:brightness-125 px-2">Submit</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
             })}       
          </div>
        </div>
      )}

      {/* Action Buttons - Use absolute to sync with the workspace layout */}
      <div className={`absolute bottom-12 z-[9004] flex flex-col gap-3 transition-all duration-300 ${isFeedOpen || activeMarkerId ? 'right-[440px]' : 'right-12'}`}>
        <button
          onClick={() => { setIsFeedOpen(!isFeedOpen); if(!isFeedOpen) setActiveMarkerId(null); }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 border border-white/10
            ${isFeedOpen ? 'bg-white text-black' : 'bg-[#131313] text-white hover:bg-[#1B1B1B]'}`}
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            setIsAddingMode(!isAddingMode);
            setActiveMarkerId(null);
            setIsFeedOpen(false);
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 border border-white/10
            ${isAddingMode ? 'bg-[#F95A56] text-white rotate-45' : 'bg-[#131313] text-white hover:bg-[#1B1B1B]'}`}
        >
          <MessageSquarePlus className="w-6 h-6" />
        </button>
      </div>

      {/* Helper Toast */}
      {isAddingMode && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#F95A56] text-white px-6 py-2 rounded-full font-mono text-[10px] tracking-widest uppercase z-[9004] shadow-lg animate-in fade-in slide-in-from-top-4">
          CLICK ANYWHERE TO DROP A MARKER
        </div>
      )}
    </>
  );
}
