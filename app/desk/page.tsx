"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function DeskRedirect() {
  const { firebaseUser, init } = useStore();
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      router.replace(`/desk/${firebaseUser.uid}`);
    } else {
      // Fallback to taegyujeong's desk if not logged in (as requested/suggested by context)
      router.replace("/desk/taegyujeong");
    }
  }, [firebaseUser, router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/20 uppercase tracking-[0.5em] text-[10px]">
      REDIRECTING_TO_DESK...
    </div>
  );
}
