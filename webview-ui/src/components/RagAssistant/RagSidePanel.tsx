interface RagSidePanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function RagSidePanel({
  isOpen,
  onClose,
}: RagSidePanelProps) {
  return (
    <div className={`rag-sidepanel${isOpen ? ' open' : ''}`}>
      <div className="rsp-header">
        <div className="rsp-title">
          Ассистент
        </div>
        <button className="rsp-close" onClick={onClose}>×</button>
      </div>
    </div>
  )
}
