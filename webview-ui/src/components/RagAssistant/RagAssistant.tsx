import { useEffect } from 'react'
import { useRagState } from '../../hooks/useRagState'
import '../../styles/rag-assistant.css'
import RagSidePanel from './RagSidePanel'

export default function RagAssistant() {
  const {
    isOpen,
    togglePanel,
    closePanel,
  } = useRagState()

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
      />
    </>
  )
}
