import { useRef, useState, useEffect, useCallback } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

interface RagSidePanelProps {
  isOpen: boolean
  onClose: () => void
  onSend: (text: string) => void
  messages: ChatMessage[]
  isLoading: boolean
}

const MIN_WIDTH = 400
const MAX_WIDTH = 600

export default function RagSidePanel({
  isOpen,
  onClose,
  onSend,
  messages,
  isLoading,
}: RagSidePanelProps) {
  const [panelWidth, setPanelWidth] = useState(MIN_WIDTH)
  const [isResizing, setIsResizing] = useState(false)

  // Реф на textarea для управления высотой и получения текста при отправке
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Ссылка на последний элемент сообщений для авто-скролла
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Автоматический скролл вниз при появлении нового сообщения
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault() // предотвращаем выделение текста
    setIsResizing(true) // включаем флаг — useEffect ниже начнёт слушать mousemove
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX
      setPanelWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove) // слушаем глобально
    document.addEventListener('mouseup', handleMouseUp)

    return () => { // очистка при размонтировании или при isResizing → false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.setProperty('--rag-panel-width', panelWidth + 'px')
    }
    return () => {
      document.documentElement.style.removeProperty('--rag-panel-width')
    }
  }, [panelWidth, isOpen])

  const autoGrow = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }, [])

  const handleSend = useCallback(() => {
    const ta = textareaRef.current
    if (!ta || !ta.value.trim()) return
    onSend(ta.value.trim())
    ta.value = ''
    ta.style.height = 'auto'
  }, [onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div
      className={`rag-sidepanel${isOpen ? ' open' : ''}${isResizing ? ' resizing' : ''}`}
      style={{ width: panelWidth }}
    >
      <div className="rsp-resizer" onMouseDown={handleResizeStart} />

      <div className="rsp-header">
        <div className="rsp-title">
          Ассистент
        </div>
        <button className="rsp-close" onClick={onClose}>×</button>
      </div>

      <div className="rsp-body">
        {messages.length === 0 ? (
          <div className="rsp-empty">
            Если у вас есть вопрос по курсу, спросите меня!
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`rsp-msg rsp-msg--${msg.role}`}>
              {msg.text}
            </div>
          ))
        )}
        {isLoading && <div className="rsp-msg rsp-msg--assistant rsp-msg--loading"><span className="rsp-dots"><span>.</span><span>.</span><span>.</span></span></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="rsp-input">
        <textarea
          ref={textareaRef}
          className="rsp-textarea"
          placeholder="Введите сообщение..."
          rows={1}
          onInput={autoGrow}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button className="rsp-send-btn" onClick={handleSend} disabled={isLoading}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M1 8L15 1L8 15L7 9L1 8Z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}
