import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { FaTimes, FaPaperPlane, FaSpinner } from 'react-icons/fa'

interface SendMessageModalProps {
  isOpen: boolean
  onClose: () => void
  receiverId: string
  receiverName: string
  senderId: string
  onMessageSent: () => void
}

export default function SendMessageModal({ isOpen, onClose, receiverId, receiverName, senderId, onMessageSent }: SendMessageModalProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
          is_read: false
        })

      if (error) throw error
      
      setContent('')
      onMessageSent()
      onClose()
      alert(`¡Mensaje enviado a ${receiverName}!`)
    } catch (error) {
      alert('Error al enviar el mensaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Enviar mensaje a {receiverName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-transparent">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribí tu mensaje (solo texto)..."
            rows={4}
            maxLength={500}
            className="w-full p-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-purple-600 transition-colors resize-none"
            required
          />
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span className="text-yellow-500/80">⚠️ No se permiten fotos ni videos</span>
            <span>{content.length}/500</span>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <><FaPaperPlane /> Enviar mensaje</>}
          </button>
        </form>
      </div>
    </div>
  )
}