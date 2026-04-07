"use client";

import React, { useEffect } from "react";
import { MoveLeft, MoveRight, Radio, Camera, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyboardProps {
  viewMode: "screenshots" | "live" | "demo";
  onViewModeChange: (mode: "screenshots" | "live" | "demo") => void;
  onPrev: () => void;
  onNext: () => void;
  onAddProject: () => void;
}

const Keyboard: React.FC<KeyboardProps> = ({ 
  viewMode, 
  onViewModeChange, 
  onPrev, 
  onNext,
  onAddProject
}) => {
  const [isLeftActive, setIsLeftActive] = React.useState(false);
  const [isRightActive, setIsRightActive] = React.useState(false);
  const [isAddActive, setIsAddActive] = React.useState(false);

  const triggerLeft = () => {
    setIsLeftActive(true);
    onPrev();
    setTimeout(() => setIsLeftActive(false), 150);
  };

  const triggerRight = () => {
    setIsRightActive(true);
    onNext();
    setTimeout(() => setIsRightActive(false), 150);
  };

  // Add hardware keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        triggerLeft();
      } else if (e.key === "ArrowRight") {
        triggerRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerLeft, triggerRight]);

  return (
    <div className="relative w-full py-4 flex items-center justify-center perspective-[2000px]">
      {/* 3D Isometric Container */}
      <div className="flex items-center justify-center gap-2 [transform:rotateX(45deg)_rotateZ(0deg)] transform-style-3d">
        
        {/* Previous Key */}
        <PremiumKey 
          active={isLeftActive} 
          onClick={triggerLeft} 
          className="w-24 h-24"
        >
          <MoveLeft strokeWidth={3} className="w-6 h-6 text-black/40 group-hover:text-black/80 transition-colors" />
        </PremiumKey>

        {/* LIVE Key */}
        <PremiumKey 
          active={viewMode === "live"} 
          onClick={() => onViewModeChange("live")}
          activeColor="#ef4444" // Vibrant Point Red
          glowColor="rgba(239, 68, 68, 0.6)"
          className="w-24 h-24"
        >
          <div className="flex flex-col items-center gap-1">
            <Radio strokeWidth={3} className={cn(
              "w-5 h-5 transition-all duration-300",
              viewMode === "live" ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-black/30"
            )} />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-sm",
              viewMode === "live" ? "text-white" : "text-black/40"
            )}>
              LIVE
            </span>
          </div>
        </PremiumKey>

        {/* SCREENSHOTS Key */}
        <PremiumKey 
          active={viewMode === "screenshots"} 
          onClick={() => onViewModeChange("screenshots")}
          glowColor="rgba(0, 0, 0, 0.1)"
          className="w-24 h-24"
        >
          <div className="flex flex-col items-center gap-1.5">
             <Camera strokeWidth={3} className={cn(
              "w-6 h-6 transition-all duration-300",
              viewMode === "screenshots" ? "text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]" : "text-black/30"
            )} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 text-center shadow-sm",
              viewMode === "screenshots" ? "text-black" : "text-black/50"
            )}>
              SHOTS
            </span>
          </div>
        </PremiumKey>

        {/* DEMO Key */}
        <PremiumKey 
          active={viewMode === "demo"} 
          onClick={() => onViewModeChange("demo")}
          glowColor="rgba(0, 0, 0, 0.1)"
          className="w-24 h-24"
        >
          <div className="flex flex-col items-center gap-1">
            <Play strokeWidth={3} className={cn(
              "w-5 h-5 transition-all duration-300 fill-current",
              viewMode === "demo" ? "text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]" : "text-black/30"
            )} />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-sm",
              viewMode === "demo" ? "text-black" : "text-black/50"
            )}>
              Demo
            </span>
          </div>
        </PremiumKey>

        {/* Add Project Key */}
        <PremiumKey 
          active={isAddActive} 
          onClick={() => {
            setIsAddActive(true);
            onAddProject();
            setTimeout(() => setIsAddActive(false), 200);
          }}
          glowColor="rgba(0, 0, 0, 0.1)"
          className="w-24 h-24"
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-xl font-black text-black/40 group-hover:text-black/80 transition-colors">+</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-black/40 group-hover:text-black/80 transition-colors">
              PROJECT
            </span>
          </div>
        </PremiumKey>

        {/* Next Key */}
        <PremiumKey 
          active={isRightActive} 
          onClick={triggerRight} 
          className="w-24 h-24"
        >
          <MoveRight strokeWidth={3} className="w-6 h-6 text-black/40 group-hover:text-black/80 transition-colors" />
        </PremiumKey>
      </div>

      <style jsx global>{`
        .transform-style-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
};

interface PremiumKeyProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  glowColor?: string;
  activeColor?: string;
}

const PremiumKey: React.FC<PremiumKeyProps> = ({ 
  children, 
  active, 
  onClick, 
  className,
  glowColor = "rgba(255, 255, 255, 0.15)",
  activeColor = "#ffffff"
}) => {
  const layerCount = active ? 4 : 32;
  const isColored = activeColor !== "#ffffff";

  return (
    <div 
      className={cn("relative group select-none cursor-pointer transform-style-3d transition-all duration-300", className)} 
      onClick={onClick}
    >
      {/* 3D Stack Base Side Shadows */}
      <div className="absolute inset-0 transform-style-3d pointer-events-none">
        {/* Shadow Projection */}
        <div className={cn(
          "absolute inset-x-2 inset-y-4 bg-black/20 blur-xl rounded-[2rem] transition-all duration-300",
          active ? "opacity-30 scale-95 translate-y-4" : "opacity-40 scale-110 translate-y-6"
        )}></div>
      </div>

      {/* Layered rounded sides */}
      {[...Array(layerCount)].map((_, i) => {
        const isTop = i === layerCount - 1;
        let bgColor;
        
        if (isColored) {
          // For colored buttons (Live red), create a solid dark-to-light stack
          const lightness = 40 + (i / layerCount) * 15;
          bgColor = `hsl(0, 80%, ${lightness}%)`;
        } else {
          // For white buttons, create a clean gray stack
          const lightness = 85 + (i / layerCount) * 10;
          bgColor = `hsl(0, 0%, ${lightness}%)`;
        }

        return (
          <div 
            key={i}
            className="absolute inset-0 rounded-[1.25rem] border-x border-b border-black/10"
            style={{ 
              transform: `translateZ(${i}px)`,
              backgroundColor: isTop ? (isColored ? activeColor : '#ffffff') : bgColor,
              opacity: 1
            }}
          />
        );
      })}

      {/* Top Face (Surface) */}
      <div 
        className={cn(
          "absolute inset-0 rounded-[1.25rem] transition-all duration-300 flex flex-col items-center justify-center transform-style-3d border border-black/5",
          !isColored && "bg-white group-hover:bg-[#fafafa]"
        )}
        style={{ 
          transform: `translateZ(${layerCount}px)`,
          backgroundColor: isColored ? activeColor : undefined
        }}
      >
        {/* Subtle Inner Bezel */}
        <div className="absolute inset-[1px] rounded-[1.2rem] border-t border-white/40 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Label Content */}
        <div className={cn(
          "relative z-10 transition-all duration-300 [transform:translateZ(1px)]",
          active ? "scale-90 opacity-60" : "group-hover:scale-105",
          isColored ? "text-white" : ""
        )}>
          {children}
        </div>

        {/* Active Glow - Projected from deep in the stack */}
        {active && (
          <div 
            className="absolute -inset-4 blur-2xl opacity-40 pointer-events-none rounded-full"
            style={{ backgroundColor: glowColor, transform: 'translateZ(-10px)' }}
          ></div>
        )}
      </div>
    </div>
  );
};

export default Keyboard;
