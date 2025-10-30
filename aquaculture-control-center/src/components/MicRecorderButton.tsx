import React, { useCallback, useEffect, useRef, useState } from 'react'
import './MicRecorderButton.css'

interface Props {
  onPartial?: (text: string) => void
  onFinal?: (text: string) => void
}

// 目标采样率与分片大小（200ms @16kHz -> 3200 samples）
const TARGET_RATE = 16000
const PACKET_SAMPLES = 3200

// 环境变量配置（可在 .env.[mode] 中配置）
const ENV_WS_URL = import.meta.env.VITE_ASR_WS_URL as string | undefined
const defaultWsUrl = (() => {
  try {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://'
    return proto + location.host + '/ws-asr'
  } catch {
    return undefined
  }
})()
const WS_URL = ENV_WS_URL || defaultWsUrl

const MicRecorderButton: React.FC<Props> = ({ onPartial, onFinal }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const srcRateRef = useRef<number>(TARGET_RATE)
  const resampledQueueRef = useRef<number[]>([])

  const cleanup = useCallback(() => {
    try { processorRef.current?.disconnect(); processorRef.current && (processorRef.current.onaudioprocess = null as any) } catch {}
    processorRef.current = null
    try { sourceRef.current?.disconnect() } catch {}
    sourceRef.current = null
    try { audioCtxRef.current?.close() } catch {}
    audioCtxRef.current = null
    try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    streamRef.current = null
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try { wsRef.current.send(JSON.stringify({ event: 'end' })) } catch {}
      }
      wsRef.current?.close()
    } catch {}
    wsRef.current = null
    resampledQueueRef.current = []
    setStatus('')
  }, [])

  const connectWS = useCallback(() => {
    if (!WS_URL) {
      setPermissionError('未配置 VITE_ASR_WS_URL，且无法推断默认地址。')
      return null
    }
    const ws = new WebSocket(WS_URL)
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => setStatus('WebSocket 已连接')
    ws.onerror = () => setStatus('WebSocket 连接错误')
    ws.onclose = () => setStatus('WebSocket 已关闭')
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string)
        if (msg.type === 'result') {
          if (msg.final) {
            onFinal?.(msg.text || '')
          } else {
            onPartial?.(msg.text || '')
          }
        }
      } catch {
        // ignore
      }
    }
    wsRef.current = ws
    return ws
  }, [onFinal, onPartial])

  const resampleTo16k = (src: Float32Array, srcRate: number) => {
    if (srcRate === TARGET_RATE) return src
    const factor = TARGET_RATE / srcRate
    const destLen = Math.round(src.length * factor)
    const dest = new Float32Array(destLen)
    for (let i = 0; i < destLen; i++) {
      const t = i / factor
      const j = Math.floor(t)
      const k = Math.min(j + 1, src.length - 1)
      const frac = t - j
      dest[i] = src[j] + (src[k] - src[j]) * frac
    }
    return dest
  }

  const appendResampled = (arr: Float32Array) => {
    for (let i = 0; i < arr.length; i++) resampledQueueRef.current.push(arr[i])
  }

  const flushSegments = () => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const q = resampledQueueRef.current
    while (q.length >= PACKET_SAMPLES) {
      const segment = q.splice(0, PACKET_SAMPLES)
      const pcm16 = new Int16Array(PACKET_SAMPLES)
      for (let i = 0; i < PACKET_SAMPLES; i++) {
        const s = Math.max(-1, Math.min(1, segment[i] || 0))
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }
      try { ws.send(pcm16.buffer) } catch { break }
    }
  }

  const startRecording = useCallback(async () => {
    setPermissionError(null)
    try {
      const ws = connectWS()
      if (!ws) return

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: TARGET_RATE })
      audioCtxRef.current = audioCtx
      srcRateRef.current = audioCtx.sampleRate

      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      source.connect(processor)
      processor.connect(audioCtx.destination)

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const input = e.inputBuffer.getChannelData(0)
        const resampled = resampleTo16k(input, srcRateRef.current)
        appendResampled(resampled)
        flushSegments()
      }

      setStatus(`开始采集（源采样率=${srcRateRef.current} → 目标采样率=16000）`)
      setIsRecording(true)
    } catch (err: any) {
      console.error(err)
      setPermissionError(err?.message || '无法获取麦克风权限')
      cleanup()
      setIsRecording(false)
    }
  }, [cleanup, connectWS])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    setStatus('结束中…')
    cleanup()
  }, [cleanup])

  const handleClick = useCallback(() => {
    if (isRecording) stopRecording()
    else startRecording()
  }, [isRecording, startRecording, stopRecording])

  useEffect(() => () => cleanup(), [cleanup])

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