import React from 'react'
import './AsrSubtitleOverlay.css'

interface Props {
  partialText?: string
  finalText?: string
}

const AsrSubtitleOverlay: React.FC<Props> = ({ partialText = '', finalText = '' }) => {
  const text = partialText || finalText || ''
  if (!text) return null
  return (
    <div className="asr-subtitle-overlay">
      <div className="asr-subtitle-bar">
        <span className="asr-subtitle-text">{text}</span>
      </div>
    </div>
  )
}

export default AsrSubtitleOverlay