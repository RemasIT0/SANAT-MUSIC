import { useState, useEffect, useRef } from "react";

type ExpressionType = 'normal' | 'feliz' | 'pensativo' | 'rockero';

interface MascotProps {
  color: string;
  size?: number;
  expression?: ExpressionType;
}

export default function Mascot({ color, size = 140, expression = 'normal' }: MascotProps) {
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  // Seguimiento ocular (se salta 'feliz' porque tiene los ojos cerrados)
  useEffect(() => {
    if (expression === 'feliz') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!boxRef.current) return;
      const box = boxRef.current.getBoundingClientRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const angle = Math.atan2(dy, dx);
      const distance = Math.min(Math.hypot(dx, dy) / 15, 4);
      setEyeOffset({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [expression]);

  const scale = size / 100;

  // --- RENDERIZADO DE CARA SEGÚN EXPRESIÓN ---
  const renderFace = () => {
    switch (expression) {
      case 'feliz':
        return (
          <>
            {/* Ojos cerrados felices (^ ^) */}
            <div className="flex gap-3 mt-2">
              <div className="w-6 h-3 border-b-[3px] border-black rounded-full bg-transparent" />
              <div className="w-6 h-3 border-b-[3px] border-black rounded-full bg-transparent" />
            </div>
            {/* Sonrisa grande */}
            <div className="w-10 h-5 border-b-[4px] border-black rounded-full bg-transparent mt-1" />
          </>
        );
      
      case 'pensativo':
        return (
          <>
            {/* Cejas: una levantada, otra normal */}
            <div className="flex gap-4 w-full justify-center">
              <div className="w-6 h-1.5 bg-black rounded-sm -rotate-12" />
              <div className="w-6 h-1.5 bg-black rounded-sm rotate-6" />
            </div>
            {/* Ojos con seguimiento ✅ */}
            <div className="flex gap-3 mt-1">
              <div className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-start justify-center overflow-hidden">
                <div className="w-3 h-3 bg-black rounded-sm mt-1" style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }} />
              </div>
              <div className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-start justify-center overflow-hidden">
                <div className="w-3 h-3 bg-black rounded-sm mt-1" style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }} />
              </div>
            </div>
            {/* Boca pequeña "o" */}
            <div className="w-4 h-4 bg-black rounded-full mt-2" />
          </>
        );

      case 'rockero':
        return (
          <>
            {/* Cejas enojadas/determinadas */}
            <div className="flex gap-4 w-full justify-center">
              <div className="w-6 h-1.5 bg-black rounded-sm rotate-12" />
              <div className="w-6 h-1.5 bg-black rounded-sm -rotate-12" />
            </div>
            {/* Ojos grandes con seguimiento ✅ */}
            <div className="flex gap-3 mt-1">
              <div className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-center justify-center overflow-hidden">
                <div className="w-4 h-4 bg-black rounded-sm" style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }} />
              </div>
              <div className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-center justify-center overflow-hidden">
                <div className="w-4 h-4 bg-black rounded-sm" style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }} />
              </div>
            </div>
            {/* Boca abierta gritando/cantando */}
            <div className="w-8 h-6 bg-black rounded-lg mt-2 flex items-end justify-center pb-1">
              <div className="w-6 h-2 bg-white rounded-sm" /> {/* Dientes */}
            </div>
          </>
        );

            case 'normal':
      default:
        return (
          <>
            {/* Cejas neutras (rectas, sin rotación) */}
            <div className="flex gap-4 w-full justify-center mt-1">
              <div className="w-6 h-1.5 bg-black rounded-sm" />
              <div className="w-6 h-1.5 bg-black rounded-sm" />
            </div>
            
            {/* Ojos con seguimiento */}
            <div className="flex gap-3 mt-2">
              <div className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-center justify-center overflow-hidden">
                <div className="w-4 h-4 bg-black rounded-sm" style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }} />
              </div>
              <div className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-center justify-center overflow-hidden">
                <div className="w-4 h-4 bg-black rounded-sm" style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }} />
              </div>
            </div>
            
            {/* Boca abierta con diente (como en la imagen morada) */}
            <div className="w-6 h-4 bg-black rounded-lg mt-3 flex items-end justify-center pb-0.5">
              <div className="w-4 h-2 bg-white rounded-sm" /> {/* Diente visible */}
            </div>
          </>
        );
    }
  };

  return (
    <div className="relative inline-block mascot-wiggle" style={{ width: size, height: size + 20 }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 100, height: 100, position: 'relative' }}>
        
        {/* Sombra de piso */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70px] h-[10px] bg-black/20 rounded-[50%]" style={{ filter: 'blur(3px)' }} />

        {/* Brazos */}
        <div className="absolute top-[60%] -left-4 w-4 h-8 border-[3px] border-black rounded-sm z-0" style={{ backgroundColor: color, boxShadow: "3px 3px 0px 0px #000000", transform: expression === 'rockero' ? "rotate(-20deg)" : "rotate(10deg)" }} />
        <div className="absolute top-[60%] -right-4 w-4 h-8 border-[3px] border-black rounded-sm z-0" style={{ backgroundColor: color, boxShadow: "3px 3px 0px 0px #000000", transform: expression === 'rockero' ? "rotate(20deg)" : "rotate(-10deg)" }} />

        {/* Pies */}
        <div className="absolute -bottom-4 left-3 w-6 h-3 border-[3px] border-black rounded-sm z-0" style={{ backgroundColor: color, boxShadow: "3px 3px 0px 0px #000000" }} />
        <div className="absolute -bottom-4 right-3 w-6 h-3 border-[3px] border-black rounded-sm z-0" style={{ backgroundColor: color, boxShadow: "3px 3px 0px 0px #000000" }} />

        {/* Cara (Cuerpo principal) */}
        <div
          ref={boxRef}
          className="absolute top-0 left-0 w-[100px] h-[100px] border-[4px] border-black rounded-sm flex flex-col items-center justify-center cursor-pointer z-10 transition-transform duration-200 ease-out hover:-translate-y-1"
          style={{ backgroundColor: color, boxShadow: "6px 6px 0px 0px #000000" }}
        >
          {renderFace()}
        </div>
      </div>
    </div>
  );
}