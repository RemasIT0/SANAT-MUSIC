export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0f0f0f]">
      {/* Gradiente base oscuro */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0a0a0a]"></div>
      
      {/* Vinilo giratorio responsive */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow">
        <div className="relative w-[min(85vw,800px)] h-[min(85vw,800px)] rounded-full bg-[#0a0a0a] border-4 border-gray-800/40 shadow-2xl shadow-black/50">
          
          {/* Surcos del vinilo */}
          <div className="absolute inset-4 rounded-full border border-gray-700/20"></div>
          <div className="absolute inset-8 rounded-full border border-gray-700/15"></div>
          <div className="absolute inset-12 rounded-full border border-gray-700/20"></div>
          <div className="absolute inset-16 rounded-full border border-gray-700/15"></div>
          <div className="absolute inset-20 rounded-full border border-gray-700/20"></div>
          <div className="absolute inset-24 rounded-full border border-gray-700/15"></div>
          <div className="absolute inset-28 rounded-full border border-gray-700/20"></div>
          <div className="absolute inset-32 rounded-full border border-gray-700/15"></div>
          
          {/* Colmillos puntiagudos (diseño más agresivo) */}
          <div className="absolute inset-0 rounded-full overflow-hidden opacity-15">
            {/* Dientes superiores (afilados) */}
            <div className="absolute top-[12%] left-1/2 -translate-x-1/2 flex gap-1">
              {[...Array(9)].map((_, i) => (
                <div 
                  key={`top-${i}`} 
                  className="bg-gray-200"
                  style={{ 
                    width: '6px', 
                    height: `${20 + Math.abs(i - 4) * 8}px`,
                    clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                    transform: `rotate(${(i - 4) * 6}deg)`
                  }}
                ></div>
              ))}
            </div>
            
            {/* Dientes inferiores (afilados) */}
            <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 flex gap-1">
              {[...Array(9)].map((_, i) => (
                <div 
                  key={`bottom-${i}`} 
                  className="bg-gray-200"
                  style={{ 
                    width: '6px', 
                    height: `${20 + Math.abs(i - 4) * 8}px`,
                    clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
                    transform: `rotate(${(i - 4) * -6}deg)`
                  }}
                ></div>
              ))}
            </div>
            
            {/* Colmillos largos laterales (los más afilados) */}
            <div 
              className="absolute top-[18%] left-[22%] bg-gray-100"
              style={{ width: '8px', height: '50px', clipPath: 'polygon(50% 100%, 0 0, 100% 0)', transform: 'rotate(15deg)' }}
            ></div>
            <div 
              className="absolute top-[18%] right-[22%] bg-gray-100"
              style={{ width: '8px', height: '50px', clipPath: 'polygon(50% 100%, 0 0, 100% 0)', transform: 'rotate(-15deg)' }}
            ></div>
            <div 
              className="absolute bottom-[18%] left-[22%] bg-gray-100"
              style={{ width: '8px', height: '50px', clipPath: 'polygon(50% 0, 0 100%, 100% 100%)', transform: 'rotate(-15deg)' }}
            ></div>
            <div 
              className="absolute bottom-[18%] right-[22%] bg-gray-100"
              style={{ width: '8px', height: '50px', clipPath: 'polygon(50% 0, 0 100%, 100% 100%)', transform: 'rotate(15deg)' }}
            ></div>
          </div>
          
          {/* Centro del vinilo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25%] h-[25%] rounded-full bg-gradient-to-br from-gray-800 via-purple-900/30 to-gray-900 border-2 border-gray-700/40 shadow-inner">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full border border-gray-600/30"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] rounded-full bg-[#0f0f0f] border border-gray-600/40"></div>
          </div>
          
          {/* Brillo reflejo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Partículas brillantes sutiles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-gray-400 rounded-full animate-twinkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: 0.2
          }}
        />
      ))}
    </div>
  )
}