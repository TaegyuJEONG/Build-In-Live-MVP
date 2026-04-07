"use client";

import { Radio, Terminal, Cpu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const isProjectView = pathname.startsWith("/project/");
  const isStudioView = pathname === "/";
  const projectId = isProjectView ? pathname.split("/")[2] : null;
  const { firebaseUser } = useStore();
  const [visitedDesk, setVisitedDesk] = useState<{ id: string, ownerId: string, ownerName: string } | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('lastVisitedDeskId');
    const ownerId = localStorage.getItem('lastVisitedDeskOwnerId');
    const ownerName = localStorage.getItem('lastVisitedDeskOwnerName');
    if (id && ownerId && ownerName) {
      setVisitedDesk({ id, ownerId, ownerName });
    }
  }, []);

  const studioName = projectId === 'portfolio' ? 'JTG' : (projectId?.charAt(0).toUpperCase()! + projectId?.slice(1));

  const myDeskHref = firebaseUser ? `/desk/${firebaseUser.uid}` : "/auth";
  const isMyDeskActive = firebaseUser && pathname === `/desk/${firebaseUser.uid}`;

  return (
    <footer className="fixed bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center bg-[#0e0e0e]/80 backdrop-blur-xl z-[9005] border border-white/10 rounded-full overflow-hidden shadow-2xl">
      {/* Studio / Main */}
      <Link 
        href="/"
        className={`px-4 md:px-8 py-3 md:py-4 flex items-center gap-2 md:gap-3 transition-all duration-300 ${isStudioView ? 'bg-white/10 text-white font-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
      >
        <span className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-nowrap">Studio</span>
      </Link>
      
      <div className="w-px h-8 bg-white/10" />
      
      {/* My Desk - Active for the showcase drawer */}
      <Link 
        href={myDeskHref}
        className={`px-4 md:px-8 py-3 md:py-4 flex items-center gap-2 md:gap-3 transition-all duration-300 ${isMyDeskActive ? 'bg-white/10 text-white font-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
      >
        <span className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-nowrap">My Desk</span>
      </Link>

      <div className="w-px h-8 bg-white/10" />

      {isProjectView ? (
        /* Studio Owner's Desk - Active in Project View */
        <div className="px-4 md:px-8 py-3 md:py-4 flex items-center gap-2 md:gap-3 bg-white/10 text-white font-bold">
          <span className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-nowrap">{studioName}'s Desk</span>
        </div>
      ) : (
        /* Previous Desk - Shown on Main Interface */
        visitedDesk ? (
          <Link 
            href={`/desk/${visitedDesk.ownerId}?projectId=${visitedDesk.id}`}
            className={`px-4 md:px-8 py-3 md:py-4 flex items-center gap-2 md:gap-3 transition-all duration-300 ${pathname === `/desk/${visitedDesk.ownerId}` ? 'bg-white/10 text-white font-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            <span className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-bold text-nowrap">{visitedDesk.ownerName}'s Desk</span>
          </Link>
        ) : (
          <button className="px-4 md:px-8 py-3 md:py-4 flex items-center gap-2 md:gap-3 text-white/10 cursor-not-allowed">
            <span className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-bold text-nowrap">Previous Desk</span>
          </button>
        )
      )}
    </footer>

  );
}


