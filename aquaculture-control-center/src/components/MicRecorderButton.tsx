import React, { useCallback, useEffect, useRef, useState } from 'react'
import './MicRecorderButton.css'

// 环境变量配置（可在 .env.[mode] 中配置）
const WS_URL = import.meta.env.VITE_ASR_WS_URL as string | undefined
const UPLOAD_URL = import.meta.env.VITE_ASR_UPLOAD_URL as string | undefined

// 发送模式：优先 WebSocket 实时；若未配置，则在停止后通过 HTTP 上传整段音频
const getMode = () => (WS_URL ? 'ws' : (UPLOAD_URL ? 'http' : 'none')) as 'ws' | 'http' | 'none'

const preferredMimeTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
]

const pickSupportedMimeType = () => {
  for (const type of preferredMimeTypes) {
    if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported?.(type)) {
      return type
    }
  }
  return '' // 让浏览器自己选择
}

const MicRecorderButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const modeRef = useRef(getMode())

  useEffect(() => {
    modeRef.current = getMode()
  })

  const cleanup = useCallback(() => {
    try {
      mediaRecorderRef.current?.stop()
    } catch {}
    mediaRecorderRef.current = null

    try {
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    } catch {}
    mediaStreamRef.current = null

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // 发送结束标记，具体协议可按后端调整
        try { wsRef.current.send(JSON.stringify({ type: 'end' })) } catch {}
      }
      wsRef.current?.close()
    } catch {}
    wsRef.current = null

    chunksRef.current = []
    setStatus('')
  }, [])

  const startRecording = useCallback(async () => {
    setPermissionError(null)
    const mode = modeRef.current
    if (mode === 'none') {
      setPermissionError('未配置音频发送地址，请设置 VITE_ASR_WS_URL 或 VITE_ASR_UPLOAD_URL')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      // WebSocket 建立
      if (mode === 'ws' && WS_URL) {
        const ws = new WebSocket(WS_URL)
        ws.binaryType = 'arraybuffer'
        ws.onopen = () => {
          setStatus('已连接服务端，开始录音…')
          try {
            ws.send(JSON.stringify({ type: 'start', format: 'opus', mimeType: pickSupportedMimeType() || 'default' }))
          } catch {}
        }
        ws.onerror = (e) => setStatus('WebSocket 连接错误')
        ws.onclose = () => setStatus('WebSocket 已关闭')
        wsRef.current = ws
      }

      const mimeType = pickSupportedMimeType()
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mr

      mr.ondataavailable = async (ev: BlobEvent) => {
        if (!ev.data || ev.data.size === 0) return
        const blob = ev.data
        if (modeRef.current === 'ws' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            const buf = await blob.arrayBuffer()
            wsRef.current.send(buf)
          } catch (err) {
            console.warn('发送音频分片失败', err)
          }
        } else if (modeRef.current === 'http') {
          chunksRef.current.push(blob)
        }
      }

      mr.onstart = () => setStatus('录音中…')
      mr.onstop = async () => {
        if (modeRef.current === 'http' && UPLOAD_URL) {
          try {
            const allBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
            const form = new FormData()
            form.append('file', allBlob, 'audio.webm')
            // 可根据后端改成 application/octet-stream 或自定义字段
            const resp = await fetch(UPLOAD_URL, {
              method: 'POST',
              body: form,
            })
            if (!resp.ok) {
              throw new Error(`上传失败: ${resp.status}`)
            }
            setStatus('音频已上传')
          } catch (err: any) {
            setStatus(`上传出错: ${err?.message || '未知错误'}`)
          }
        }
        cleanup()
      }

      // 每 300ms 产出一段音频分片（实时语音识别常用）
      mr.start(300)
      setIsRecording(true)
    } catch (err: any) {
      console.error(err)
      setPermissionError(err?.message || '无法获取麦克风权限')
      cleanup()
      setIsRecording(false)
    }
  }, [cleanup])

  const stopRecording = useCallback(() => {
    try {
      mediaRecorderRef.current?.stop()
    } catch {}
    setIsRecording(false)
    setStatus('结束中…')
  }, [])

  const handleClick = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  return (
    <div className="mic-fab-container">
      <button
        className={`mic-fab ${isRecording ? 'recording' : ''}`}
        onClick={handleClick}
        title={isRecording ? '点击停止并发送' : '点击开始说话'}
      >
        <span className="mic-icon">{isRecording ? '🎙️' : '🎤'}</span>
      </button>
      {permissionError && (
        <div className="mic-toast error">{permissionError}</div>
      )}
      {status && !permissionError && (
        <div className="mic-toast status">{status}</div>
      )}
    </div>
  )
}

export default MicRecorderButton