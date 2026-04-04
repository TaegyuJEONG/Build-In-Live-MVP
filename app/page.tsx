"use client"

import { Radio, Terminal, Cpu, Plus, Minus, Layers, Grid3x3, BarChart3, Settings, Focus, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/BottomNav"
import React, { useEffect, useState, useRef, useMemo } from "react"
import { useStore } from "@/lib/store"
import { RoomProvider, useStorage, useOthers } from "@/liveblocks.config"
import { ClientSideSuspense } from "@liveblocks/react"
import { LiveList, LiveMap } from "@liveblocks/client"

// Company logos as SVG components - lesser known companies
const CompanyLogos: Record<string, React.ReactNode> = {
  axiom: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  retool: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <circle cx="17.5" cy="17.5" r="3.5"/>
    </svg>
  ),
  linear: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M3 21L21 3M3 15L15 3M3 9L9 3" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  cal: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  raycast: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M4 20l4-4M8 20l4-4M12 20l4-4M16 20l4-4M4 16l4-4M4 12l4-4M20 4l-4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  resend: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M4 4h10a6 6 0 010 12h-4v4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clerk: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  planetscale: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 3a9 9 0 019 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  upstash: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 3v18M12 3l6 6M12 3L6 9M12 9l4 4M12 9l-4 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  inngest: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M4 12h4l2-6 4 12 2-6h4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  trigger: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <polygon points="5,3 19,12 5,21" fill="currentColor"/>
    </svg>
  ),
  convex: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  ),
  neon: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M4 4v16h4V8l8 12h4V4h-4v12L8 4H4z" fill="currentColor"/>
    </svg>
  ),
  turso: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  dub: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z" fill="currentColor"/>
      <circle cx="16" cy="12" r="4" fill="currentColor"/>
    </svg>
  ),
  tinybird: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M12 4l-8 8 8 8 8-8-8-8z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 8l-4 4 4 4 4-4-4-4z" fill="currentColor"/>
    </svg>
  ),
  knock: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 4"/>
    </svg>
  ),
  depot: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <rect x="4" y="8" width="16" height="10" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 8V6a4 4 0 018 0v2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  airplane: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
    </svg>
  ),
  plain: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
}

const logoColors: Record<string, string> = {
  axiom: "#00D4AA",
  retool: "#FF6B35",
  linear: "#5E6AD2",
  cal: "#FF4D4D",
  raycast: "#FF6363",
  resend: "#00D4AA",
  clerk: "#6C47FF",
  planetscale: "#00D4AA",
  upstash: "#00E9A3",
  inngest: "#5865F2",
  trigger: "#22C55E",
  convex: "#EE5522",
  neon: "#00E5A0",
  turso: "#4FF8D2",
  dub: "#0066FF",
  tinybird: "#00D4AA",
  knock: "#7C3AED",
  depot: "#FF6B35",
  airplane: "#3B82F6",
  plain: "#FF4D4D",
}

// Hex directions for clockwise spiral tracking
const hexDirections = [
  { q: 0, r: -1 }, // Top
  { q: 1, r: -1 }, // Top-Right
  { q: 1, r: 0 },  // Bottom-Right
  { q: 0, r: 1 },  // Bottom
  { q: -1, r: 1 }, // Bottom-Left
  { q: -1, r: 0 }  // Top-Left
];

const getHexPosition = (index: number) => {
  if (index === 0) return { q: 0, r: 0 };
  
  let ring = 1;
  let count = 0;
  
  while (true) {
    const ringSize = ring * 6;
    if (count + ringSize >= index) {
      // Find position in this ring
      let q = 0;
      let r = -ring;
      let posInRing = index - count - 1;
      
      const sideLength = ring;
      const side = Math.floor(posInRing / sideLength);
      const step = posInRing % sideLength;
      
      // Move to starting corner and then follow steps
      for (let s = 0; s < side; s++) {
        q += hexDirections[(s + 2) % 6].q * sideLength;
        r += hexDirections[(s + 2) % 6].r * sideLength;
      }
      q += hexDirections[(side + 2) % 6].q * step;
      r += hexDirections[(side + 2) % 6].r * step;
      
      return { q, r };
    }
    count += ringSize;
    ring++;
  }
};


// 3D Symbol Component for floating ? and ! - True isometric standing sign
function Symbol3D({ symbol }: { symbol: string }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 50,
        height: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "translateZ(45px) rotateX(-90deg) translateY(-15px)",
        transformStyle: "preserve-3d",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {/* Neon glow */}
      <div
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(249,90,86,0.7) 0%, rgba(249,90,86,0.3) 35%, transparent 65%)",
          filter: "blur(15px)",
        }}
      />
      
      {/* 3D extruded text */}
      <div
        style={{
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Front face */}
        <span
          style={{
            position: "relative",
            display: "block",
            fontSize: 52,
            fontWeight: 900,
            fontFamily: "Arial Black, sans-serif",
            color: "#F95A56",
            transform: "translateZ(0px)",
            textShadow: "0 0 15px rgba(249,90,86,1), 0 0 30px rgba(249,90,86,0.7), 0 0 60px rgba(249,90,86,0.4)",
          }}
        >
          {symbol}
        </span>
        
        {/* Solid extrusion - thin and tight */}
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translateZ(${-i * 0.8}px)`,
              fontSize: 52,
              fontWeight: 900,
              fontFamily: "Arial Black, sans-serif",
              color: i < 4 ? "#B52A27" : "#6B1512",
              zIndex: -i - 1,
            }}
          >
            {symbol}
          </span>
        ))}
      </div>
    </div>
  )
}

// 3D Fireworks Component - Bursting particles effect
function Fireworks3D() {
  const particles = Array.from({ length: 12 });
  return (
    <div
      style={{
        position: "absolute",
        width: 50,
        height: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "translateZ(60px) rotateX(-90deg)",
        transformStyle: "preserve-3d",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {/* Central Core Glow */}
      <div
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          background: "radial-gradient(circle, rgba(255,230,0,0.8) 0%, rgba(255,100,0,0.4) 40%, transparent 70%)",
          filter: "blur(10px)",
          borderRadius: "50%",
        }}
      />
      
      {/* Dynamic Spark Particles */}
      {particles.map((_, i) => (
        <div
          key={i}
          className="firework-spark"
          style={{
            position: "absolute",
            width: 4,
            height: 12,
            background: `linear-gradient(to top, transparent, ${["#FFD700", "#FF4500", "#00FF7F", "#00BFFF"][i % 4]})`,
            borderRadius: "2px",
            ["--angle" as string]: `${(i * 360) / 12}deg`,
            ["--delay" as string]: `${(i * 0.1)}s`,
            ["--color" as string]: ["#FFD700", "#FF4500", "#00FF7F", "#00BFFF"][i % 4],
          }}
        />
      ))}

      <style jsx>{`
        .firework-spark {
          transform-origin: center bottom;
          animation: spark-burst 1.5s infinite ease-out;
          animation-delay: var(--delay);
          opacity: 0;
        }

        @keyframes spark-burst {
          0% {
            transform: rotate(var(--angle)) translateY(0) scaleY(0.5);
            opacity: 1;
            filter: brightness(2);
          }
          50% {
            opacity: 1;
            filter: brightness(1.5);
          }
          100% {
            transform: rotate(var(--angle)) translateY(-40px) scaleY(1.5);
            opacity: 0;
            filter: brightness(1);
          }
        }
      `}</style>
    </div>
  );
}


interface CubeProps {
  x: number
  y: number
  ring: number
  delay: number
  type?: string
  logo?: string
  visitors?: number
  isHidden?: boolean
  onClick?: () => void
  isCommitting?: boolean
  commitDelay?: number
  commitColor?: string
  isHeartActive?: boolean
  heartDelay?: number
  hasIssue?: boolean
  isOwner?: boolean
}

function Cube({ x, y, ring, delay, type, logo, visitors = 0, isHidden = false, onClick, isCommitting = false, commitDelay = 0, commitColor = "white", isHeartActive = false, heartDelay = 0, hasIssue = false, isOwner = false }: CubeProps) {
  const isSpecial = type === "?" || type === "!" || type === "fireworks"
  const isFireworks = type === "fireworks"
  const isGold = type === "gold"
  const isWhite = type === "white"
  const cubeSize = 50
  const halfSize = cubeSize / 2
  
  return (
    <div
      className="cube-wrapper"
      style={{
        position: "absolute",
        width: 100,
        height: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(${x}px, ${y}px)`,
        zIndex: isSpecial ? 50 : 10,
        opacity: isHidden ? 0.05 : (hasIssue ? 0.4 : 1),
        pointerEvents: isHidden ? "none" : "auto",
        transition: "opacity 0.5s ease-in-out",
        animation: `drift 12s infinite ease-in-out`,
        animationDelay: `${delay}s`,
        ["--tx" as string]: `${x}px`,
        ["--ty" as string]: `${y}px`,
        ["--scale" as string]: 1,
      }}
    >
      {/* Interactive Hover Wrapper - Bumps up when committing */}
      <div 
        className={`absolute w-full h-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.05] hover:z-50 ${isCommitting ? 'animate-commit-bump' : ''}`}
        style={{ 
          transformStyle: "preserve-3d",
          ["--cb-delay" as string]: `${commitDelay}s`,
          ["--cb-duration" as string]: `12s` // Same as CommitTrace duration
        }}
        onClick={onClick}
      >

        {/* Glow effect for special and gold cubes */}
        {(isSpecial || isGold) && (
          <div
            style={{
              position: "absolute",
              width: 140,
              height: 140,
              background: isGold 
                ? "radial-gradient(circle, rgba(255,193,7,0.5) 0%, transparent 70%)"
                : isFireworks
                ? "radial-gradient(circle, rgba(255,255,100,0.5) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(249,90,86,0.4) 0%, transparent 70%)",
              filter: "blur(25px)",
              zIndex: -1,
            }}
          />
        )}
              

          <div
            style={{
              position: "relative",
              width: cubeSize,
              height: cubeSize,
              transformStyle: "preserve-3d",
              transform: "rotateX(60deg) rotateZ(-45deg)",
            }}
          >
            {/* 3D Symbol floating above cube completely integrated into the 3D space */}
            {isSpecial && !isFireworks && <Symbol3D symbol={type!} />}
            {isFireworks && <Fireworks3D />}
          <div
            className="hover:bg-white/90 transition-colors"
            style={{
              position: "absolute",
              width: cubeSize,
              height: cubeSize,
              background: isGold ? "#FFD700" : isWhite ? "#ffffff" : "#cccccc",
              transform: `translateZ(${halfSize}px)`,
              border: isOwner ? "2px solid #F95A56" : "0.5px solid rgba(255,255,255,0.1)",
              backfaceVisibility: "hidden",
            }}
          />
          
          {/* Left Face - This is where logos go */}
          <div
            style={{
              position: "absolute",
              width: cubeSize,
              height: cubeSize,
              background: isGold ? "#E5A000" : isWhite ? "#e0e0e0" : "#a0a0a0",
              transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
              border: isOwner ? "2px solid #F95A56" : "0.5px solid rgba(255,255,255,0.05)",
              backfaceVisibility: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Logo on left face */}
            {logo && CompanyLogos[logo] && (
              <div
                style={{
                  color: logoColors[logo] || "#ffffff",
                  transform: "rotateZ(45deg)",
                }}
              >
                {CompanyLogos[logo]}
              </div>
            )}
          </div>
          
          {/* Right Face - Red heat map based on visitors */}
          <div
            style={{
              position: "absolute",
              width: cubeSize,
              height: cubeSize,
              background: isGold ? "#B8860B" : isWhite ? "#cccccc" : (() => {
                const ratio = Math.min(visitors / 100, 1);
                // White (255, 255, 255) to Red (196, 30, 58) base on DESIGN.md
                const r = Math.round(255 - ratio * (255 - 196));
                const g = Math.round(255 - ratio * (255 - 30));
                const b = Math.round(255 - ratio * (255 - 58));
                return `rgb(${r}, ${g}, ${b})`;
              })(),
              transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
              border: isOwner ? "2px solid #F95A56" : "0.5px solid rgba(255,255,255,0.05)",
              backfaceVisibility: "hidden",
            }}
          />
        </div>

        {/* Commit Light Animation - Hexagonal Silhouette Layer */}
        <CommitTrace isCommitting={isCommitting} delay={commitDelay} duration={12} color={commitColor} />
        
        {/* Heart Float Animation */}
        <HeartFloat isHeartActive={isHeartActive} delay={heartDelay} duration={10} />
      </div>
    </div>
  )
}

const KEYWORD_POOL = ["AI", "SaaS", "FinTech", "Web3", "Marketplace", "DevTools", "API", "Data", "Social", "Gaming", "Platform", "Infrastructure", "No-code", "B2B"];

// Commit Animation Helper - Hexagonal SVG outline for the entire cube silhouette
function CommitTrace({ isCommitting, delay = 0, duration = 8, color = "white" }: { isCommitting: boolean; delay?: number; duration?: number; color?: string }) {
  if (!isCommitting) return null;
  
  const glowColor = color === "white" ? "rgba(255,255,255,0.8)" : "rgba(249,90,86,0.8)";
  const strokeColor = color === "white" ? "white" : "#F95A56";
  
  // Adjusted hexagonal silhouette for 50x50px cube based on visual feedback:
  // Width: 70.71, Silhouette Height: ~78.68 (Top-Y 35.36 + Side-Y 43.32)
  return (
    <div 
      className="absolute pointer-events-none" 
      style={{ 
        width: 70.71, 
        height: 78.68, 
        zIndex: 100,
        left: "50%",
        top: "50%",
        // Adjusted Nudge based on screenshot: Moved up to perfectly wrap the cube face
        transform: "translate(-50%, -50%) translateY(-2px)",
      }}
    >
      <svg
        width="70.71"
        height="78.68"
        viewBox="0 0 70.71 78.68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }}
      >
        <path
          d="M35.35 0 L70.71 17.68 L70.71 60.98 L35.35 78.68 L0 60.98 L0 17.68 Z"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-commit-svg"
          style={{ 
            ["--anim-delay" as string]: `${delay}s`,
            ["--anim-duration" as string]: `${duration}s`
          }}
        />
      </svg>
      
      <style jsx>{`
        .animate-commit-svg {
          stroke-dasharray: 60 340;
          stroke-dashoffset: 400;
          /* Slower, more sporadic cycle: 12 seconds where most of it is empty */
          animation: trace-svg var(--anim-duration) infinite linear;
          animation-delay: var(--anim-delay);
          opacity: 0;
        }

        @keyframes trace-svg {
          0% { stroke-dashoffset: 400; opacity: 0; }
          2% { opacity: 0.8; }
          20% { stroke-dashoffset: 0; opacity: 0.8; }
          22% { opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Heart Animation Helper - Floating heart effect for bookmark events
function HeartFloat({ isHeartActive, delay = 0, duration = 10 }: { isHeartActive: boolean; delay?: number; duration?: number }) {
  if (!isHeartActive) return null;
  
  return (
    <div 
      className="absolute pointer-events-none" 
      style={{ 
        width: 30, 
        height: 30, 
        zIndex: 110,
        left: "70%",
        top: "10%",
        transform: "translateZ(30px)",
      }}
    >
      <div 
        className="animate-heart-float"
        style={{ 
          ["--heart-delay" as string]: `${delay}s`,
          ["--heart-duration" as string]: `${duration}s`
        }}
      >
        <svg viewBox="0 0 24 24" fill="#F95A56" className="w-4 h-4 shadow-[0_0_10px_rgba(249,90,86,0.6)]">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      
      <style jsx>{`
        .animate-heart-float {
          animation: float-rise var(--heart-duration) infinite ease-out;
          animation-delay: var(--heart-delay);
          opacity: 0;
          transform-origin: center;
        }

        @keyframes float-rise {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          2% { transform: translateY(-10px) scale(1); opacity: 1; }
          15% { transform: translateY(-40px) scale(1.2); opacity: 0; }
          100% { transform: translateY(-40px) scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function BuildInLive() {
  const [mounted, setMounted] = React.useState(false)
  const router = useRouter();
  const { init, setProject, projects, users, firebaseUser } = useStore();

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedCube, setSelectedCube] = useState<any | null>(null);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  React.useEffect(() => {
    setMounted(true)
    init();
    setProject('home');
  }, []);

  // Real projects mapped to Hex Grid
  const cubePositions = useMemo(() => {
    // 1. Always start with the Gold Cube at center
    const cubes: any[] = [{
      id: 'center',
      x: 0,
      y: 0,
      q: 0, 
      r: 0,
      ring: 0,
      delay: 0,
      type: 'gold',
      visitors: 150,
      logo: undefined,
      isAutoCommitting: false,
      isHeartActive: false,
      commitDelay: 0,
      heartDelay: 0
    }];

    // 2. Add real projects clockwise around it
    projects.forEach((p, i) => {
      const pos = getHexPosition(i + 1);
      const x = 100 * (pos.q - pos.r);
      const y = 58 * (pos.q + pos.r);
      cubes.push({
        id: p.id,
        x,
        y,
        q: pos.q,
        r: pos.r,
        ring: Math.max(Math.abs(pos.q), Math.abs(pos.r), Math.abs(pos.q + pos.r)),
        delay: (i + 1) * 0.1,
        type: (p.scriptSkipped || p.hasIssue) ? undefined : '?',
        logo: undefined,
        visitors: p.feedbackCount * 10, // Mocked visitor intensity based on feedback
        isAutoCommitting: true,
        isHeartActive: true,
        commitDelay: Math.random() * 5,
        heartDelay: Math.random() * 10,
        projectData: p,
        hasIssue: p.hasIssue,
        isOwner: firebaseUser?.uid === p.ownerId
      });
    });

    return cubes;
  }, [projects, firebaseUser?.uid]);
  
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = -0.002 * e.deltaY;
    setZoom((prev) => Math.min(Math.max(0.2, prev + zoomFactor), 4));
  };

  const getCoordinates = () => {
    // Reverse coordinates signs so dragging right/down shows positive
    const cx = Math.round(-pan.x);
    const cy = Math.round(-pan.y);
    return `${cx}.${cy}.${zoom.toFixed(2)}_INF`;
  };

  const generateProjectCardData = (cube: any) => {
    if (cube.type === 'gold') return null;
    const p = cube.projectData;
    if (!p) return null;
    
    return {
      id: p.id,
      name: p.name.toUpperCase(),
      keywords: ["REAL_PROJECT", "LIVE_SYNC"],
      visitors: cube.visitors,
      likes: p.feedbackCount * 5,
      feedbacks: p.feedbackCount,
      errorsFixed: 0,
      url: p.url,
      hasIssue: p.hasIssue,
      issueMemo: p.issueMemo,
      description: p.description
    };
  };

  if (!mounted) return null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a] select-none" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Global Keyframes */}
      <style jsx global>{`
        @keyframes drift {
          0%, 100% { 
            transform: translate(var(--tx), var(--ty)) scale(var(--scale)) translateY(0px); 
          }
          50% { 
            transform: translate(var(--tx), var(--ty)) scale(var(--scale)) translateY(-8px); 
          }
        }

        .animate-commit-bump {
          animation: commit-bump var(--cb-duration) infinite ease-out;
          animation-delay: var(--cb-delay);
        }

        @keyframes commit-bump {
          0% { transform: translateY(0px); }
          5% { transform: translateY(-15px); }  /* Fast snap up */
          15% { transform: translateY(-12px); } /* Slight hang time */
          22% { transform: translateY(0px); }   /* Smooth return exactly when light fades */
          100% { transform: translateY(0px); }
        }

      `}</style>


      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-transparent">
        <div className="text-lg font-black tracking-tighter text-white/80 uppercase">
          BUILD_IN_LIVE
        </div>
        <div className="flex gap-2 relative">
          <button className="hover:bg-white/5 p-2 transition-colors">
            <Grid3x3 className="w-[18px] h-[18px] text-white/40" />
          </button>
          <button className="hover:bg-white/5 p-2 transition-colors">
            <BarChart3 className="w-[18px] h-[18px] text-white/40" />
          </button>
          <div className="relative">
            <button 
              className={`p-2 transition-colors ${isSettingsOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/40'}`}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <Settings className="w-[18px] h-[18px]" />
            </button>

            {isSettingsOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200"
                onMouseLeave={() => setIsSettingsOpen(false)}
              >
                <div className="p-1">
                  <button 
                    onClick={async () => {
                      const { auth } = await import("@/lib/firebase");
                      if (auth) {
                        await auth.signOut();
                        router.push("/auth");
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-[10px] tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-colors uppercase flex items-center gap-3"
                  >
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    Logout
                  </button>
                  <button 
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-[10px] tracking-widest text-[#F95A56]/60 hover:text-[#F95A56] hover:bg-[#F95A56]/5 transition-colors uppercase flex items-center gap-3"
                  >
                    <div className="w-1 h-1 bg-[#F95A56]/20 rounded-full" />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Lateral Spatial Controls */}
      <aside className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-0 z-50 p-0 bg-transparent">
        <div className="px-2 py-4 mb-4 border-l border-white/20">
          <div className="text-[8px] tracking-[0.3em] uppercase text-white/30 mb-1">COORDINATES</div>
          <div className="text-[10px] tracking-widest uppercase text-white">{getCoordinates()}</div>
        </div>
        <button 
          className="flex flex-col items-center justify-center w-12 h-12 hover:bg-white/5 text-white/30 transition-colors cursor-pointer"
          onClick={() => setZoom(z => Math.min(z + 0.2, 4))}
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          className="flex flex-col items-center justify-center w-12 h-12 hover:bg-white/5 text-white/30 transition-colors cursor-pointer"
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.2))}
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          className="flex flex-col items-center justify-center w-12 h-12 bg-white text-black hover:bg-white/80 transition-colors cursor-pointer"
          onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
        >
          <Focus className="w-4 h-4" />
        </button>
        <div className="relative">
          <button 
            className={`flex flex-col items-center justify-center w-12 h-12 transition-colors cursor-pointer ${isLayerMenuOpen || selectedKeyword ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/30'}`}
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
          >
            <Layers className="w-4 h-4" />
          </button>
          
          {isLayerMenuOpen && (
            <div className="fixed left-24 top-1/2 -translate-y-1/2 w-48 h-[380px] bg-[#0a0a0a]/90 backdrop-blur-md border border-white/20 shadow-2xl z-50 overflow-hidden flex flex-col">
              <div className="text-[10px] uppercase text-white/50 tracking-widest p-3 border-b border-white/10 bg-white/5">Filter by Keyword</div>
              <div className="flex flex-col flex-1 overflow-y-auto w-full [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
                <button 
                  onClick={() => { setSelectedKeyword(null); setIsLayerMenuOpen(false); }} 
                  className={`text-left text-[10px] p-3 uppercase tracking-wider transition-colors border-l-2 ${!selectedKeyword ? 'bg-white/10 text-white border-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5 border-transparent'}`}
                >
                  All Categories
                </button>
                {KEYWORD_POOL.map(kw => (
                  <button 
                    key={kw} 
                    onClick={() => { setSelectedKeyword(kw); setIsLayerMenuOpen(false); }} 
                    className={`text-left text-[10px] p-3 uppercase tracking-wider transition-colors border-l-2 ${selectedKeyword === kw ? 'bg-white/10 text-white border-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5 border-transparent'}`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Spatial Canvas */}
      <main 
        className="w-screen h-screen overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing" 
        style={{ 
          perspective: 1200,
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 85%)'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <div 
          className="relative flex items-center justify-center leading-none"
          style={{ 
            width: 1200, 
            height: 1200, 
            transformStyle: "preserve-3d",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          {/* Extremely thin Isometric Background Floor Grid */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 4000, height: 4000, zIndex: -1 }}>
            <svg width="100%" height="100%">
              <defs>
                {/* Pattern centered on the central cube (X=2000, Y=2000).
                    Y is shifted +29px (half-height) so lines run perfectly under the floor base of the cubes. */}
                <pattern id="iso-grid" width="200" height="116" patternUnits="userSpaceOnUse" patternTransform="translate(2000, 2029)">
                  <path d="M0,0 L200,116 M200,0 L0,116" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#iso-grid)" />
            </svg>
          </div>

          {cubePositions.map((cube, i) => {
            return (
              <Cube
                key={cube.id}
                x={cube.x}
                y={cube.y}
                ring={cube.ring}
                delay={cube.delay}
                type={cube.type}
                logo={cube.logo}
                visitors={cube.visitors}
                isHidden={false}
                isCommitting={cube.id === 'center' ? false : true}
                commitDelay={cube.commitDelay}
                commitColor={"white"}
                isHeartActive={cube.isHeartActive}
                heartDelay={cube.heartDelay}
                hasIssue={cube.hasIssue}
                isOwner={cube.isOwner}
                onClick={() => {
                  if (!isDragging.current) {
                    setSelectedCube(cube);
                  }
                }}
              />
            );
          })}
        </div>
      </main>

      {/* Project Status Modal / Detail Overlay */}
      {selectedCube && selectedCube.type !== 'gold' && (() => {
        const data = generateProjectCardData(selectedCube);
        if (!data) return null;
        return (
          <div 
            className="fixed right-12 top-1/2 -translate-y-1/2 z-[100] w-[340px] bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-8 duration-300 pointer-events-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-white/10 bg-white/5">
              <div className="text-[10px] font-black tracking-[0.2em] text-white">
                STATUS // {data.name}
              </div>
              <button 
                className="text-white/50 hover:text-white transition-colors p-1 cursor-pointer"
                onClick={() => setSelectedCube(null)}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-6">
              {/* Description */}
              {data.description && (
                <div>
                  <div className="text-[9px] text-white/40 tracking-[0.3em] uppercase mb-3">Project Description</div>
                  <div className="text-[11px] leading-relaxed text-white/80 opacity-90">
                    {data.description}
                  </div>
                </div>
              )}

              {/* URL */}
              <div>
                <div className="text-[9px] text-white/40 tracking-[0.3em] uppercase mb-3">Live Environment</div>
                <div className="text-[11px] text-white/80 font-mono break-all bg-white/5 p-2 border border-white/10">
                  {data.url}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10">
                <RoomProvider 
                  id={data.id} 
                  initialPresence={{ cursor: null, name: "Anonymous", color: "#F95A56", pathname: "" }}
                  initialStorage={{ markers: new LiveList([]), comments: new LiveMap() }}
                >
                  <div className="flex flex-col gap-1 p-3 bg-[#0a0a0a]/90 backdrop-blur-md">
                    <div className="text-[8px] text-white/40 tracking-[0.15em] uppercase mb-1">Feedback Count</div>
                    <div className="text-xl font-mono text-white flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <ClientSideSuspense fallback={<>{data.feedbacks}</>}>
                        {() => <LiveFeedbackCountReader fallback={data.feedbacks} />}
                      </ClientSideSuspense>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-[#0a0a0a]/90 backdrop-blur-md">
                    <div className="text-[8px] text-white/40 tracking-[0.15em] uppercase mb-1">Viewing</div>
                    <div className="text-xl font-mono text-white/90 px-1 flex items-center gap-2">
                      <ClientSideSuspense fallback={<>{data.visitors}</>}>
                        {() => <LiveVisitorCountReader fallback={data.visitors} />}
                      </ClientSideSuspense>
                    </div>
                  </div>
                </RoomProvider>
              </div>

              {/* Issue Memo */}
              {data.hasIssue && data.issueMemo && (
                <div>
                  <div className="text-[9px] text-[#F95A56] tracking-[0.3em] uppercase mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Reported Issue
                  </div>
                  <div className="text-[11px] text-white/80 bg-[#1a0f0f] border border-[#F95A56]/30 p-4 leading-relaxed relative">
                    {data.issueMemo}
                    <div className="absolute top-0 right-0 w-2 h-2 bg-[#F95A56] rounded-bl" />
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <button 
                className="w-full py-4 mt-1 bg-white text-black font-black tracking-[0.3em] text-[10px] hover:bg-white/90 transition-colors uppercase border-none cursor-pointer"
                onClick={() => router.push(`/feedback/${data.id}`)}
              >
                ENTER_FEEDBACK_TERMINAL
              </button>

            </div>
          </div>
        );
      })()}

      {/* Bottom Navigation */}
      <BottomNav />



      {/* Node Analysis Overlay */}
      <div className="fixed top-32 right-12 w-48 p-0 bg-transparent pointer-events-none">
        <div className="font-bold text-[8px] tracking-[0.4em] text-white/20 mb-6 uppercase border-b border-white/10 pb-2">
          LIVE_ANALYSIS
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <span className="text-[8px] text-white/30 uppercase tracking-widest">Studio Viewing</span>
            <span className="text-[10px] text-[#F95A56] font-mono font-bold">{(users?.length || 0) + 1}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[8px] text-white/30 uppercase tracking-widest">Active Desks</span>
            <span className="text-[10px] text-white/60 font-mono">{projects.length}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[8px] text-white/30 uppercase tracking-widest">Total Feedback</span>
            <span className="text-[10px] text-white/60 font-mono">
              {projects.reduce((acc, p) => acc + (Number(p.feedbackCount) || 0), 0)}
            </span>
          </div>
        </div>
      </div>
      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-[#F95A56]/30 shadow-2xl p-8 space-y-6">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-[#F95A56]/10 border border-[#F95A56]/30 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#F95A56]" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">DELETE_ACCOUNT</h2>
              <p className="text-[11px] text-white/50 leading-relaxed uppercase tracking-wider">
                Are you sure you want to delete your account?<br/>
                All projects and data will be permanently removed. This action cannot be undone.
              </p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={async () => {
                  try {
                    const { auth, db } = await import("@/lib/firebase");
                    const user = auth?.currentUser;
                    if (user && db) {
                      const { doc, deleteDoc, collection, query, where, getDocs, writeBatch } = await import("firebase/firestore");
                      
                      // 1. Delete all user-owned projects
                      const projectsRef = collection(db, "projects");
                      const q = query(projectsRef, where("ownerId", "==", user.uid));
                      const projectSnapshots = await getDocs(q);
                      
                      const batch = writeBatch(db);
                      projectSnapshots.forEach((pDoc) => {
                        batch.delete(pDoc.ref);
                      });
                      await batch.commit();

                      // 2. Delete user document from Firestore
                      await deleteDoc(doc(db, "users", user.uid));
                      
                      // 3. Delete user account from Firebase Auth
                      await user.delete();
                      router.push("/auth");
                    }
                  } catch (error: any) {
                    console.error("Deletion failed:", error);
                    if (error.code === 'auth/requires-recent-login') {
                      alert("Please log in again to continue. (Recent login session required)");
                    }
                  }
                }}
                className="w-full py-4 bg-[#F95A56] text-white font-black tracking-[0.3em] text-[10px] hover:brightness-110 transition-all uppercase"
              >
                CONFIRM_PERMANENT_DELETION
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 bg-transparent border border-white/10 text-white font-black tracking-[0.3em] text-[10px] hover:bg-white/5 transition-all uppercase"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LiveFeedbackCountReader({ fallback }: { fallback: number }) {
  const markers = useStorage((root) => root.markers);
  return <>{markers ? markers.length : fallback}</>;
}

function LiveVisitorCountReader({ fallback }: { fallback: number }) {
  const others = useOthers();
  // others.length is other people, +1 is for "me" viewing it in the terminal
  // (though in this dashboard modal, it's just showing how many are in the room)
  const count = (others?.length || 0) + 1;
  return <>{count}</>;
}
