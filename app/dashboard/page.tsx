"use client"

import { Radio, Terminal, Cpu, Plus, Minus, Layers, SquarePlus, BarChart3, Settings, Focus, AlertTriangle, Trash2, PenSquare, Hand, X, Upload, Loader2, Image as ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/BottomNav"
import React, { useEffect, useState, useRef, useMemo } from "react"
import { useStore } from "@/lib/store"
import { RoomProvider, useStorage, useOthers } from "@/liveblocks.config"
import { ClientSideSuspense } from "@liveblocks/react"
import { LiveList, LiveMap } from "@liveblocks/client"
import { storage, db as firestoreDb } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

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


function LogoImage({ logo }: { logo: string }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) return null;

  return (
    <div 
      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white/5 border border-white/10 transition-all duration-500"
      style={{ transform: "rotateZ(90deg)" }}
    >
      {logo.startsWith('http') || logo.startsWith('/') ? (
        <img 
          src={logo} 
          alt="Project Logo" 
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        CompanyLogos[logo] && (
          <div
            style={{
              color: logoColors[logo] || "#ffffff",
              scale: "0.7"
            }}
          >
            {CompanyLogos[logo]}
          </div>
        )
      )}
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
  hasReport?: boolean
}

function Cube({ x, y, ring, delay, type, logo, visitors = 0, isHidden = false, onClick, isCommitting = false, commitDelay = 0, commitColor = "white", isHeartActive = false, heartDelay = 0, hasIssue = false, isOwner = false, hasReport = false }: CubeProps) {
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
              
          {/* Exclamation mark for reported issues - no circle, stands upright above cube's top-left edge */}
          {hasReport && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-[250%] -translate-y-[200%] z-[1000] animate-bounce pointer-events-none select-none font-black italic text-[24px] md:text-[32px] text-[#F95A56]"
              style={{ 
                textShadow: "0 0 15px rgba(249,90,86,0.8), 0 0 5px rgba(249,90,86,1)",
                lineHeight: 1
              }}
            >
              !
            </div>
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
            {logo && (
              <LogoImage logo={logo} />
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
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedOwnerName, setSelectedOwnerName] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [reAuthNeeded, setReAuthNeeded] = useState(false);

  useEffect(() => {
    if (selectedCube?.id) {
      const p = projects.find(proj => proj.id === selectedCube.id);
      if (p) {
        const fetchOwner = async () => {
          try {
            const { doc, getDoc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            if (db) {
              const docSnap = await getDoc(doc(db, "users", p.ownerId));
              if (docSnap.exists()) {
                setSelectedOwnerName(docSnap.data().displayName || "User");
              } else {
                setSelectedOwnerName("User");
              }
            }
          } catch (e) {
            console.error("Error fetching owner name:", e);
            setSelectedOwnerName("User");
          }
        };
        fetchOwner();
      }
    } else {
      setSelectedOwnerName(null);
    }
  }, [selectedCube?.id, projects]);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showProjectDeleteConfirm, setShowProjectDeleteConfirm] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedData, setEditedData] = useState({ 
    name: '', 
    url: '', 
    description: '',
    tagline: '',
    logoUrl: '',
    screenshots: '',
    categories: '',
    techStacks: '',
    demoVideo: ''
  });
  const { deleteProject, updateProject, addProject } = useStore();
  
  // New Project Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setLogoFile(null);
    setLogoPreview(null);
    setScreenshotFiles([]);
    setScreenshotPreviews([]);
    setEditingProject(null);
  };

  React.useEffect(() => {
    setMounted(true)
    init();
    setProject('home');
  }, []);

  React.useEffect(() => {
    if (firebaseUser && firestoreDb) {
      const syncUser = async () => {
        try {
          const { getDoc } = await import("firebase/firestore");
          const userRef = doc(firestoreDb!, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserName(userSnap.data().displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User");
          }

          await setDoc(userRef, {
            email: firebaseUser.email
          }, { merge: true });
        } catch (e) {
          console.error("Error syncing user data:", e);
        }
      };
      syncUser();
    }
  }, [firebaseUser]);

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
      
      const isOwner = firebaseUser?.uid === p.ownerId;
      const isAdmin = firebaseUser?.email === 'taegyujeong@gmail.com';
      const canSeeIssue = isOwner || isAdmin;
      
      cubes.push({
        id: p.id,
        x,
        y,
        q: pos.q,
        r: pos.r,
        ring: Math.max(Math.abs(pos.q), Math.abs(pos.r), Math.abs(pos.q + pos.r)),
        delay: (i + 1) * 0.1,
        // Show '?' only if verified and no issue OR if issue is hidden from current user
        type: (p.isVerified && (!p.hasIssue || !canSeeIssue)) ? '?' : null,
        logo: p.logoUrl,
        visitors: p.feedbackCount * 10, // Mocked visitor intensity based on feedback
        isAutoCommitting: true,
        isHeartActive: true,
        commitDelay: Math.random() * 5,
        heartDelay: Math.random() * 10,
        projectData: p,
        hasIssue: p.hasIssue && canSeeIssue,
        isOwner: isOwner,
        hasReport: !p.isVerified && p.hasIssue && canSeeIssue,
        isVerified: p.isVerified
      });
    });

    return cubes;
  }, [projects, firebaseUser?.uid]);
  
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
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
      hasIssue: cube.hasIssue,
      issueMemo: cube.hasIssue ? p.issueMemo : null,
      description: p.description,
      isOwner: cube.isOwner,
      isVerified: cube.isVerified,
      ownerId: p.ownerId
    };
  };

  const handleProjectDelete = async () => {
    if (!selectedCube?.id) return;
    try {
      await deleteProject(selectedCube.id);
      setSelectedCube(null);
      setShowProjectDeleteConfirm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProjectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCube?.id) return;
    try {
      const dataToUpdate = {
        ...editedData,
        screenshots: editedData.screenshots.split(',').map(s => s.trim()).filter(Boolean),
        categories: editedData.categories.split(',').map(s => s.trim()).filter(Boolean),
        techStacks: editedData.techStacks.split(',').map(s => s.trim()).filter(Boolean),
      };
      await updateProject(selectedCube.id, dataToUpdate);
      setIsEditingProject(false);
      // Update selectedCube local data for immediate feedback if needed, 
      // but the real-time project listener in store will update the grid and panel.
      setSelectedCube({ ...selectedCube, projectData: { ...selectedCube.projectData, ...dataToUpdate } });
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted) return null;

  return (
    <RoomProvider 
      id="dashboard" 
      initialPresence={{ cursor: null, name: "Anonymous", color: "#F95A56", pathname: "" }}
      initialStorage={{ markers: new LiveList([]), comments: new LiveMap() }}
    >
      <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a]" style={{ fontFamily: "Inter, sans-serif" }}>
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
          <button 
            className="hover:bg-white/5 p-2 transition-colors"
            onClick={() => setIsAddModalOpen(true)}
          >
            <SquarePlus className="w-[18px] h-[18px] text-white/40" />
          </button>
          <button 
            className="p-2 transition-all hover:bg-white/5"
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            <BarChart3 className={`w-[18px] h-[18px] transition-opacity ${showAnalysis ? 'text-white/40' : 'text-white/10'}`} />
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
                className="absolute right-0 mt-2 w-56 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200"
                onMouseLeave={() => setIsSettingsOpen(false)}
              >
                <div className="p-1">
                  <div className="px-4 py-3 border-b border-white/5 mb-1 bg-white/[0.02]">
                    <div className="text-[7px] tracking-[0.4em] text-white/20 uppercase mb-2 font-bold">USER_IDENTITY</div>
                    <div className="text-[11px] font-black text-white tracking-tight leading-none mb-1 uppercase">
                      {userName || "..."}
                    </div>
                    <div className="text-[9px] tracking-wider text-white/40 lowercase truncate" title={firebaseUser?.email || ''}>
                      {firebaseUser?.email}
                    </div>
                  </div>

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
      <aside className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-0 z-50 p-0 bg-transparent scale-90 md:scale-100 origin-left">
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
        {/* Temporarily hidden Layer Toggle */}
        {false && (
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
        )}
      </aside>

      {/* Main Spatial Canvas */}
      <main 
        className="w-screen h-screen overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none" 
        style={{ 
          perspective: 1200,
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 15%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 85%)'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
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
                hasReport={cube.hasReport}
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
            className="fixed left-4 right-4 md:left-auto md:right-12 top-1/2 -translate-y-1/2 z-[100] w-auto md:w-[340px] bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-8 duration-300 pointer-events-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-white/10 bg-white/5">
              <div className="text-[10px] font-black tracking-[0.2em] text-white">
                STATUS // {data.name}
              </div>
              <div className="flex items-center gap-1">
                {data.isOwner && !isEditingProject && (
                  <>
                    <button 
                      className="text-white/30 hover:text-[#F95A56] transition-colors p-2 cursor-pointer"
                      onClick={() => setShowProjectDeleteConfirm(true)}
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3 bg-white/10 mx-1" />
                  </>
                )}
                <button 
                  className="text-white/50 hover:text-white transition-colors p-2 cursor-pointer"
                  onClick={() => {
                    setSelectedCube(null);
                    setIsEditingProject(false);
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-y-auto max-h-[70vh] custom-scrollbar text-[10px] md:text-[11px]">
              {isEditingProject ? (
                <form onSubmit={handleProjectUpdate} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <label className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase block">Project Name</label>
                    <input
                      required
                      className="w-full bg-transparent border-b border-white/20 py-1.5 md:py-2 text-white text-[11px] md:text-xs focus:border-white focus:outline-none transition-colors"
                      value={editedData.name}
                      onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase block">URL</label>
                    <input
                      required
                      className="w-full bg-transparent border-b border-white/20 py-1.5 md:py-2 text-white text-[11px] md:text-xs focus:border-white focus:outline-none transition-colors"
                      value={editedData.url}
                      onChange={(e) => setEditedData({ ...editedData, url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase block">Description</label>
                    <textarea
                      className="w-full bg-transparent border border-white/20 p-2 text-white text-[11px] md:text-xs focus:border-white focus:outline-none transition-colors min-h-[60px] resize-none"
                      value={editedData.description}
                      onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase block">Tagline</label>
                    <input
                      className="w-full bg-transparent border-b border-white/20 py-1.5 text-white text-[11px] md:text-xs focus:border-white focus:outline-none transition-colors"
                      value={editedData.tagline}
                      onChange={(e) => setEditedData({ ...editedData, tagline: e.target.value })}
                      placeholder="e.g. Unbound your potential."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase block">Logo URL</label>
                    <input
                      className="w-full bg-transparent border-b border-white/20 py-1.5 text-white text-[11px] md:text-xs focus:border-white focus:outline-none transition-colors"
                      value={editedData.logoUrl}
                      onChange={(e) => setEditedData({ ...editedData, logoUrl: e.target.value })}
                      placeholder="https://.../logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase block">Screenshots (comma separated)</label>
                    <textarea
                      className="w-full bg-transparent border border-white/20 p-2 text-white text-[11px] md:text-xs focus:border-white focus:outline-none transition-colors min-h-[60px] resize-none"
                      value={editedData.screenshots}
                      onChange={(e) => setEditedData({ ...editedData, screenshots: e.target.value })}
                      placeholder="url1, url2, url3"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase block">Categories</label>
                      <input
                        className="w-full bg-transparent border-b border-white/20 py-1.5 text-white text-[11px] md:text-xs focus:border-white focus:outline-none transition-colors"
                        value={editedData.categories}
                        onChange={(e) => setEditedData({ ...editedData, categories: e.target.value })}
                        placeholder="SaaS, AI"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase block">Tech Stacks</label>
                      <input
                        className="w-full bg-transparent border-b border-white/20 py-1.5 text-white text-[11px] md:text-xs focus:border-white focus:outline-none transition-colors"
                        value={editedData.techStacks}
                        onChange={(e) => setEditedData({ ...editedData, techStacks: e.target.value })}
                        placeholder="Next.js, Firebase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase block">Demo Video URL (YouTube/Embed)</label>
                    <input
                      className="w-full bg-transparent border-b border-white/20 py-1.5 text-white text-[11px] md:text-xs focus:border-white focus:outline-none transition-colors"
                      value={editedData.demoVideo}
                      onChange={(e) => setEditedData({ ...editedData, demoVideo: e.target.value })}
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 md:py-3 bg-white text-black font-black tracking-[0.2em] text-[8px] md:text-[9px] hover:bg-white/90 transition-colors uppercase cursor-pointer"
                    >
                      SAVE_CHANGES
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProject(false)}
                      className="flex-1 py-2.5 md:py-3 bg-transparent border border-white/10 text-white font-black tracking-[0.2em] text-[8px] md:text-[9px] hover:bg-white/5 transition-colors uppercase cursor-pointer"
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Owner */}
                  <div>
                    <div className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase mb-2 md:mb-3">Desk Owner</div>
                    <div className="text-[11px] md:text-xs font-black text-white tracking-widest uppercase">
                      {selectedOwnerName || "User"}
                    </div>
                  </div>

                  {/* Description */}
                  {data.description && (
                    <div>
                      <div className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase mb-2 md:mb-3">Project Description</div>
                      <div className="text-[10px] md:text-[11px] leading-relaxed text-white/80 opacity-90">
                        {data.description}
                      </div>
                    </div>
                  )}

                  {/* URL */}
                  <div>
                    <div className="text-[8px] md:text-[9px] text-white/40 tracking-[0.3em] uppercase mb-2 md:mb-3">Live Environment</div>
                    <div className="text-[10px] md:text-[11px] text-white/80 font-mono break-all bg-white/5 p-2 border border-white/10">
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
                      <div className="flex flex-col gap-0.5 md:gap-1 p-2 md:p-3 bg-[#0a0a0a]/90 backdrop-blur-md">
                        <div className="text-[7px] md:text-[8px] text-white/40 tracking-[0.15em] uppercase mb-0.5 md:mb-1">Feedback Count</div>
                        <div className="text-lg md:text-xl font-mono text-white flex items-center gap-1.5 md:gap-2">
                          <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <ClientSideSuspense fallback={<>{data.feedbacks}</>}>
                            {() => <LiveFeedbackCountReader fallback={data.feedbacks} />}
                          </ClientSideSuspense>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 md:gap-1 p-2 md:p-3 bg-[#0a0a0a]/90 backdrop-blur-md">
                        <div className="text-[7px] md:text-[8px] text-white/40 tracking-[0.15em] uppercase mb-0.5 md:mb-1">Viewing</div>
                        <div className="text-lg md:text-xl font-mono text-white/90 px-1 flex items-center gap-1.5 md:gap-2">
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
                      <div className="text-[8px] md:text-[9px] text-[#F95A56] tracking-[0.3em] uppercase mb-2 md:mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-2.5 md:w-3 h-2.5 md:h-3" />
                        Reported Issue
                      </div>
                      <div className="text-[10px] md:text-[11px] text-white/80 bg-[#1a0f0f] border border-[#F95A56]/30 p-3 md:p-4 leading-relaxed relative">
                        {data.issueMemo}
                        <div className="absolute top-0 right-0 w-1.5 md:w-2 h-1.5 md:h-2 bg-[#F95A56] rounded-bl" />
                      </div>
                    </div>
                  )}

                  {/* Call to Action */}
                  <button 
                    className="w-full py-3 md:py-4 mt-1 md:mt-2 font-black tracking-[0.2em] md:tracking-[0.3em] text-[8px] md:text-[10px] transition-all uppercase border-none cursor-pointer bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                    onClick={() => {
                      // Save for BottomNav
                      localStorage.setItem('lastVisitedDeskId', data.id);
                      localStorage.setItem('lastVisitedDeskOwnerId', data.ownerId);
                      localStorage.setItem('lastVisitedDeskOwnerName', selectedOwnerName || "User");
                      
                      router.push(`/desk/${data.ownerId}?projectId=${data.id}`);
                    }}
                  >
                    {`ENTER_${data.name}_DESK`}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Bottom Navigation */}
      <BottomNav />



      {/* Node Analysis Overlay */}
      {showAnalysis && (
        <div className="fixed top-16 md:top-32 right-4 md:right-12 w-32 md:w-48 p-0 bg-transparent pointer-events-none">
          <div className="font-bold text-[8px] tracking-[0.4em] text-white/20 mb-2 md:mb-6 uppercase border-b border-white/10 pb-2">
            LIVE_ANALYSIS
          </div>
          <div className="space-y-2 md:space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-[8px] text-white/30 uppercase tracking-widest">Studio Viewing</span>
              <span className="text-[10px] text-[#F95A56] font-mono font-bold">
                <ClientSideSuspense fallback={<>{(users?.length || 0) + 1}</>}>
                  {() => <LiveVisitorCountReader fallback={(users?.length || 0) + 1} />}
                </ClientSideSuspense>
              </span>
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
      )}
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
                {reAuthNeeded 
                  ? "For security, please verify your identity to proceed with account deletion."
                  : "Are you sure you want to delete your account? All projects and data will be permanently removed. This action cannot be undone."}
              </p>
            </div>
            
            <div className="space-y-4">
              {reAuthNeeded ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-white/30 block ml-1">Current Password</label>
                    <input 
                      type="password"
                      placeholder="ENTER_PASSWORD"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        setIsDeleting(true);
                        setDeleteError(null);
                        const { auth, db } = await import("@/lib/firebase");
                        const { EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
                        const user = auth?.currentUser;
                        if (!user || !db) throw new Error("Authentication failed");

                        // Try Email Re-auth if password provided
                        if (deletePassword) {
                          const credential = EmailAuthProvider.credential(user.email!, deletePassword);
                          await reauthenticateWithCredential(user, credential);
                        } else {
                          // Try Google Re-auth
                          const provider = new GoogleAuthProvider();
                          await signInWithPopup(auth, provider);
                        }
                        
                        setReAuthNeeded(false);
                        setDeletePassword("");
                        // Trigger deletion again
                        document.getElementById('confirm-delete-btn')?.click();
                      } catch (err: any) {
                        console.error("Re-auth failed:", err);
                        setDeleteError(err.message || "Verification failed. Please check your password.");
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className={`w-full py-4 bg-white text-black font-black tracking-[0.3em] text-[10px] transition-all uppercase ${isDeleting ? 'opacity-50 cursor-wait' : 'hover:bg-white/90'}`}
                    disabled={isDeleting || (!deletePassword && !firebaseUser?.providerData.some(p => p.providerId === 'google.com'))}
                  >
                    {isDeleting ? 'VERIFYING...' : 'VERIFY_IDENTITY'}
                  </button>
                  {firebaseUser?.providerData.some(p => p.providerId === 'google.com') && !deletePassword && (
                    <p className="text-[9px] text-white/30 text-center uppercase tracking-widest italic">
                      Click verify to re-authenticate with Google
                    </p>
                  )}
                </div>
              ) : (
                <button 
                  id="confirm-delete-btn"
                  onClick={async () => {
                    try {
                      setIsDeleting(true);
                      setDeleteError(null);
                      const { auth, db } = await import("@/lib/firebase");
                      const user = auth?.currentUser;
                      
                      if (!user || !db) throw new Error("Authentication failed");

                      try {
                        const { doc, collection, query, where, getDocs, writeBatch } = await import("firebase/firestore");
                        
                        // 1. Cleanup Firestore first
                        const projectsRef = collection(db, "projects");
                        const q = query(projectsRef, where("ownerId", "==", user.uid));
                        const projectSnapshots = await getDocs(q);
                        
                        const batch = writeBatch(db);
                        projectSnapshots.forEach((pDoc) => {
                          batch.delete(pDoc.ref);
                        });
                        
                        batch.delete(doc(db, "users", user.uid));
                        await batch.commit();

                        // 2. Delete Auth account
                        await user.delete();
                        router.push("/auth");
                      } catch (authError: any) {
                        if (authError.code === 'auth/requires-recent-login') {
                          setReAuthNeeded(true);
                          setIsDeleting(false);
                          setDeleteError(null);
                        } else {
                          throw authError;
                        }
                      }
                    } catch (error: any) {
                      console.error("Deletion failed:", error);
                      setDeleteError(error.message || "Deletion failed. Please try again.");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className={`w-full py-4 bg-[#F95A56] text-white font-black tracking-[0.3em] text-[10px] transition-all uppercase ${isDeleting ? 'opacity-50 cursor-wait' : 'hover:brightness-110'}`}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'PROCESSING...' : 'CONFIRM_PERMANENT_DELETION'}
                </button>
              )}
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                className="w-full py-4 bg-transparent border border-white/10 text-white font-black tracking-[0.3em] text-[10px] hover:bg-white/5 transition-all uppercase"
              >
                CANCEL
              </button>
              
              {deleteError && (
                <div className="mt-4 p-4 bg-[#F95A56]/10 border border-[#F95A56]/30 text-[#F95A56] text-[10px] font-bold uppercase tracking-wider text-center">
                  {deleteError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Delete Confirmation Modal */}
      {showProjectDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-[#F95A56]/30 shadow-2xl p-8 space-y-6">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-[#F95A56]/10 border border-[#F95A56]/30 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#F95A56]" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">DELETE_PROJECT</h2>
              <p className="text-[11px] text-white/50 leading-relaxed uppercase tracking-wider">
                Are you sure you want to delete this project?<br/>
                All feedback and markers will be permanently removed.
              </p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleProjectDelete}
                className="w-full py-4 bg-[#F95A56] text-white font-black tracking-[0.3em] text-[10px] hover:brightness-110 transition-all uppercase"
              >
                CONFIRM_DELETE
              </button>
              <button 
                onClick={() => setShowProjectDeleteConfirm(false)}
                className="w-full py-4 bg-transparent border border-white/10 text-white font-black tracking-[0.3em] text-[10px] hover:bg-white/5 transition-all uppercase"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleCloseModal} />
          <div className="relative w-full max-w-4xl bg-[#0e0e0e] border border-white/10 shadow-2xl flex flex-col font-mono text-white">
             {/* Header */}
             <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                <div className="text-xs font-black tracking-[0.3em] uppercase">
                  {editingProject ? `Edit_Project // ${editingProject.name}` : "Add_New_Project"}
                </div>
                <div className="flex items-center gap-6">
                   {editingProject && (
                      <button 
                         type="button" 
                         onClick={async () => {
                           if (confirm(`Are you sure you want to delete ${editingProject.name}?`)) {
                             await useStore.getState().deleteProject(editingProject.id);
                             handleCloseModal();
                           }
                         }} 
                         className="flex items-center gap-2 text-[#F95A56]/60 hover:text-[#F95A56] text-[9px] font-black uppercase tracking-widest transition-colors group/del"
                      >
                         <Trash2 className="w-3.5 h-3.5 group-hover/del:scale-110 transition-transform" />
                         <span className="hidden sm:inline">Delete_Project</span>
                      </button>
                   )}
                   <button onClick={handleCloseModal} className="hover:text-[#F95A56] transition-colors"><X className="w-5 h-5"/></button>
                </div>
             </div>

             {/* Form Content */}
             <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                const formData = new FormData(e.currentTarget);
                
                try {
                  const uid = firebaseUser?.uid;
                  if (!uid) return;

                  // 1. Upload Logo if exists
                  let logoUrl = editingProject?.logoUrl || "";
                  if (logoFile && storage) {
                    const logoRef = ref(storage, `projects/${uid}/${Date.now()}_logo_${logoFile.name}`);
                    const uploadResult = await uploadBytes(logoRef, logoFile);
                    logoUrl = await getDownloadURL(uploadResult.ref);
                  }

                  // 2. Upload Screenshots
                  const uploadedScreenshotUrls: string[] = [];
                  if (screenshotFiles.length > 0 && storage) {
                    for (const file of screenshotFiles) {
                      const ssRef = ref(storage, `projects/${uid}/${Date.now()}_ss_${file.name}`);
                      const uploadResult = await uploadBytes(ssRef, file);
                      const url = await getDownloadURL(uploadResult.ref);
                      uploadedScreenshotUrls.push(url);
                    }
                  }

                  // 3. Combine and validate
                  const finalScreenshots = [
                    ...(editingProject ? editingProject.screenshots.filter((s: string) => screenshotPreviews.includes(s)) : []),
                    ...uploadedScreenshotUrls
                  ];

                  const projectData = {
                    name: formData.get('name') as string,
                    url: formData.get('url') as string,
                    logoUrl: logoUrl,
                    screenshots: finalScreenshots,
                    demoVideo: formData.get('demoVideo') as string || "",
                    about: formData.get('about') as string || "",
                    categories: (formData.get('categories') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                    useCases: (formData.get('useCases') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                    targetAudience: (formData.get('targetAudience') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                    platforms: (formData.get('platforms') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                    techStacks: (formData.get('techStacks') as string || "").split(',').map(s => s.trim()).filter(Boolean),
                  };

                  if (editingProject) {
                    await useStore.getState().updateProject(editingProject.id, projectData as any);
                  } else {
                    await addProject(projectData as any);
                  }
                  
                  handleCloseModal();
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsSubmitting(false);
                }
             }} className="p-8 flex flex-col gap-16 overflow-y-auto max-h-[75vh] custom-scrollbar">
                
                {/* Left Monitor Config (Main Screen) */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center gap-4">
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                      <div className="text-[11px] font-black text-[#F95A56] tracking-[0.4em] uppercase opacity-70">
                         Step_01 // Left_Monitor_Config
                      </div>
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                   </div>

                   <div className="flex flex-col gap-10 max-w-2xl mx-auto w-full">
                      <div className="space-y-8">
                        {/* Logo Upload */}
                        <div className="space-y-4">
                          <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30 border-l-2 border-[#F95A56]/50 pl-2">Project_Identity</label>
                          <div className="flex flex-col items-center">
                             <label className="group/logo relative cursor-pointer">
                                <div className="w-40 h-40 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group/logo shadow-2xl backdrop-blur-xl">
                                    {logoPreview ? (
                                       <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                       <div className="flex flex-col items-center gap-3 opacity-30 group-hover/logo:opacity-100 transition-opacity">
                                          <ImageIcon className="w-10 h-10" />
                                          <span className="text-[8px] font-black tracking-widest text-[#F95A56]">UPLOAD_LOGO</span>
                                       </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                                       <Upload className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#F95A56] flex items-center justify-center shadow-lg border-2 border-black group-hover/logo:scale-110 transition-transform">
                                   <Plus className="w-4 h-4 text-white" />
                                </div>
                                <input name="logo" type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setLogoFile(file);
                                    setLogoPreview(URL.createObjectURL(file));
                                  }
                                }} />
                             </label>
                             <div className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                                {logoFile ? logoFile.name : "Square_Ratio_Preferred"}
                             </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-widest text-white/40">Project Name *</label>
                            <input name="name" required defaultValue={editingProject?.name} className="w-full bg-white/5 border-b border-white/20 p-2 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="MY_COOL_UI" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-widest text-white/40">Deployment URL *</label>
                            <input name="url" required defaultValue={editingProject?.url} className="w-full bg-white/5 border-b border-white/20 p-2 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="https://..." />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-white/40">Demo Video (Youtube Embed URL)</label>
                          <input name="demoVideo" defaultValue={editingProject?.demoVideo} className="w-full bg-white/5 border-b border-white/20 p-2 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="https://www.youtube.com/embed/..." />
                        </div>

                        {/* Multiple Screenshot Upload */}
                        <div className="space-y-4">
                          <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30 border-l-2 border-[#F95A56]/50 pl-2">Screenshots_Gallery</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                             {screenshotPreviews.map((pre, i) => (
                               <div key={i} className="aspect-video rounded bg-black/40 border border-white/10 overflow-hidden relative group shadow-lg">
                                  <img src={pre} className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => {
                                      setScreenshotFiles(prev => prev.filter((_, idx) => idx !== i));
                                      setScreenshotPreviews(prev => prev.filter((_, idx) => idx !== i));
                                  }} className="absolute inset-0 bg-[#F95A56]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <X className="w-5 h-5 text-white" />
                                  </button>
                               </div>
                             ))}
                          </div>
                          <label>
                            <div className="w-full py-12 border-2 border-dashed border-white/10 hover:border-[#F95A56]/30 hover:bg-[#F95A56]/5 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl group/ss">
                               <Upload className="w-8 h-8 text-white/10 group-hover/ss:text-[#F95A56]/40 group-hover/ss:scale-110 transition-all" />
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover/ss:text-white/40">Deploy_Multiple_Screenshots_</span>
                            </div>
                            <input name="screenshots" type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setScreenshotFiles(prev => [...prev, ...files]);
                                const newPreviews = files.map(f => URL.createObjectURL(f));
                                setScreenshotPreviews(prev => [...prev, ...newPreviews]);
                            }} />
                          </label>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Right Monitor Config (Secondary Screen) */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <div className="flex items-center gap-4">
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                      <div className="text-[11px] font-black text-[#F95A56] tracking-[0.4em] uppercase opacity-70">
                         Step_02 // Right_Monitor_Config
                      </div>
                      <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#F95A56]/20 to-transparent"></div>
                   </div>

                   <div className="flex flex-col gap-10 max-w-2xl mx-auto w-full">
                      <div className="space-y-10">
                        {/* Executive Summary */}
                        <div className="space-y-4">
                          <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30 border-l-2 border-[#F95A56]/50 pl-2">Executive_Summary</label>
                          <textarea name="about" defaultValue={editingProject?.about} className="w-full bg-white/5 border border-white/10 p-5 text-sm focus:border-[#F95A56] outline-none transition-all h-36 resize-none rounded-xl leading-relaxed shadow-inner" placeholder="Tell us more about this project... It will appear on the secondary monitor." />
                        </div>
                        
                        {/* Detailed Specs */}
                        <div className="space-y-8">
                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Use Cases</label>
                              <input name="useCases" defaultValue={editingProject?.useCases?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Internal monitoring, Feedback collection" />
                           </div>
                           
                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Target Audience</label>
                              <input name="targetAudience" defaultValue={editingProject?.targetAudience?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Developers, PMs, Stakeholders" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Categories</label>
                              <input name="categories" defaultValue={editingProject?.categories?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="SaaS, AI, Productivity" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Tech Stacks</label>
                              <input name="techStacks" defaultValue={editingProject?.techStacks?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Next.js, Tailwind, Firebase" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] uppercase tracking-widest text-white/40">Platforms</label>
                              <input name="platforms" defaultValue={editingProject?.platforms?.join(', ')} className="w-full bg-white/5 border-b border-white/20 p-3 text-sm focus:border-[#F95A56] outline-none transition-all placeholder:text-white/10" placeholder="Web, Mobile, Desktop" />
                           </div>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="pt-12 border-t border-white/10 flex justify-between gap-6 pb-6 max-w-2xl mx-auto w-full">
                   <button type="button" onClick={handleCloseModal} className="px-10 py-4 text-[10px] uppercase tracking-widest hover:text-white/60 transition-colors font-black">Close_Portal</button>
                   <button disabled={isSubmitting} type="submit" className="px-16 py-4 bg-[#F95A56] hover:brightness-110 text-white font-black text-[12px] uppercase tracking-[0.3em] transition-all disabled:opacity-50 flex items-center gap-3 shadow-[0_15px_40px_rgba(249,90,86,0.3)] rounded-sm">
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                      {isSubmitting ? 'Syncing_Data...' : editingProject ? 'Update_Provisioning →' : 'Provision_Showcase →'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
    </RoomProvider>
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
  const count = (others?.length || 0);
  return <>{count}</>;
}
