import { useEffect } from 'react'
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000) // Se cierra solo en 4 segundos
    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: <FaCheckCircle className="text-emerald-400" size={22} />,
    error: <FaExclamationCircle className="text-red-400" size={22} />,
    info: <FaInfoCircle className="text-purple-400" size={22} />,
  }

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    info: 'border-purple-500/30',
  }

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-[slideIn_0.4s_ease-out]">
      <div className={`flex items-center gap-3 bg-[#1a1a1a] border ${borders[type]} rounded-xl px-5 py-3 shadow-2xl min-w-[280px]`}>
        {icons[type]}
        <p className="text-white text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 text-gray-500 hover:text-white transition-colors bg-transparent"
        >
          ✕
        </button>
      </div>
    </div>
  )
}