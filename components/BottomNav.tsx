"use client";

import { Radio, Terminal, Cpu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const isProjectView = pathname.startsWith("/project/");
  const projectId = isProjectView ? pathname.split("/")[2] : null;
  const [lastVisitedDesk, setLastVisitedDesk] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('lastVisitedDesk');
    if (saved) setLastVisitedDesk(saved);
  }, []);

  const studioName = projectId === 'portfolio' ? 'JTG' : (projectId?.charAt(0).toUpperCase()! + projectId?.slice(1));


  return (
    <footer className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center bg-[#0e0e0e]/80 backdrop-blur-xl z-[9005] border border-white/10 rounded-full overflow-hidden shadow-2xl">
      {/* Studio / Main */}
      <Link 
        href="/"
        className={`px-8 py-4 flex items-center gap-3 transition-colors ${!isProjectView ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-nowrap">Studio</span>
      </Link>
      
      <div className="w-px h-8 bg-white/10" />
      
      {/* My Desk - Always inactive for now */}
      <button className="px-8 py-4 flex items-center gap-3 text-white/20 hover:text-white/60 transition-colors cursor-not-allowed">
        <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-nowrap">My Desk</span>
      </button>

      <div className="w-px h-8 bg-white/10" />

      {isProjectView ? (
        /* Studio Owner's Desk - Active in Project View */
        <div className="px-8 py-4 flex items-center gap-3 bg-white/10 text-white font-bold">
          <span className="text-[10px] tracking-[0.2em] uppercase text-nowrap">{studioName}'s Desk</span>
        </div>
      ) : (
        /* Previous Desk - Shown on Main Interface */
        lastVisitedDesk ? (
          <Link 
            href={`/project/${lastVisitedDesk}`}
            className="px-8 py-4 flex items-center gap-3 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-nowrap">Previous Desk</span>
          </Link>
        ) : (
          <button className="px-8 py-4 flex items-center gap-3 text-white/10 cursor-not-allowed">
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-nowrap">Previous Desk</span>
          </button>
        )
      )}
    </footer>

  );
}


