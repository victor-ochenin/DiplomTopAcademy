import { useState, useCallback, useEffect } from 'react'
import { useRagState } from '../../hooks/useRagState'
import { useVsCodeApi } from '../../hooks/useVsCodeApi'
import type { ExtensionMessage } from '../../types/messages'
import '../../styles/rag-assistant.css'
import RagSidePanel, { type ChatMessage } from './RagSidePanel'

export default function RagAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const { isOpen, togglePanel, closePanel } = useRagState()
  const { postMessage } = useVsCodeApi((msg: ExtensionMessage) => {
    if (msg.type === 'answer') {
      setMessages(prev => [...prev, { role: 'assistant', text: msg.payload }])
    } else if (msg.type === 'ragError') {
      setMessages(prev => [...prev, { role: 'assistant', text: `Ошибка: ${msg.payload}` }])
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
    setMessages(prev => [...prev, { role: 'user', text }])
    postMessage({ type: 'askQuestion', payload: text })
  }, [postMessage])

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
      />
    </>
  )
}
