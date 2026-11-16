// src/components/ConfirmEmailSteps.tsx
// Explicación visual de cómo confirmar la cuenta: dónde buscar el mail (incluido Spam y Promociones)
// y un acceso directo a Gmail u Outlook. La usan el login (al crear cuenta) y "Verificar email".
import { useEffect, useState } from 'react'
import { FaEnvelopeOpenText, FaExternalLinkAlt, FaInbox, FaRedo, FaSpinner, FaTag, FaExclamationTriangle } from 'react-icons/fa'
import Mascot from './Mascot'

const RESEND_COOLDOWN_S = 60

// Acceso directo a la casilla según el dominio del mail (busca en todas las carpetas, Spam incluido)
function mailboxLink(email: string): { label: string; href: string } | null {
  const domain = email.split('@')[1]?.toLowerCase() || ''
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return { label: 'Abrir Gmail', href: 'https://mail.google.com/mail/u/0/#search/in%3Aanywhere+SANAT+newer_than%3A2d' }
  }
  if (/^(hotmail|outlook|live|msn)\.[a-z.]+$/.test(domain)) return { label: 'Abrir Outlook', href: 'https://outlook.live.com/mail/0/junkemail' }
  if (/^yahoo\.[a-z.]+$/.test(domain)) return { label: 'Abrir Yahoo Mail', href: 'https://mail.yahoo.com/' }
  return null
}

interface Props {
  email: string
  onResend: () => Promise<boolean>   // true si se pudo reenviar
  sentAt?: number                     // cuándo se mandó el último mail (para la espera de 1 minuto)
}

export default function ConfirmEmailSteps({ email, onResend, sentAt }: Props) {
  const [lastSent, setLastSent] = useState(sentAt ?? Date.now())
  const [now, setNow] = useState(Date.now())
  const [sending, setSending] = useState(false)
  const wait = Math.max(0, RESEND_COOLDOWN_S - Math.floor((now - lastSent) / 1000))
  const mailbox = mailboxLink(email)

  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setNow(Date.now()), 1000)
    return () => window.clearTimeout(timer)
  }, [wait, now])

  const resend = async () => {
    if (wait > 0 || sending) return
    setSending(true)
    const ok = await onResend()
    setSending(false)
    if (ok) { setLastSent(Date.now()); setNow(Date.now()) }
  }

  return (
    <div className="space-y-5 text-left">
      {/* El cartero con su globito */}
      <div className="flex items-end gap-3">
        <span className="shrink-0 mensajero-salta"><Mascot color="#a855f7" size={64} expression="cartero" /></span>
        <p className="mb-8 px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-[#f4efe6] text-[#1c1917] font-marker text-base leading-snug">
          ¡Te mandé un mail para confirmar tu cuenta!
        </p>
      </div>

      <ol className="space-y-4">
        <li className="flex gap-3">
          <span className="paso-mail">1</span>
          <div className="min-w-0">
            <p className="text-sm text-white font-semibold">Abrí tu mail</p>
            <p className="text-xs text-gray-300 mt-0.5">Lo mandamos a <span className="text-purple-300 font-semibold break-all">{email}</span>. Puede tardar un par de minutos.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="paso-mail">2</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white font-semibold">¿No está? Mirá en Spam y en Promociones</p>
            <p className="text-xs text-gray-300 mt-0.5">Como SANAT es nuevo, muchas veces el mail cae ahí.</p>
            {/* Dibujito de las carpetas del mail */}
            <div className="mt-2.5 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-1.5 space-y-1" aria-hidden>
              <span className="flex items-center gap-2 px-2 py-1 rounded text-[11px] text-gray-400"><FaInbox size={10} /> Recibidos</span>
              <span className="flex items-center gap-2 px-2 py-1 rounded text-[11px] text-amber-100 bg-amber-900/40 border border-amber-700/50"><FaTag size={10} /> Promociones <span className="ml-auto">← mirá acá</span></span>
              <span className="flex items-center gap-2 px-2 py-1 rounded text-[11px] text-red-100 bg-red-900/40 border border-red-700/50"><FaExclamationTriangle size={10} /> Spam / Correo no deseado <span className="ml-auto">← y acá</span></span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Si estaba en Spam, marcalo como <b className="text-gray-200">"No es spam"</b>: así los próximos avisos de SANAT te llegan bien.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="paso-mail">3</span>
          <div className="min-w-0">
            <p className="text-sm text-white font-semibold">Tocá el link de confirmación</p>
            <p className="text-xs text-gray-300 mt-0.5">Te trae de vuelta a SANAT y ya podés iniciar sesión.</p>
          </div>
        </li>
      </ol>

      <div className="flex flex-col gap-2">
        {mailbox && (
          <a href={mailbox.href} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2">
            <FaEnvelopeOpenText /> {mailbox.label} <FaExternalLinkAlt size={10} />
          </a>
        )}
        <button type="button" onClick={resend} disabled={wait > 0 || sending} className="w-full py-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] text-gray-200 text-sm hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {sending ? <><FaSpinner className="animate-spin" /> Reenviando...</> : wait > 0 ? <>Podés pedir otro en {wait} s</> : <><FaRedo size={11} /> Reenviar el mail</>}
        </button>
      </div>
    </div>
  )
}
