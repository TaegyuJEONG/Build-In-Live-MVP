"use client"

import { Radio, Terminal, Cpu, Plus, Minus, Layers, Grid3x3, BarChart3, Settings, Focus } from "lucide-react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/BottomNav"
import React, { useEffect, useState, useRef } from "react"
import { useStore } from "@/lib/store"

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

// Create a perfect hex grid for 5 rings
const generateHexGrid = (rings: number) => {
  const cubes: any[] = [];
  const logos = Object.keys(CompanyLogos);
  
  // Directions for hex movement (Axial q, r)
  const directions = [
    { q: 1, r: 0 }, { q: 1, r: 1 }, { q: 0, r: 1 }, 
    { q: -1, r: 0 }, { q: -1, r: -1 }, { q: 0, r: -1 }
  ];

  for (let ring = 0; ring <= rings; ring++) {
    if (ring === 0) {
      cubes.push({ q: 0, r: 0, ring: 0 });
    } else {
      let q = ring * directions[4].q; // Start at a specific point for each ring
      let r = ring * directions[4].r;
      
      for (let side = 0; side < 6; side++) {
        for (let step = 0; step < ring; step++) {
          cubes.push({ q, r, ring });
          q += directions[side].q;
          r += directions[side].r;
        }
      }
    }
  }

  let generatedCubes = cubes.map((c, i) => {
    // Coordinate translation: Expanded spacing (100x58)
    const x = 100 * (c.q - c.r);
    const y = 58 * (c.q + c.r);
    
    // Special Overrides based on coordinates
    let type: string | undefined = undefined;
    
    // Fixed central placements
    if (c.q === 0 && c.r === 0) {
      type = "gold";
    } else if (c.q === 0 && c.r === -1) {
      type = "!";
    } else if (c.q === -1 && c.r === 0) {
      type = "?";
    } else {
      // Spread additional ? and ! randomly across the board (approx 4% chance)
      const specialHash = Math.abs(Math.sin(c.q * 89.123 + c.r * 11.456)) * 10000;
      const specialRandom = specialHash % 100; // 0 to 99.99
      
      if (specialRandom < 2) type = "!";
      else if (specialRandom < 4) type = "?";
    }
    
    // Pseudo-random noise [0..1) based on hex coordinates
    const noise = Math.abs(Math.sin(c.q * 12.9898 + c.r * 78.233)) % 1;
    
    // Weight the probability so center ranges have higher activity
    const centerWeight = Math.max(0, 1 - (c.ring / 12)); 
    
    // activityScore combines distance from center (40%) and randomness (60%)
    const activityScore = (centerWeight * 0.4) + (noise * 0.6);

    let visitors = 0;
    if (activityScore > 0.85) visitors = 100;
    else if (activityScore > 0.70) visitors = 80;
    else if (activityScore > 0.55) visitors = 60;
    else if (activityScore > 0.40) visitors = 40;
    else if (activityScore > 0.25) visitors = 20;
    else visitors = 0;

    // Preserve special marker high counts
    if (type === "gold") visitors = 150;
    if (type === "?" || type === "!") visitors = 95;

    // Coordinate-based pseudo-random hash for logo assignment
    // Gives a completely random look without using Math.random() directly
    const logoHash = Math.abs(Math.sin(c.q * 53.123 + c.r * 12.345)) * 10000;
    const logoIdx = Math.floor(logoHash) % logos.length;
    const logo = type ? undefined : logos[logoIdx];

    return {
      x,
      y,
      ring: c.ring,
      delay: c.ring * 0.5 + (i % 10) * 0.2,
      type,
      visitors,
      logo
    };
  });

  return generatedCubes;
};

const cubePositions = generateHexGrid(10);


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

interface CubeProps {
  x: number
  y: number
  ring: number
  delay: number
  type?: string
  logo?: string
  visitors?: number
  onClick?: () => void
}

function Cube({ x, y, ring, delay, type, logo, visitors = 0, onClick }: CubeProps) {
  const isSpecial = type === "?" || type === "!"
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
        animation: `drift 12s infinite ease-in-out`,
        animationDelay: `${delay}s`,
        ["--tx" as string]: `${x}px`,
        ["--ty" as string]: `${y}px`,
        ["--scale" as string]: 1,
      }}
    >
      {/* Interactive Hover Wrapper */}
      <div 
        className="absolute w-full h-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.05] hover:z-50"
        style={{ transformStyle: "preserve-3d" }}
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
          {isSpecial && <Symbol3D symbol={type!} />}
          {/* Top Face */}
          <div
            className="hover:bg-white/90 transition-colors"
            style={{
              position: "absolute",
              width: cubeSize,
              height: cubeSize,
              background: isGold ? "#FFD700" : isWhite ? "#ffffff" : "#cccccc",
              transform: `translateZ(${halfSize}px)`,
              border: "0.5px solid rgba(255,255,255,0.1)",
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
              border: "0.5px solid rgba(255,255,255,0.05)",
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
              border: "0.5px solid rgba(255,255,255,0.05)",
              backfaceVisibility: "hidden",
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function BuildInLive() {
  const router = useRouter();
  const { connect, setProject } = useStore();

  const [pan, setPan] = useState({ x: 0, y: 0 });
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

  useEffect(() => {
    connect();
    setProject('home');
  }, []);

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
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-transparent">
        <div className="text-lg font-black tracking-tighter text-white/80 uppercase">
          BUILD_IN_LIVE
        </div>
        <div className="flex gap-2">
          <button className="hover:bg-white/5 p-2 transition-colors">
            <Grid3x3 className="w-[18px] h-[18px] text-white/40" />
          </button>
          <button className="hover:bg-white/5 p-2 transition-colors">
            <BarChart3 className="w-[18px] h-[18px] text-white/40" />
          </button>
          <button className="hover:bg-white/5 p-2 transition-colors">
            <Settings className="w-[18px] h-[18px] text-white/40" />
          </button>
        </div>
      </header>

      {/* Lateral Spatial Controls */}
      <aside className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-0 z-50 p-0 bg-transparent">
        <div className="px-2 py-4 mb-4 border-l border-white/20">
          <div className="text-[8px] tracking-[0.3em] uppercase text-white/30 mb-1">COORDINATES</div>
          <div className="text-[10px] tracking-widest uppercase text-white">0.0.0_INF</div>
        </div>
        <button className="flex flex-col items-center justify-center w-12 h-12 hover:bg-white/5 text-white/30 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
        <button className="flex flex-col items-center justify-center w-12 h-12 hover:bg-white/5 text-white/30 transition-colors">
          <Minus className="w-4 h-4" />
        </button>
        <button 
          className="flex flex-col items-center justify-center w-12 h-12 bg-white text-black hover:bg-white/80 transition-colors cursor-pointer"
          onClick={() => setPan({ x: 0, y: 0 })}
        >
          <Focus className="w-4 h-4" />
        </button>
        <button className="flex flex-col items-center justify-center w-12 h-12 hover:bg-white/5 text-white/30 transition-colors">
          <Layers className="w-4 h-4" />
        </button>
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
      >
        <div 
          className="relative flex items-center justify-center leading-none"
          style={{ 
            width: 1200, 
            height: 1200, 
            transformStyle: "preserve-3d",
            transform: `translate(${pan.x}px, ${pan.y}px)`
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

          {cubePositions.map((cube, i) => (
            <Cube
              key={i}
              x={cube.x}
              y={cube.y}
              ring={cube.ring}
              delay={cube.delay}
              type={cube.type}
              logo={cube.logo}
              visitors={cube.visitors}
              onClick={() => {
                if (cube.logo) {
                  router.push(`/project/${cube.logo}`);
                } else if (cube.type) {
                  router.push(`/project/${cube.type}`);
                } else {
                  router.push(`/project/center`);
                }
              }}
            />
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />



      {/* Node Analysis Overlay */}
      <div className="fixed top-32 right-12 w-48 p-0 bg-transparent pointer-events-none">
        <div className="font-bold text-[8px] tracking-[0.4em] text-white/20 mb-6 uppercase border-b border-white/10 pb-2">
          LIVE_ANALYSIS
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <span className="text-[8px] text-white/30 uppercase tracking-widest">Builders</span>
            <span className="text-[10px] text-[#F95A56] font-mono font-bold">14ms</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[8px] text-white/30 uppercase tracking-widest">Studios</span>
            <span className="text-[10px] text-white/60 font-mono">30_ACT</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[8px] text-white/30 uppercase tracking-widest">Events</span>
            <span className="text-[10px] text-white/60 font-mono">42.8%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
