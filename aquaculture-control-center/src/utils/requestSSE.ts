export interface SSEOptions<T> {
  url: string;
  onMessage: (data: T) => void;
  onError?: (event: Event) => void;
  onOpen?: (event: Event) => void;
}

/**
 * 封装 SSE 连接
 * 注意：由于 Vite 代理前缀通常为 /api，连接真实后端需视 vite.config.ts 而定。
 * 这里直接使用传入的 url。
 */
export const createSSEConnection = <T>({ url, onMessage, onError, onOpen }: SSEOptions<T>) => {
  const eventSource = new EventSource(url);

  eventSource.onopen = (event) => {
    console.log(`SSE 连接成功: ${url}`);
    if (onOpen) onOpen(event);
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error('SSE 消息解析失败:', err, event.data);
    }
  };

  eventSource.onerror = (event) => {
    console.error(`SSE 连接错误: ${url}`, event);
    if (onError) onError(event);
    // 可选：在此处实现重连逻辑，不过原生的 EventSource 会自动尝试重连
  };

  // 返回清理函数
  return () => {
    console.log(`关闭 SSE 连接: ${url}`);
    eventSource.close();
  };
};
