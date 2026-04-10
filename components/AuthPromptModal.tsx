"use client";

import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

export function AuthPromptModal() {
  const { showAuthModal, setShowAuthModal } = useStore();
  const router = useRouter();

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={() => setShowAuthModal(false)} 
      />
      <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-white/5 border border-white/10 mx-auto flex items-center justify-center rounded-full mb-4">
          <UserPlus className="w-8 h-8 text-white/40" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">Join the Community</h3>
          <p className="text-[11px] text-white/40 uppercase tracking-widest leading-relaxed">
            To register your own project and participate,<br/>you need to join Build In Live.
          </p>
        </div>
        <div className="space-y-3 pt-4">
          <button 
            onClick={() => {
              setShowAuthModal(false);
              router.push("/auth?mode=signup");
            }}
            className="w-full py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
          >
            Join Community →
          </button>
          <button 
            onClick={() => {
              setShowAuthModal(false);
              router.push("/auth?mode=signin");
            }}
            className="w-full py-4 bg-transparent border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/5 transition-all"
          >
            Sign In
          </button>
        </div>
        <button 
          onClick={() => setShowAuthModal(false)}
          className="text-[9px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest pt-2"
        >
          Continue Browsing
        </button>
      </div>
    </div>
  );
}
