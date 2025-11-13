import React, { useEffect, useState, useCallback } from 'react';
import SensorChart from './components/SensorChart';
import CameraFeed from './components/CameraFeed';
import AIDecisionChat from './components/AIDecisionChat';
import DeviceStatus from './components/DeviceStatus';
import LocationInfo from './components/LocationInfo';
import { generateMockSensorData, generateMockAIMessages, generateMockDeviceStatus, generateMockLocationData } from './utils/mockData';
import './App.css';
import MicRecorderButton from './components/MicRecorderButton';
import AsrSubtitleOverlay from './components/AsrSubtitleOverlay';

function App() {
  const [sensorData, setSensorData] = useState<any>({});
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [asrPartialText, setAsrPartialText] = useState<string>('');
  const [asrFinalText, setAsrFinalText] = useState<string>('');
  // 语音对话消息列表（用于“用户/助手”消息展示）
  const [chatMsgs, setChatMsgs] = useState<Array<{ role: 'user' | 'assistant'; text: string; sessionId?: string; sequence?: number; ts: number }>>([])

  // 传感器类型定义
  const sensorTypes = [
    { id: 'temperature', name: '水温', unit: '°C', color: '#00a8cc', threshold: [18, 28] as [number, number] },
    { id: 'ph', name: 'pH值', unit: 'pH', color: '#41b3d3', threshold: [6.5, 8.5] as [number, number] },
    { id: 'oxygen', name: '溶解氧', unit: 'mg/L', color: '#20B2AA', threshold: [5, 12] as [number, number] },
    { id: 'turbidity', name: '浊度', unit: 'NTU', color: '#41b3d3', threshold: [0, 50] as [number, number] },
    // { id: 'level', name: '水位', unit: 'm', color: '#00a8cc', threshold: [1.5, 3.0] as [number, number] },
    
  ];

  // 模拟实时数据更新
  useEffect(() => {
    const updateData = async () => {
      try {
        // 异步调用传感器数据API
        const newSensorData = await generateMockSensorData(sensorTypes);
        setSensorData(newSensorData);
      } catch (error) {
        console.error('更新传感器数据失败:', error);
      }
      
      // 异步调用AI消息API
      generateMockAIMessages().then(newMessages => {
        setAiMessages(prev => {
          return [...prev, ...newMessages].slice(-10); // 保持最新50条消息
        });
      }).catch(error => {
        console.error('更新AI消息失败:', error);
      });
      
      // 异步调用设备状态API
      generateMockDeviceStatus().then(newDeviceStatus => {
        setDeviceStatus(Array.isArray(newDeviceStatus) ? newDeviceStatus : []);
      }).catch(error => {
        console.error('更新设备状态失败:', error);
        setDeviceStatus([]); // 确保在错误情况下也设置为空数组
      });
      
      // 异步调用地理位置数据API
      generateMockLocationData().then(newLocationData => {
        setLocationData(Array.isArray(newLocationData) ? newLocationData : []);
      }).catch(error => {
        console.error('更新地理位置数据失败:', error);
        setLocationData([]); // 确保在错误情况下也设置为空数组
      });
      
      setCurrentTime(new Date());
    };

    // 初始数据
    updateData();
    
    // 定期更新数据
    const interval = setInterval(updateData, 3600000); // 每3600秒更新一次
    
    return () => clearInterval(interval);
  }, []);

  /**
   * 处理 MicRecorderButton 组件通过 onDialog 上抛的“对话消息”（用户/助手）
   * 输入：msg（包含 role、text、sessionId、sequence）
   * 输出：更新 chatMsgs，用于右侧“语音对话”区的展示
   * 关键逻辑：
   * - 用户消息（role='user'）：直接在列表末尾追加
   * - 助手消息（role='assistant'）：
   *   - 若与列表末尾的助手消息处于同一回复流（依据 sequence，相同或未提供），则更新末尾消息的文本，实现“流式累积展示”；
   *   - 否则追加新的助手消息条目，开始新的回复段。
   */
  const handleDialog = useCallback((msg: { role: 'user' | 'assistant'; text: string; sessionId?: string; sequence?: number }) => {
    setChatMsgs(prev => {
      const ts = Date.now()
      // 仅保留最近 50 条，避免无限增长
      const cap = (arr: typeof prev) => (arr.length > 50 ? arr.slice(arr.length - 50) : arr)

      if (msg.role === 'assistant') {
        const last = prev[prev.length - 1]
        const sameSeq = typeof msg.sequence === 'number' && last && last.role === 'assistant' && last.sequence === msg.sequence
        const unknownSeqAppend = typeof msg.sequence !== 'number' && last && last.role === 'assistant' && typeof last.sequence !== 'number'
        if (sameSeq || unknownSeqAppend) {
          // 更新末尾助手消息，实现流式展示
          const updated = [...prev]
          updated[updated.length - 1] = { ...last, text: msg.text, ts, sessionId: msg.sessionId, sequence: msg.sequence }
          return cap(updated)
        }
        // 追加新的助手消息
        return cap([...prev, { role: 'assistant', text: msg.text, sessionId: msg.sessionId, sequence: msg.sequence, ts }])
      }

      // 用户消息：直接追加
      return cap([...prev, { role: 'user', text: msg.text, sessionId: msg.sessionId, sequence: msg.sequence, ts }])
    })
  }, [])

  return (
    <div className="app-container">
      {/* 主标题 */}
      <header className="app-header">
        <h1 className="app-title">日本陆上养殖生产管理AI控制中心</h1>
        <div className="system-time">{currentTime.toLocaleString('ja-JP')}</div>
      </header>

      {/* 主要内容区域 */}
      <main className="app-main">
        {/* 左侧区域 */}
        <div className="left-panel">
          {/* 传感器数据区域 */}
          <section className="sensor-section">
            <h2 className="section-title">传感器实时监控</h2>
            <div className="sensor-grid">
              {sensorTypes.map(sensor => (
                <SensorChart
                  key={sensor.id}
                  sensorType={sensor}
                  data={sensorData[sensor.id] || []}
                />
              ))}
            </div>
          </section>

          {/* 设备状态列表 */}
          <section className="device-section">
            <DeviceStatus devices={deviceStatus} />
          </section>
        </div>

        {/* 中间区域 */}
        <div className="center-panel">
          {/* 图像采集区域 */}
          <section className="camera-section">
            <h2 className="section-title">实时图像监控</h2>
            <div className="camera-grid">
              {Array.from({ length: 5 }, (_, i) => (
                <CameraFeed key={i} cameraId={i + 1} />
              ))}
            </div>
          </section>
        </div>

        {/* 右侧区域 */}
        <div className="right-panel">
          {/* AI决策窗口 */}
          <section className="ai-section">
            <AIDecisionChat messages={aiMessages} />
          </section>

          {/* 地理位置信息 */}
          <section className="location-section">
            <LocationInfo locations={locationData} />
          </section>
        </div>
      </main>

      {/* 字幕叠加层：显示实时/最终识别文本 */}
      <AsrSubtitleOverlay partialText={asrPartialText} finalText={asrFinalText} />

      {/* 右侧：语音对话简单列表（用户/助手） */}
      <section className="chat-section" style={{ position: 'absolute', right: 16, bottom: 96, width: 360 }}>
        <h2 className="section-title">语音对话</h2>
        <div className="chat-list" style={{ maxHeight: 240, overflowY: 'auto', padding: '8px 12px', background: 'rgba(0,31,63,0.35)', borderRadius: 12 }}>
          {chatMsgs.map((m, i) => (
            <div key={i} className={`chat-item ${m.role}`} style={{ margin: '6px 0', color: '#cfefff' }}>
              <span className="chat-role" style={{ fontWeight: 600, marginRight: 6 }}>{m.role === 'user' ? '用户' : '助手'}：</span>
              <span className="chat-text" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 右下角悬浮麦克风按钮 */}
      <MicRecorderButton
        onPartial={(t) => setAsrPartialText(t)}
        onFinal={(t) => { setAsrPartialText(''); setAsrFinalText(t); }}
        // 接入对话消息：将“用户/助手”消息展示到右侧“语音对话”区
        onDialog={(m) => handleDialog(m)}
      />
    </div>
  );
}

export default App;