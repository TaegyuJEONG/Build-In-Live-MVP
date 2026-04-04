"use client";

import { useEffect, useState } from "react";
import { useMyPresence, useOthers } from "@/liveblocks.config";

export function LiveCursors({ projectId }: { projectId: string }) {
  const [{ cursor }, updatePresence] = useMyPresence();
  const others = useOthers();
  const [trackedScrollY, setTrackedScrollY] = useState(0);
  const [trackedPathname, setTrackedPathname] = useState("");

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Parent window mouse move
      updatePresence({ 
        cursor: { 
          x: e.clientX, 
          y: e.clientY + trackedScrollY 
        },
        pathname: trackedPathname
      });
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.data) {
        if (e.data.type === 'BUILD_IN_LIVE_SYNC') {
          if (typeof e.data.scrollY === 'number') {
            setTrackedScrollY(e.data.scrollY);
          }
          if (typeof e.data.pathname === 'string') {
            setTrackedPathname(e.data.pathname);
            updatePresence({ pathname: e.data.pathname });
          }
        }
        // Handle mouse move from inside IFRAME (via SDK)
        else if (e.data.type === 'BUILD_IN_LIVE_MOUSEMOVE') {
          updatePresence({ 
            cursor: { 
              x: e.data.x, 
              y: e.data.y // SDK already includes scroll offset
            },
            pathname: trackedPathname
          });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("message", handleMessage);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("message", handleMessage);
    };
  }, [trackedScrollY, trackedPathname, updatePresence]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[8000] overflow-hidden">
      {others.map(({ connectionId, presence }) => {
        if (!presence || !presence.cursor) return null;
        
        // Filter: only show cursors on the same pathname
        if (presence.pathname !== trackedPathname) return null;
        
        return (
          <div
            key={connectionId}
            className="absolute left-0 top-0 transition-transform duration-[100ms] ease-out flex items-center opacity-80"
            style={{ 
              transform: `translate(${presence.cursor.x}px, ${presence.cursor.y - trackedScrollY}px)`,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={presence.color || "#F95A56"}
              stroke="white"
              strokeWidth="1.5"
              className="drop-shadow-lg"
              style={{ transform: 'translate(-4px, -4px)' }}
            >
              <path d="M5.65376 21.2058C5.2323 21.626 4.51034 21.3734 4.45347 20.783L2.52984 6.945C2.4551 6.1687 3.1687 5.4551 3.945 5.52984L17.783 7.45347C18.3734 7.51034 18.626 8.2323 18.2058 8.65376L13.7847 13.0847C13.6872 13.1824 13.633 13.3142 13.6339 13.4523L13.7744 19.3879C13.7885 19.9818 13.1165 20.3175 12.6599 19.944L8.14022 16.2081C8.04691 16.1309 7.92543 16.0963 7.80373 16.1121L5.65376 21.2058Z" />
            </svg>
            <div 
              className="ml-2 px-2 py-0.5 text-[10px] font-bold text-white rounded-full shadow-lg"
              style={{ backgroundColor: presence.color || "#F95A56" }}
            >
              {presence.name || "Anonymous"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
