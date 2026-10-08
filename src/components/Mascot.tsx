
interface MascotProps {
  color: string;
  size?: number;
}

export default function Mascot({ color, size = 100 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" rx="16" fill={color} />
      
      <circle cx="35" cy="45" r="6" fill="#1a1a1a" />
      <circle cx="65" cy="45" r="6" fill="#1a1a1a" />
      
      <path 
        d="M 40 65 Q 50 75 60 65" 
        stroke="#1a1a1a" 
        strokeWidth="4" 
        fill="none" 
        strokeLinecap="round" 
      />
    </svg>
  )
}