// src/components/Mascot.tsx
import { useState, useEffect, useRef } from "react";
import { MascotHair, MascotClothing, MascotFaceAccessories, type MascotStyleType } from './MascotStyles';

interface MascotProps {
  color: string;
  size?: number;
  style?: MascotStyleType; // Nuevo prop para el estilo
}

export default function Mascot({ color, size = 140, style = 'clasico' }: MascotProps) {
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  const scale = size / 100;

  return (
    <div 
      className="relative inline-block mascot-wiggle"
      style={{ width: size, height: size + 20 }}
    >
      <div 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'top left', 
          width: 100, 
          height: 100, 
          position: 'relative' 
        }}
      >
        {/* Sombra de piso */}
        <div 
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70px] h-[10px] bg-black/20 rounded-[50%] blur-sm"
          style={{ filter: 'blur(3px)' }}
        />

        {/* Peinado (detrás del cuerpo) */}
        <MascotHair style={style} color={color} />

        {/* Brazo izquierdo */}
        <div 
          className="absolute top-[60%] -left-4 w-4 h-8 border-[3px] border-black rounded-sm z-0"
          style={{
            backgroundColor: color,
            boxShadow: "3px 3px 0px 0px #000000",
            transform: "rotate(10deg)",
          }}
        />
        {/* Brazo derecho */}
        <div 
          className="absolute top-[60%] -right-4 w-4 h-8 border-[3px] border-black rounded-sm z-0"
          style={{
            backgroundColor: color,
            boxShadow: "3px 3px 0px 0px #000000",
            transform: "rotate(-10deg)",
          }}
        />

        {/* Pie izquierdo */}
        <div 
          className="absolute -bottom-4 left-3 w-6 h-3 border-[3px] border-black rounded-sm z-0"
          style={{ 
            backgroundColor: color,
            boxShadow: "3px 3px 0px 0px #000000" 
          }}
        />
        {/* Pie derecho */}
        <div 
          className="absolute -bottom-4 right-3 w-6 h-3 border-[3px] border-black rounded-sm z-0"
          style={{ 
            backgroundColor: color,
            boxShadow: "3px 3px 0px 0px #000000" 
          }}
        />

        {/* Cara (cuerpo principal) */}
        <div
          ref={boxRef}
          className="absolute top-0 left-0 w-[100px] h-[100px] border-[4px] border-black rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer z-10"
          style={{
            backgroundColor: color,
            boxShadow: "6px 6px 0px 0px #000000",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translate(-2px, -2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translate(0, 0)")}
        >
          {/* Cejas */}
          <div className="flex gap-4 w-full justify-center">
            <div className="w-6 h-1.5 bg-black rounded-sm rotate-6" />
            <div className="w-6 h-1.5 bg-black rounded-sm -rotate-6" />
          </div>

          {/* Ojos */}
          <div className="flex gap-3">
            <div className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-center justify-center overflow-hidden">
              <div
                className="w-4 h-4 bg-black rounded-sm"
                style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
              />
            </div>
            <div className="relative w-7 h-7 bg-white border-[3px] border-black rounded-sm flex items-center justify-center overflow-hidden">
              <div
                className="w-4 h-4 bg-black rounded-sm"
                style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
              />
            </div>
          </div>

          {/* Boca */}
          <div className="relative w-8 h-4 bg-black rounded-sm mt-1 flex items-start justify-center overflow-hidden">
            <div className="absolute top-0 left-2 w-2 h-2 bg-white rounded-sm" />
          </div>
        </div>

        {/* Accesorios faciales (encima de la cara) */}
        <MascotFaceAccessories style={style} />

        {/* Ropa (encima del cuerpo) */}
        <MascotClothing style={style} bodyColor={color} />
      </div>
    </div>
  );
}