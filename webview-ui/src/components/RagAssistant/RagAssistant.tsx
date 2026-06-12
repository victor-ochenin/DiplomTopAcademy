import { useRagState } from '../../hooks/useRagState'
import '../../styles/rag-assistant.css'
import RagSidePanel from './RagSidePanel'

export default function RagAssistant() {
  const {
    isOpen,
    togglePanel,
    closePanel,
  } = useRagState()

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
