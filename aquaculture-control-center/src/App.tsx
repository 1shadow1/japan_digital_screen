import React, { useEffect, useState, useCallback } from 'react';
import SensorChart from './components/SensorChart';
import CameraFeed from './components/CameraFeed';
import AIDecisionChat from './components/AIDecisionChat';
import DeviceStatus from './components/DeviceStatus';
import LocationInfo from './components/LocationInfo';
import { generateMockDeviceStatus, generateMockLocationData } from './utils/mockData';
import { createSSEConnection } from './utils/requestSSE';
import './App.css';
import MicRecorderButton from './components/MicRecorderButton';
import AsrSubtitleOverlay from './components/AsrSubtitleOverlay';

// 摄像头列表接口类型
interface CameraListItem {
  id: number;
  name?: string;
  location?: string;
}

// 养殖池列表接口类型
interface PondListItem {
  id: number;
  name: string;
}

// 传感器类型配置映射（用于设置显示名称、单位、颜色、阈值等）
// 移到组件外部，避免每次渲染都创建新对象
const sensorTypeConfig: { [key: string]: { name: string; unit: string; color: string; threshold: [number, number] } } = {
  'temperature': { name: '水温', unit: '°C', color: '#00a8cc', threshold: [18, 28] },
  'ph': { name: 'pH值', unit: 'pH', color: '#41b3d3', threshold: [6.5, 8.5] },
  'do': { name: '溶解氧', unit: 'mg/L', color: '#20B2AA', threshold: [5, 12] },
  'turbidity': { name: '浊度', unit: 'NTU', color: '#41b3d3', threshold: [0, 50] },
  'water_level': { name: '水位', unit: 'mm', color: '#00a8cc', threshold: [800, 1000] },
};

function App() {
  const [pondList, setPondList] = useState<PondListItem[]>([]);
  const [selectedPondId, setSelectedPondId] = useState<number>(0);
  const [sensorData, setSensorData] = useState<any>({});
  const [sensorTypes, setSensorTypes] = useState<any[]>([]);
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [sensorPredictions, setSensorPredictions] = useState<Record<string, any>>({});
  const [cameraList, setCameraList] = useState<CameraListItem[]>([]);
  const [cameraRefreshTriggers, setCameraRefreshTriggers] = useState<Record<number, number>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [asrPartialText, setAsrPartialText] = useState<string>('');
  const [asrFinalText, setAsrFinalText] = useState<string>('');
  const [chatMsgs, setChatMsgs] = useState<Array<{ role: 'user' | 'assistant'; text: string; sessionId?: string; sequence?: number; ts: number }>>([])

  // 获取养殖池列表
  const fetchPondList = async () => {
    try {
      const response = await fetch('/api/v1/get_pond_list', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
      const result = await response.json();
      const list: PondListItem[] = Array.isArray(result) ? result : result.data;
      if (Array.isArray(list) && list.length > 0) {
        setPondList(list);
        if (!selectedPondId) {
          const defaultPond = list[3] || list[0];
          setSelectedPondId(defaultPond.id);
        }
      }
    } catch (error) {
      console.error('获取养殖池列表失败:', error);
    }
  };

  // 拉取静态/不常变动的 REST 数据
  const updateRestData = useCallback(async (pondId: number) => {
    generateMockDeviceStatus(pondId).then(newDeviceStatus => {
      setDeviceStatus(Array.isArray(newDeviceStatus) ? newDeviceStatus : []);
    }).catch(error => {
      console.error('更新设备状态失败:', error);
      setDeviceStatus([]);
    });

    generateMockLocationData(pondId).then(newLocationData => {
      setLocationData(Array.isArray(newLocationData) ? newLocationData : []);
    }).catch(error => {
      console.error('更新地理位置数据失败:', error);
      setLocationData([]);
    });
  }, []);

  // 初始加载养殖池列表
  useEffect(() => {
    fetchPondList();
  }, []);

  // 当养殖池选中后建立 SSE 连接和 REST 数据加载
  useEffect(() => {
    if (!selectedPondId) return;
    
    // 初始化并定时刷新 REST 数据 (设备状态、位置) 每小时一次
    updateRestData(selectedPondId);
    const interval = setInterval(() => updateRestData(selectedPondId), 3600000);

    // 建立传感器 SSE 连接 (累积历史数据用于图表)
    const cleanupSensors = createSSEConnection<any>({
      url: `/api/v1/ponds/${selectedPondId}/sensors/realtime?stream=true`,
      onMessage: (result) => {
        // SSE 返回可能直接是载荷对象，而没有 code/data 包装
        const payload = (result.code === 200 && result.data !== undefined) ? result.data : result;
        
        let items: any[] = [];
        if (payload.sensors && Array.isArray(payload.sensors)) {
          items = payload.sensors;
        } else if (Array.isArray(payload)) {
          items = payload;
        } else if (payload.sensorId || payload.id) {
          items = [payload];
        }

        if (items.length > 0) {
          setSensorData(prevData => {
            const newData = { ...prevData };
            
            items.forEach((item: any) => {
              const sensorId = (item.metric ? item.metric.toLowerCase() : null) || item.sensorId || item.id || item.device_id;
              if (!sensorId) return;
              
              if (!newData[sensorId]) {
                newData[sensorId] = item.history_points ? item.history_points.map((p: any) => ({
                  timestamp: p.timestamp,
                  value: p.value,
                  time: p.time || new Date(p.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                })) : [];
              }
              
              const ts = item.recorded_at ? new Date(item.recorded_at).getTime() : (item.timestamp || Date.now());
              const timeStr = new Date(ts).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
              
              const newPoint = { timestamp: ts, value: item.value, time: timeStr };
              
              // 仅当时间戳不重复时才推入，防止重复数据
              const lastPoint = newData[sensorId][newData[sensorId].length - 1];
              if (!lastPoint || lastPoint.timestamp !== newPoint.timestamp) {
                newData[sensorId] = [...newData[sensorId], newPoint].slice(-50);
              }

              if (item.prediction) {
                setSensorPredictions(prev => {
                  if (prev[sensorId] === item.prediction) return prev;
                  return { ...prev, [sensorId]: item.prediction };
                });
              }
            });
            return newData;
          });

          // 自动识别新出现的传感器类型
          setSensorTypes(prev => {
            const currentIds = new Set(prev.map(p => p.id));
            const newIds = items.map((i: any) => (i.metric ? i.metric.toLowerCase() : null) || i.sensorId || i.id || i.device_id).filter((id: string) => id && !currentIds.has(id));
            if (newIds.length === 0) return prev;
            
            const newTypes = newIds.filter((id: string) => sensorTypeConfig[id]).map((id: string) => ({ id, ...sensorTypeConfig[id] }));
            if (newTypes.length === 0) return prev;
            return [...prev, ...newTypes];
          });
        }
      }
    });

    // 建立摄像头 SSE 连接 (获取设备列表及状态更新)
    const cleanupCameras = createSSEConnection<any>({
      url: `/api/v1/ponds/${selectedPondId}/cameras/realtime?stream=true`,
      onMessage: (result) => {
        const payload = (result.code === 200 && result.data !== undefined) ? result.data : result;
        
        let camerasArr: any[] = [];
        if (payload.cameras && Array.isArray(payload.cameras)) {
          camerasArr = payload.cameras;
          setCameraList(payload.cameras);
        } else if (Array.isArray(payload)) {
          camerasArr = payload;
          setCameraList(payload);
        } else if (payload && (payload.id || payload.device_id || payload.camera_id)) {
          camerasArr = [payload];
          const actualId = payload.id || payload.device_id || payload.camera_id;
          // 增量更新则合并
          setCameraList(prev => {
            const idx = prev.findIndex(c => (c.id || (c as any).device_id || (c as any).camera_id) === actualId);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], ...payload };
              return next;
            }
            return [...prev, payload];
          });
        }

        if (camerasArr.length > 0) {
          setCameraRefreshTriggers(prev => {
            const next = { ...prev };
            camerasArr.forEach(c => {
              const cid = c.id || c.device_id || c.camera_id;
              if (cid !== undefined) next[cid] = Date.now();
            });
            return next;
          });
        }
      }
    });

    // 建立 AI 决策 SSE 连接 (实时更新消息)
    const cleanupAIDecisions = createSSEConnection<any>({
      url: `/api/v1/ponds/${selectedPondId}/ai-decisions/realtime?stream=true`,
      onMessage: (result) => {
        const payload = (result.code === 200 && result.data !== undefined) ? result.data : result;
        
        // 尝试从不同的可能字段里提取数组，或直接作为增量消息
        let items: any[] = [];
        if (payload.messages && Array.isArray(payload.messages)) {
          items = payload.messages;
        } else if (payload.decisions && Array.isArray(payload.decisions)) {
          items = payload.decisions;
        } else if (payload.ai_decisions && Array.isArray(payload.ai_decisions)) {
          items = payload.ai_decisions;
        } else if (Array.isArray(payload)) {
          items = payload;
        } else if (payload.id || payload.message || payload.text) {
          items = [payload];
        }

        if (items.length > 0) {
          setAiMessages(prev => [...prev, ...items].slice(-10));
        }
      }
    });

    return () => {
      clearInterval(interval);
      cleanupSensors();
      cleanupCameras();
      cleanupAIDecisions();
      // 清空当前养殖池的实时数据状态，避免旧数据残余
      setSensorData({});
      setSensorPredictions({});
      setAiMessages([]);
      setCameraList([]);
    };
  }, [selectedPondId, updateRestData]);

  // 每秒更新头部时间显示
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
        <div className="header-right">
          <select
            className="pond-selector"
            value={selectedPondId}
            onChange={(e) => setSelectedPondId(Number(e.target.value))}
          >
            {pondList.length === 0 ? (
              <option value={0}>加载中...</option>
            ) : (
              pondList.map(pond => (
                <option key={pond.id} value={pond.id}>{pond.name}</option>
              ))
            )}
          </select>
          <div className="system-time">{currentTime.toLocaleString('ja-JP')}</div>
        </div>
      </header>

      {/* 养殖区域信息独立行 */}
      <section className="location-section location-top">
        <LocationInfo locations={locationData} />
      </section>

      {/* 传感器独立行 */}
      <section className="sensor-section">
        <h2 className="section-title">传感器实时监控</h2>
        <div className="sensor-grid">
          {sensorTypes.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#cfefff', gridColumn: '1 / -1' }}>
              <div className="loading-spinner"></div>
              <p>正在加载传感器数据...</p>
            </div>
          ) : (
            sensorTypes.map(sensor => (
              <SensorChart
                key={sensor.id}
                sensorType={sensor}
                data={sensorData[sensor.id] || []}
                prediction={sensorPredictions[sensor.id]}
              />
            ))
          )}
        </div>
      </section>

      {/* 主要内容区域 */}
      <main className="app-main">
        {/* 左侧区域 */}
        <div className="left-panel">
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
              {cameraList.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#cfefff' }}>
                  <div className="loading-spinner"></div>
                  <p>正在加载摄像头列表...</p>
                </div>
              ) : (
                cameraList.map((camera: any, index: number) => {
                  const currId = camera.id || camera.device_id || camera.camera_id || index;
                  return <CameraFeed key={currId} pondId={selectedPondId} camera={camera} refreshTrigger={cameraRefreshTriggers[currId] || 0} />;
                })
              )}
            </div>
          </section>
        </div>

        {/* 右侧区域 */}
        <div className="right-panel">
          {/* AI决策窗口 */}
          <section className="ai-section">
            <AIDecisionChat messages={aiMessages} />
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
