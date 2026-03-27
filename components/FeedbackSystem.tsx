"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { MessageSquarePlus, X } from "lucide-react";

export function FeedbackSystem({ projectId }: { projectId: string }) {
  const { markers, comments, currentProject, addMarker, addComment } = useStore();
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");

  const projectMarkers = markers.filter(m => m.projectId === projectId);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isAddingMode) return;
    
    // Add marker at relative position inside the scrollable canvas
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    addMarker({ x, y, projectId });
    setIsAddingMode(false);
  };

  const handleMarkerClick = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    setActiveMarkerId(markerId === activeMarkerId ? null : markerId);
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMarkerId || !newCommentText.trim()) return;
    
    addComment(activeMarkerId, newCommentText.trim());
    setNewCommentText("");
  };

  return (
    <>
      {/* Invisible Canvas for dropping markers */}
      {isAddingMode && (
        <div 
          className="absolute inset-0 z-[9000] cursor-crosshair pointer-events-auto"
          onClick={handleCanvasClick}
        />
      )}

      {/* Render Markers */}
      <div className="pointer-events-none absolute inset-0 z-[9001]">
        {projectMarkers.map(marker => {
          const isActive = marker.id === activeMarkerId;
          const markerComments = comments[marker.id] || [];
          
          return (
            <div
              key={marker.id}
              className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-transform ${isActive ? 'scale-110 z-[9002]' : 'hover:scale-110 z-[9001]'}`}
              style={{ left: marker.x, top: marker.y }}
              onClick={(e) => handleMarkerClick(e, marker.id)}
            >
              <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center cursor-pointer shadow-lg
                ${isActive ? 'bg-[#F95A56] shadow-[#F95A56]/50' : 'bg-[#131313]'}`}
              {...(isAddingMode && { style: { pointerEvents: "none" } })}
              >
                <span className="text-white text-xs font-bold font-mono">
                  {markerComments.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comment Side Panel */}
      {activeMarkerId && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#131313] border-l border-[#2A2A2A] z-[9003] shadow-2xl flex flex-col p-4 animate-in slide-in-from-right duration-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2A2A2A]">
            <h3 className="text-white font-bold text-[10px] tracking-widest uppercase">DISCUSSION THREAD</h3>
            <button onClick={() => setActiveMarkerId(null)} className="text-[#919191] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {(comments[activeMarkerId] || []).length === 0 && (
              <p className="text-[#919191] text-xs font-mono">No comments yet. Start the discussion!</p>
            )}
            
            {(comments[activeMarkerId] || []).map(comment => (
              <div key={comment.id} className="bg-[#1B1B1B] p-3 border border-[#2A2A2A]">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-white font-bold text-[10px] uppercase font-mono">{comment.author}</span>
                  <span className="text-[#919191] text-[10px]">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[#C6C6C6] text-sm font-mono leading-relaxed">{comment.text}</p>
              </div>
            ))}
          </div>
          
          <form className="mt-4 pt-4 border-t border-[#2A2A2A]" onSubmit={submitComment}>
            <input
              type="text"
              placeholder="$ TYPE COMMENT..."
              className="w-full bg-[#1B1B1B] text-white border border-[#2A2A2A] outline-none text-xs font-mono p-3 focus:border-[#F95A56] transition-colors"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              autoFocus
            />
          </form>
        </div>
      )}

      {/* Write Feedback Action Button */}
      <button
        onClick={() => {
          setIsAddingMode(!isAddingMode);
          setActiveMarkerId(null);
        }}
        className={`fixed bottom-12 right-12 z-[9004] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 border border-white/10
          ${isAddingMode ? 'bg-[#F95A56] text-white rotate-45' : 'bg-[#131313] text-white hover:bg-[#1B1B1B]'}`}
      >
        <MessageSquarePlus className="w-6 h-6" />
      </button>

      {/* Helper Toast equivalent */}
      {isAddingMode && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#F95A56] text-white px-6 py-2 rounded-full font-mono text-[10px] tracking-widest uppercase z-[9004] shadow-lg animate-in fade-in slide-in-from-top-4">
          CLICK ANYWHERE TO DROP A MARKER
        </div>
      )}
    </>
  );
}
