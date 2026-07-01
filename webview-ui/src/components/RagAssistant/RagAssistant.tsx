import { useState, useCallback, useEffect, useRef } from 'react'
import { useRagState } from '../../hooks/useRagState'
import { useVsCodeApi } from '../../hooks/useVsCodeApi'
import type { ExtensionMessage, ChatMessage } from '../../types/messages'
import '../../styles/rag-assistant.css'
import RagSidePanel from './RagSidePanel'

const TIMEOUT_MS = 30_000

export default function RagAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isOpen, togglePanel, closePanel } = useRagState()
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const { postMessage } = useVsCodeApi((msg: ExtensionMessage) => {
    clearTimeout(timerRef.current)
    if (msg.type === 'answer') {
      setIsLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', text: msg.payload }])
    } else if (msg.type === 'ragError') {
      setIsLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', text: 'Сервер не отвечает. Попробуйте позже.' }])
    }
  })

  useEffect(() => {
    document.body.classList.toggle('rag-panel-open', isOpen)
    if (!isOpen) {
      document.documentElement.style.removeProperty('--rag-panel-width')
    }
    return () => {
      document.body.classList.remove('rag-panel-open')
      document.documentElement.style.removeProperty('--rag-panel-width')
    }
  }, [isOpen])

  const handleSend = useCallback((text: string) => {
    clearTimeout(timerRef.current)
    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'user', text }])
    const history = messages.slice(-5)
    postMessage({ type: 'askQuestion', payload: { question: text, history } })
    timerRef.current = setTimeout(() => {
      timerRef.current = undefined
      setIsLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', text: 'Сервер не отвечает. Попробуйте позже.' }])
    }, TIMEOUT_MS)
  }, [postMessage, messages])

  return (
    <>
      <div className={`rag-handle-wrap${isOpen ? ' hidden' : ''}`}>
        <div className="rag-handle" onClick={togglePanel}>
          Ассистент
        </div>
      </div>

      <RagSidePanel
        isOpen={isOpen}
        onClose={closePanel}
        onSend={handleSend}
        messages={messages}
        isLoading={isLoading}
      />
    </>
  )
}
