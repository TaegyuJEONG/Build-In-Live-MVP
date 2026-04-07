"use client";

import React from "react";

const TopNav = () => {
  const [activeTab, setActiveTab] = React.useState("PROJECTS");

  const tabs = [
    { id: "PROJECTS", label: "PROJECTS" },
    { id: "PROFILE", label: "PROFILE" },
    { id: "ROLLING_PAPER", label: "ROLLING_PAPER" }
  ];

  return (
    <header className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-auto">
      <nav className="flex items-center gap-12 px-6">
        {tabs.map((tab) => (
          <div key={tab.id} className="relative flex flex-col items-center">
            <button 
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 px-1 text-[11px] font-black tracking-[0.3em] transition-all duration-300 uppercase cursor-pointer ${
                activeTab === tab.id 
                  ? "text-white" 
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {tab.label}
            </button>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white animate-in fade-in zoom-in duration-300" />
            )}
          </div>
        ))}
      </nav>
    </header>
  );
};

export default TopNav;
