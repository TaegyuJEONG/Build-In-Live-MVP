"use client";

import React from "react";

const Toolbox = () => {
  return (
    <footer className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/5 rounded-full p-1.5 shadow-2xl">
        <button className="px-8 py-2.5 rounded-full text-[13px] font-bold tracking-widest text-white/40 hover:text-white transition-all uppercase">
          STUDIO
        </button>
        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
        <button className="px-8 py-2.5 rounded-full text-[13px] font-bold tracking-widest text-white transition-all bg-white/5 uppercase shadow-inner">
          MY DESK
        </button>
        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
        <button className="px-8 py-2.5 rounded-full text-[13px] font-bold tracking-widest text-white/40 hover:text-white transition-all uppercase">
          Tom's DESK
        </button>
      </div>
    </footer>
  );
};

export default Toolbox;
