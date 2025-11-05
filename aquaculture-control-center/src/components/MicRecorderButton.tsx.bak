import React, { useCallback, useEffect, useRef, useState } from 'react'
import './MicRecorderButton.css'

/**
 * 对话消息结构（用于上层 UI 展示“用户/助手”消息）
 * 输入/输出说明：
 * - role：消息角色（user/assistant）
 * - text：消息文本
 * - sessionId：可选，会话标识，便于上层按会话分组展示
 * - sequence：可选，消息序号，便于与后续音频进行关联（如果后端提供）
 */
interface DialogMsg {
  role: 'user' | 'assistant'
  text: string
  sessionId?: string
  sequence?: number
}

interface Props {
  onPartial?: (text: string) => void
  onFinal?: (text: string) => void
  onDialog?: (msg: DialogMsg) => void
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

const MicRecorderButton: React.FC<Props> = ({ onPartial, onFinal, onDialog }) => {
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

  // 播放相关引用：用于播放后端推送的 PCM16/24kHz/mono 二进制音频
  const playbackCtxRef = useRef<AudioContext | null>(null)
  const scheduledTimeRef = useRef<number>(0)
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)

  // 会话与序列（用于过滤与停止事件填充）
  const expectedSessionIdRef = useRef<string | undefined>(undefined)
  const lastTextSequenceRef = useRef<number | undefined>(undefined)

  // 助手文本的流式累积缓冲与当前助手序列（用于 reply 流式展示）
  const assistantAccumRef = useRef<string>('')
  const assistantSeqRef = useRef<number | undefined>(undefined)

  /**
   * 从 msg.reply 中提取可展示的文本 token（兼容两种格式）
   * 输入：raw（unknown）
   * 输出：string（用于累加展示的文本片段）
   * 兼容逻辑：
   * - 若 raw 为普通字符串，直接返回；
   * - 若 raw 看起来是 JSON 串（例如 {"text":"…"}），尝试解析并返回 r.text；解析失败则返回原字符串。
   */
  const extractReplyToken = (raw: unknown): string => {
    if (typeof raw !== 'string') return ''
    const t = raw.trim()
    if (t.startsWith('{') && t.endsWith('}')) {
      try {
        const r = JSON.parse(t)
        return typeof r?.text === 'string' ? r.text : raw
      } catch {
        return raw
      }
    }
    return raw
  }

  /**
   * 确保播放用的 AudioContext 已创建（采样率 24000）
   * 输入：无
   * 输出：AudioContext 实例
   */
  const ensurePlaybackCtx = () => {
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 })
      scheduledTimeRef.current = playbackCtxRef.current.currentTime
    }
    return playbackCtxRef.current
  }

  /**
   * 打断当前播放并向后端发送“停止生成”事件
   * 输入：reason（可选，停止原因字符串）
   * 输出：无（通过 WebSocket 发送停止生成事件）
   * 事件结构定义：
   * {
   *   event: 'stop',           // 停止生成事件名
   *   session_id?: string,     // 当前会话ID（若已知）
   *   sequence?: number,       // 最近文本消息序号（若后端提供）
   *   from: 'client',          // 来源标识
   *   reason?: string,         // 可选，停止原因（如 'new_text_message'）
   *   ts: number               // 客户端时间戳（毫秒）
   * }
   */
  const interruptPlaybackAndNotifyStop = (reason?: string) => {
    try {
      // 停止当前播放的音频源
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop() } catch {}
        currentSourceRef.current.disconnect()
        currentSourceRef.current = null
      }
      // 重置调度时间为当前，清空后续队列（通过重置 scheduledTime 实现）
      const pctx = ensurePlaybackCtx()
      scheduledTimeRef.current = pctx.currentTime

      // 发送停止生成事件至后端
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        const payload: any = {
          event: 'stop',
          from: 'client',
          ts: Date.now()
        }
        if (expectedSessionIdRef.current) payload.session_id = expectedSessionIdRef.current
        if (typeof lastTextSequenceRef.current === 'number') payload.sequence = lastTextSequenceRef.current
        if (reason) payload.reason = reason
        try { ws.send(JSON.stringify(payload)) } catch {}
      }
    } catch {}
  }

  /**
   * 将后端推送的 PCM16/24kHz/单声道二进制追加到播放队列并串接播放
   * 输入：buf(ArrayBuffer) 原始 PCM16 裸字节；sampleRate(默认 24000)
   * 输出：无（直接推进到 AudioContext 播放）
   */
  const enqueuePcm16Audio = (buf: ArrayBuffer, sampleRate = 24000) => {
    const pctx = ensurePlaybackCtx()
    const int16 = new Int16Array(buf)
    const frameCount = int16.length

    // 创建目标 AudioBuffer（单通道）
    const audioBuffer = pctx.createBuffer(1, frameCount, sampleRate)
    const channel = audioBuffer.getChannelData(0)
    for (let i = 0; i < frameCount; i++) {
      // 归一化到 [-1, 1]
      channel[i] = int16[i] / 32768
    }

    // 创建 source 并在 scheduledTime 上启动，实现无缝串接
    const source = pctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(pctx.destination)
    const startAt = Math.max(scheduledTimeRef.current, pctx.currentTime)
    source.start(startAt)
    scheduledTimeRef.current = startAt + audioBuffer.duration

    currentSourceRef.current = source
    source.onended = () => {
      if (currentSourceRef.current === source) {
        try { currentSourceRef.current.disconnect() } catch {}
        currentSourceRef.current = null
      }
    }
  }

  const cleanup = useCallback(() => {
    // 先停止播放并清空队列
    interruptPlaybackAndNotifyStop('cleanup')
    try { playbackCtxRef.current?.close() } catch {}
    playbackCtxRef.current = null
    scheduledTimeRef.current = 0

    // 录音相关清理
    try { processorRef.current?.disconnect(); processorRef.current && (processorRef.current.onaudioprocess = null as any) } catch {}
    processorRef.current = null
    try { sourceRef.current?.disconnect() } catch {}
    sourceRef.current = null
    try { audioCtxRef.current?.close() } catch {}
    audioCtxRef.current = null
    try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    streamRef.current = null

    // 通知后端会话结束（保持兼容原有 'end' 文本事件）
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const payload: any = { event: 'end' }
        if (expectedSessionIdRef.current) payload.session_id = expectedSessionIdRef.current
        try { wsRef.current.send(JSON.stringify(payload)) } catch {}
      }
      wsRef.current?.close()
    } catch {}
    wsRef.current = null
    resampledQueueRef.current = []
    expectedSessionIdRef.current = undefined
    lastTextSequenceRef.current = undefined
    assistantAccumRef.current = ''
    assistantSeqRef.current = undefined
    setStatus('')
  }, [])

  /**
   * 建立 WebSocket 连接并监听消息
   * 输入：无
   * 输出：WebSocket 实例或 null
   * 消息处理：
   * - 文本(JSON)：type=result/dialog → 展示并打断播放，发送 stop；其他事件忽略或按需处理
   * - 二进制：按 PCM16/24kHz 解码并追加播放
   */
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
      const data = evt.data
      // 文本消息（JSON）
      if (typeof data === 'string') {
        try {
          const msg = JSON.parse(data)
          // 建立/过滤会话 ID（如果后端提供）
          if (msg.session_id && !expectedSessionIdRef.current) {
            expectedSessionIdRef.current = msg.session_id as string
          }
          if (expectedSessionIdRef.current && msg.session_id && msg.session_id !== expectedSessionIdRef.current) {
            return // 不是当前会话，忽略
          }
          if (typeof msg.sequence === 'number') {
            lastTextSequenceRef.current = msg.sequence as number
          }
          // 处理 reply 流式增量：优先直接使用字符串；若为 JSON 串则解析出 text
          if (typeof msg.reply === 'string') {
            const token = extractReplyToken(msg.reply)
            if (token) {
              const seq = (typeof msg.sequence === 'number') ? (msg.sequence as number) : undefined
              const isNewStream =
                (typeof seq === 'number' && seq !== assistantSeqRef.current) ||
                (typeof seq !== 'number' && assistantSeqRef.current === undefined)

              if (isNewStream) {
                // 新的助手回复流开始：仅在此时打断播放并发送 stop，避免每个 token 都触发
                interruptPlaybackAndNotifyStop('new_dialog_stream')
                assistantAccumRef.current = ''
                assistantSeqRef.current = seq
              }

              // 累加助手文本并进行流式展示
              assistantAccumRef.current += token
              onDialog?.({
                role: 'assistant',
                text: assistantAccumRef.current,
                sessionId: expectedSessionIdRef.current,
                sequence: assistantSeqRef.current
              })
            }
          }

          // 传统的 dialog 文本（非流式）：若 msg.text 存在，按整段展示，并打断一次
          if (msg.type === 'dialog' && typeof msg.text === 'string' && msg.text.length > 0) {
            interruptPlaybackAndNotifyStop('new_text_message')
            const text = msg.text as string
            assistantAccumRef.current = text
            assistantSeqRef.current = (typeof msg.sequence === 'number') ? (msg.sequence as number) : assistantSeqRef.current
            onDialog?.({ role: 'assistant', text, sessionId: expectedSessionIdRef.current, sequence: assistantSeqRef.current })
          }

          // ASR 结果：用户消息。仅在 final 时上抛 user 文本；partial 继续走 onPartial
          if (msg.type === 'result') {
            const text = (msg.text || '') as string
            if (msg.final) {
              onFinal?.(text)
              onDialog?.({ role: 'user', text, sessionId: expectedSessionIdRef.current, sequence: lastTextSequenceRef.current })
            } else if (text) {
              onPartial?.(text)
            }
          }
          // 可按需处理其他事件（如心跳/确认等）
        } catch {
          // 非 JSON 文本忽略
        }
        return
      }

      // 二进制消息（音频帧：PCM16/24kHz/mono）
      if (data instanceof ArrayBuffer) {
        enqueuePcm16Audio(data, 24000)
        return
      }
      if (data instanceof Blob) {
        data.arrayBuffer().then((buf) => enqueuePcm16Audio(buf, 24000)).catch(() => {})
        return
      }
    }
    wsRef.current = ws
    return ws
  }, [onFinal, onPartial, onDialog])

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