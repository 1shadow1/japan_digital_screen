/**
 * TTSPlayer: 基于 MediaSource 的 MP3 流式播放工具
 * 功能：
 * - 处理后端通过 WebSocket 发送的 `type=audio` Base64 MP3 分片
 * - 优先使用 MediaSource/SourceBuffer 进行边收边播；不支持时退化为收集分片，最终合并播放
 *
 * 使用示例：
 * ```ts
 * const audioEl = audioRef.current!
 * const player = new TTSPlayer(audioEl)
 * player.enableMSE()
 * // 收到分片：
 * player.appendBase64(msg.data_b64)
 * // 若未启用 MSE（或需要一次性播放）：
 * player.playCollected()
 * ```
 *
 * 输入输出说明：
 * - 构造函数输入：`audioEl: HTMLAudioElement` 播放用 <audio> 元素
 * - `enableMSE()`：无输入；尝试创建 MediaSource/SourceBuffer('audio/mpeg')
 * - `appendBase64(b64: string)`：输入 Base64 MP3 分片；输出无（内部追加缓冲或 MSE 播放）
 * - `playCollected()`：无输入；当未启用 MSE 时，将收集的分片合并为 Blob 并播放
 * - `reset()`：无输入；重置内部状态与队列
 *
 * 关键算法与逻辑：
 * - MSE 模式：维护 `queue` 与 `sourceBuffer.updateend` 事件，保证分片在缓冲更新完成后依次追加
 * - 退化模式：收集 `Uint8Array` 分片，在最终阶段 `concat` 为一个连续字节序列并以 Blob 播放
 */
export class TTSPlayer {
  private audioEl: HTMLAudioElement
  private mediaSource: MediaSource | null = null
  private sourceBuffer: SourceBuffer | null = null
  private usingMSE = false
  private queue: ArrayBuffer[] = []
  private collected: Uint8Array[] = []

  constructor(audioEl: HTMLAudioElement) {
    this.audioEl = audioEl
  }

  /**
   * 启用 MediaSource 流式播放（若环境支持）
   * - 创建 MediaSource 并绑定到 audio 元素
   * - 在 `sourceopen` 事件中创建 `audio/mpeg` SourceBuffer
   */
  enableMSE() {
    if (!('MediaSource' in window)) return
    this.mediaSource = new MediaSource()
    this.audioEl.src = URL.createObjectURL(this.mediaSource)
    this.mediaSource.addEventListener('sourceopen', () => {
      try {
        this.sourceBuffer = this.mediaSource!.addSourceBuffer('audio/mpeg')
        this.usingMSE = true
        this.sourceBuffer!.addEventListener('updateend', () => {
          if (!this.sourceBuffer) return
          if (this.queue.length > 0 && !this.sourceBuffer.updating) {
            const next = this.queue.shift()!
            try { this.sourceBuffer.appendBuffer(next) } catch {}
          }
        })
      } catch {
        this.usingMSE = false
        this.mediaSource = null
        this.sourceBuffer = null
      }
    })
  }

  /**
   * 追加一个 Base64 MP3 分片
   * - MSE 模式：转为 ArrayBuffer 并 appendBuffer；若正在更新则入队
   * - 退化模式：转为 Uint8Array 并推入 collected，供最终合并播放
   */
  appendBase64(b64: string) {
    if (!b64 || typeof b64 !== 'string') return
    // Base64 -> Uint8Array
    let bytes: Uint8Array
    try {
      const binStr = atob(b64)
      bytes = new Uint8Array(binStr.length)
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i)
    } catch { return }

    if (this.usingMSE && this.sourceBuffer) {
      const ab = bytes.buffer
      try {
        if (this.sourceBuffer.updating) this.queue.push(ab)
        else this.sourceBuffer.appendBuffer(ab)
        // 在用户手势已发生后尝试播放（避免自动播放限制）
        this.audioEl.play().catch(() => {})
      } catch {
        // 追加失败时退化到收集合并
        this.collected.push(bytes)
      }
    } else {
      this.collected.push(bytes)
    }
  }

  /**
   * 播放已收集的分片（用于未启用 MSE 的情况）
   */
  playCollected() {
    if (this.collected.length === 0) return
    const total = this.collected.reduce((s, u8) => s + u8.length, 0)
    const merged = new Uint8Array(total)
    let off = 0
    for (const u8 of this.collected) { merged.set(u8, off); off += u8.length }
    this.collected = []
    const blob = new Blob([merged], { type: 'audio/mpeg' })
    try {
      this.audioEl.src = URL.createObjectURL(blob)
      this.audioEl.play().catch(() => {})
    } catch {}
  }

  /**
   * 重置播放器状态与队列
   */
  reset() {
    this.queue = []
    this.collected = []
    try { this.audioEl.pause() } catch {}
    try { if (this.mediaSource && this.mediaSource.readyState === 'open') this.mediaSource.endOfStream() } catch {}
    this.mediaSource = null
    this.sourceBuffer = null
    this.usingMSE = false
  }
}