"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function LiveCursors({ projectId }: { projectId: string }) {
  const { connect, setProject, users, currentUser, moveCursor } = useStore();
  
  useEffect(() => {
    connect();
    setProject(projectId);
    
    const handleMouseMove = (e: MouseEvent) => {
      moveCursor(e.clientX, e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [projectId]);

  // Filter users by current project and exclude self
  const others = users.filter(u => u.projectId === projectId && u.id !== currentUser?.id);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {others.map((user) => (
        <div
          key={user.id}
          className="absolute left-0 top-0 transition-transform duration-75 ease-linear flex items-center"
          style={{ 
            transform: `translate(${user.x}px, ${user.y}px)`,
          }}
        >
          {/* Custom Cursor SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={user.color}
            stroke="white"
            strokeWidth="2"
            className="drop-shadow-md"
            style={{ transform: 'translate(-4px, -4px)' }}
          >
            <path d="M5.65376 21.2058C5.2323 21.626 4.51034 21.3734 4.45347 20.783L2.52984 6.945C2.4551 6.1687 3.1687 5.4551 3.945 5.52984L17.783 7.45347C18.3734 7.51034 18.626 8.2323 18.2058 8.65376L13.7847 13.0847C13.6872 13.1824 13.633 13.3142 13.6339 13.4523L13.7744 19.3879C13.7885 19.9818 13.1165 20.3175 12.6599 19.944L8.14022 16.2081C8.04691 16.1309 7.92543 16.0963 7.80373 16.1121L5.65376 21.2058Z" />
          </svg>
          
          {/* User Tag */}
          <div 
            className="ml-2 px-2 py-1 text-[10px] font-bold text-black rounded uppercase whitespace-nowrap"
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </div>
        </div>
      ))}
    </div>
  );
}
