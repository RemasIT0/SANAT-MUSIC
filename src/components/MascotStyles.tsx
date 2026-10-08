// src/components/MascotStyles.tsx
import React from 'react';

// Tipos de estilos disponibles
export type MascotStyleType = 'clasico' | 'rockero' | 'gaucho' | 'punk' | 'cumbiero';

// Definición de cada estilo
export const MASCOT_STYLES: Record<MascotStyleType, {
  name: string;
  emoji: string;
  description: string;
}> = {
  clasico: {
    name: 'Clásico',
    emoji: '🎹',
    description: 'Simple y minimalista'
  },
  rockero: {
    name: 'Rockero',
    emoji: '🎸',
    description: 'Pelo largo, remera de banda'
  },
  gaucho: {
    name: 'Gaucho',
    emoji: '',
    description: 'Sombrero y poncho'
  },
  punk: {
    name: 'Punk',
    emoji: '🎭',
    description: 'Cresta y campera de cuero'
  },
  cumbiero: {
    name: 'Cumbiero',
    emoji: '🎵',
    description: 'Lentes de sol, camisa brillante'
  }
};

// Componente de Peinado según estilo
export const MascotHair: React.FC<{ style: MascotStyleType; color: string }> = ({ style, color }) => {
  switch (style) {
    case 'rockero':
      return (
        <>
          {/* Pelo largo despeinado */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[110px] h-[40px] z-20">
            <div className="absolute top-0 left-0 w-full h-full bg-black rounded-t-full opacity-90"></div>
            <div className="absolute top-2 left-2 w-3 h-8 bg-black rounded-full -rotate-12"></div>
            <div className="absolute top-2 right-2 w-3 h-8 bg-black rounded-full rotate-12"></div>
            <div className="absolute top-0 left-1/4 w-4 h-10 bg-black rounded-full"></div>
            <div className="absolute top-0 right-1/4 w-4 h-10 bg-black rounded-full"></div>
          </div>
        </>
      );
    case 'gaucho':
      return (
        <>
          {/* Sombrero gaucho */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[120px] h-[30px] z-20">
            <div className="absolute bottom-0 left-0 w-full h-[10px] bg-amber-900 rounded-full border-2 border-black"></div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[80px] h-[25px] bg-amber-800 rounded-t-full border-2 border-black"></div>
          </div>
        </>
      );
    case 'punk':
      return (
        <>
          {/* Cresta punk */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[30px] h-[40px] z-20">
            <div className="w-full h-full bg-red-600 border-2 border-black rounded-t-full"></div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[20px] h-[30px] bg-red-500 rounded-t-full"></div>
          </div>
        </>
      );
    case 'cumbiero':
      return (
        <>
          {/* Pelo corto peinado */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[105px] h-[20px] z-20">
            <div className="w-full h-full bg-black rounded-t-full opacity-90"></div>
          </div>
        </>
      );
    default:
      return null; // Clásico no tiene pelo
  }
};

// Componente de Ropa según estilo
export const MascotClothing: React.FC<{ style: MascotStyleType; bodyColor: string }> = ({ style, bodyColor }) => {
  switch (style) {
    case 'rockero':
      return (
        <>
          {/* Remera de banda negra */}
          <div className="absolute bottom-0 left-0 w-full h-[30px] bg-black z-5 rounded-b-sm">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white text-[8px] font-bold">ROCK</div>
          </div>
        </>
      );
    case 'gaucho':
      return (
        <>
          {/* Poncho */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[110px] h-[35px] z-5">
            <div className="w-full h-full bg-amber-700 border-2 border-black rounded-b-lg"></div>
            <div className="absolute top-2 left-1/4 w-2 h-8 bg-red-600"></div>
            <div className="absolute top-2 right-1/4 w-2 h-8 bg-red-600"></div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-8 bg-green-600"></div>
          </div>
        </>
      );
    case 'punk':
      return (
        <>
          {/* Campera de cuero con tachas */}
          <div className="absolute bottom-0 left-0 w-full h-[30px] bg-gray-900 z-5 rounded-b-sm border-t-2 border-black">
            <div className="absolute top-1 left-2 w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="absolute top-1 right-2 w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        </>
      );
    case 'cumbiero':
      return (
        <>
          {/* Camisa brillante */}
          <div className="absolute bottom-0 left-0 w-full h-[30px] bg-gradient-to-r from-purple-500 to-pink-500 z-5 rounded-b-sm">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-300 rounded-full"></div>
          </div>
        </>
      );
    default:
      return null; // Clásico sin ropa especial
  }
};

// Componente de Accesorios Faciales según estilo
export const MascotFaceAccessories: React.FC<{ style: MascotStyleType }> = ({ style }) => {
  switch (style) {
    case 'gaucho':
      return (
        <>
          {/* Bigote */}
          <div className="absolute bottom-[35px] left-1/2 -translate-x-1/2 w-[30px] h-[8px] z-15">
            <div className="absolute left-0 w-[15px] h-[8px] bg-black rounded-full -rotate-12"></div>
            <div className="absolute right-0 w-[15px] h-[8px] bg-black rounded-full rotate-12"></div>
          </div>
        </>
      );
    case 'cumbiero':
      return (
        <>
          {/* Lentes de sol */}
          <div className="absolute top-[35px] left-1/2 -translate-x-1/2 w-[60px] h-[15px] z-15 flex gap-1">
            <div className="w-[25px] h-[15px] bg-black rounded border-2 border-black"></div>
            <div className="w-[25px] h-[15px] bg-black rounded border-2 border-black"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[2px] bg-black"></div>
          </div>
        </>
      );
    case 'punk':
      return (
        <>
          {/* Piercing en la ceja */}
          <div className="absolute top-[20px] left-[25px] w-[4px] h-[4px] bg-gray-400 rounded-full z-15"></div>
        </>
      );
    default:
      return null; // Clásico sin accesorios
  }
};