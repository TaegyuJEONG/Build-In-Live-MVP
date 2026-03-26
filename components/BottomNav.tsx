"use client";

import { Radio, Terminal, Cpu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const isProjectView = pathname.startsWith("/project/");

  return (
    <footer className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center bg-[#0e0e0e]/80 backdrop-blur-xl z-[9005] border border-white/5 rounded-full overflow-hidden">
      <Link 
        href="/"
        className={`px-8 py-4 flex items-center gap-3 transition-colors ${!isProjectView ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-bold">Builders' Studio</span>
      </Link>
      
      <div className="w-px h-8 bg-white/10" />
      
      <button className="px-8 py-4 flex items-center gap-3 text-white/20 hover:text-white/60 transition-colors cursor-not-allowed">
        <span className="text-[10px] tracking-[0.2em] uppercase font-bold">My Desk</span>
      </button>

      {isProjectView && (
        <>
          <div className="w-px h-8 bg-white/10" />
          <div className="px-8 py-4 flex items-center gap-3 text-[#F95A56] font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] uppercase">Live</span>
          </div>
        </>
      )}
    </footer>
  );
}
