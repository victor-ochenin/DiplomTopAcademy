import { useRef, useState, useEffect, useCallback } from 'react'

interface RagSidePanelProps {
  isOpen: boolean
  onClose: () => void
}

const MIN_WIDTH = 400
const MAX_WIDTH = 600

export default function RagSidePanel({
  isOpen,
  onClose,
}: RagSidePanelProps) {
  const [panelWidth, setPanelWidth] = useState(MIN_WIDTH)
  const [isResizing, setIsResizing] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Запуск ресайза по mousedown на полоске-резайзере
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault() // предотвращаем выделение текста
    setIsResizing(true) // включаем флаг — useEffect ниже начнёт слушать mousemove
  }, [])

  // Слушатели mousemove/mouseup для ресайза ширины сайдбара
  useEffect(() => {
    if (!isResizing) return

    // При движении мыши вычисляем новую ширину:
    // от правого края окна (window.innerWidth) отнимаем X мыши
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

  // Синхронизируем ширину панели с CSS-переменной на :root для контента
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.setProperty('--rag-panel-width', panelWidth + 'px')
    }
    return () => {
      document.documentElement.style.removeProperty('--rag-panel-width')
    }
  }, [panelWidth, isOpen])

  // Авто-рост textarea: при вводе сбрасываем height на 'auto', затем ставим scrollHeight
  const autoGrow = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }, [])

  return (
    <div
      // open — анимация выезда, resizing — блокировка выделения на время ресайза
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
        <div className="rsp-empty">
          Если у вас есть вопрос по курсу, спросите меня!
        </div>
      </div>

      <div className="rsp-input">
        <textarea
          ref={textareaRef}
          className="rsp-textarea"
          placeholder="Введите сообщение..."
          rows={1}
          onInput={autoGrow}
        />
        <button className="rsp-send-btn" disabled>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M1 8L15 1L8 15L7 9L1 8Z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}
