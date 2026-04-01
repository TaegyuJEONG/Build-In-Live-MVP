"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function LiveCursors({ projectId }: { projectId: string }) {
  const { init, setProject, users, currentUser, moveCursor } = useStore();
  
  const [trackedScrollY, setTrackedScrollY] = useState(0);

  useEffect(() => {
    init();
    setProject(projectId);
    
    const handleMouseMove = (e: MouseEvent) => {
      // Send scroll-aware coordinates so others see us at the right document position
      moveCursor(e.clientX, e.clientY + trackedScrollY);
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'BUILD_IN_LIVE_SYNC') {
        if (typeof e.data.scrollY === 'number') {
          setTrackedScrollY(e.data.scrollY);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("message", handleMessage);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("message", handleMessage);
    };
  }, [projectId, trackedScrollY]);

  // Mock users for "Busy" feel (random walk animation)
  const [mockUsers, setMockUsers] = useState<any[]>([]);

  useEffect(() => {
    const names = ["Sarah Chen", "Elena Rodriguez", "Alex Thompson", "Jun-ho Kim", "Aisha Roberts"];
    const colors = ["#FFB800", "#FF4582", "#1BFF72", "#00D1FF", "#9D4EFF"];
    
    // Initial random positions spread across the entire website height
    const initialMocks = names.map((name, i) => ({
      id: `mock-${i}`,
      name,
      color: colors[i],
      x: Math.random() * 2000 - 500,
      y: Math.random() * 5000,
      targetX: Math.random() * 2000,
      targetY: Math.random() * 5000,
      phase: Math.random() * Math.PI * 2,
      isWaiting: false,
      waitTime: Math.random() * 2000,
      projectId
    }));
    
    setMockUsers(initialMocks);

    const interval = setInterval(() => {
      setMockUsers(prev => prev.map(u => {
        // If waiting, just count down
        if (u.isWaiting) {
          if (u.waitTime <= 0) {
            return { 
              ...u, 
              isWaiting: false, 
              targetX: Math.random() * 2000, 
              targetY: Math.random() * 4000,
              phase: Math.random() * Math.PI * 2 
            };
          }
          return { ...u, waitTime: u.waitTime - 100 };
        }

        const dx = u.targetX - u.x;
        const dy = u.targetY - u.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Arrived?
        if (dist < 20) {
          return { ...u, isWaiting: true, waitTime: Math.random() * 3000 + 1000 };
        }

        const speed = 0.03;
        const newPhase = u.phase + 0.05;
        
        // Add a curved "sway" perpendicular to movement
        const swayX = Math.cos(newPhase) * 2;
        const swayY = Math.sin(newPhase) * 2;

        return {
          ...u,
          phase: newPhase,
          x: u.x + (dx * speed) + swayX,
          y: u.y + (dy * speed) + swayY,
        };
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [projectId]);

  // Filter users by current project and exclude self
  const others = users.filter(u => u.projectId === projectId && u.id !== currentUser?.id);
  const allVisibleUsers = [...others, ...mockUsers];

  return (
    <div className="pointer-events-none fixed inset-0 z-[8000] overflow-hidden">
      {allVisibleUsers.map((user) => (
        <div
          key={user.id}
          className="absolute left-0 top-0 transition-transform duration-[150ms] ease-linear flex items-center opacity-80"
          style={{ 
            transform: `translate(${user.x}px, ${user.y - trackedScrollY}px)`,
          }}
        >
          {/* Custom Cursor SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={user.color}
            stroke="white"
            strokeWidth="1.5"
            className="drop-shadow-lg"
            style={{ transform: 'translate(-4px, -4px)' }}
          >
            <path d="M5.65376 21.2058C5.2323 21.626 4.51034 21.3734 4.45347 20.783L2.52984 6.945C2.4551 6.1687 3.1687 5.4551 3.945 5.52984L17.783 7.45347C18.3734 7.51034 18.626 8.2323 18.2058 8.65376L13.7847 13.0847C13.6872 13.1824 13.633 13.3142 13.6339 13.4523L13.7744 19.3879C13.7885 19.9818 13.1165 20.3175 12.6599 19.944L8.14022 16.2081C8.04691 16.1309 7.92543 16.0963 7.80373 16.1121L5.65376 21.2058Z" />
          </svg>
          
          {/* User Tag */}
          <div 
            className="ml-2 px-2 py-0.5 text-[10px] font-bold text-white rounded-full shadow-lg"
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </div>
        </div>
      ))}
    </div>
  );
}
