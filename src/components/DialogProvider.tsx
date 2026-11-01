// src/components/DialogProvider.tsx
// Reemplazo con estilo de window.confirm / window.alert.
// Uso:  const { confirm } = useDialog()
//       if (!(await confirm({ title: '¿Borrar?', message: '...', danger: true }))) return
import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { FaExclamationTriangle, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa'

interface DialogOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  alertOnly?: boolean   // solo botón "Entendido"
}

interface DialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>
  alert: (options: Omit<DialogOptions, 'alertOnly' | 'cancelLabel'>) => Promise<void>
}

const DialogContext = createContext<DialogContextType | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((options: DialogOptions) => new Promise<boolean>(resolve => {
    resolverRef.current = resolve
    setDialog(options)
  }), [])

  const alert = useCallback(async (options: Omit<DialogOptions, 'alertOnly' | 'cancelLabel'>) => {
    await confirm({ ...options, alertOnly: true })
  }, [confirm])

  const close = (result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setDialog(null)
  }

  const Icon = dialog?.danger ? FaExclamationTriangle : dialog?.alertOnly ? FaInfoCircle : FaQuestionCircle

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="sanat-dialog-title">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]" onClick={() => close(false)} />
          <div className={`relative w-full max-w-sm bg-[#1a1a1a] border rounded-2xl p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out] ${dialog.danger ? 'border-red-900/60' : 'border-[#2a2a2a]'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${dialog.danger ? 'bg-red-900/30 text-red-400' : 'bg-purple-900/30 text-purple-300'}`}>
              <Icon size={20} />
            </div>
            <h3 id="sanat-dialog-title" className="text-white text-lg font-semibold mb-2">{dialog.title}</h3>
            {dialog.message && <p className="text-gray-300 text-sm leading-relaxed mb-6">{dialog.message}</p>}
            <div className={`flex gap-3 ${dialog.message ? '' : 'mt-6'}`}>
              {!dialog.alertOnly && (
                <button onClick={() => close(false)} className="flex-1 py-2.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-gray-100 text-sm font-medium transition-colors">
                  {dialog.cancelLabel || 'Cancelar'}
                </button>
              )}
              <button
                autoFocus
                onClick={() => close(true)}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${dialog.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-700 hover:bg-purple-600'}`}
              >
                {dialog.confirmLabel || (dialog.alertOnly ? 'Entendido' : 'Aceptar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) throw new Error('useDialog debe usarse dentro de DialogProvider')
  return context
}
