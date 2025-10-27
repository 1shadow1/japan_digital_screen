import React, { useEffect, useState } from 'react';
import SensorChart from './components/SensorChart';
import CameraFeed from './components/CameraFeed';
import AIDecisionChat from './components/AIDecisionChat';
import DeviceStatus from './components/DeviceStatus';
import LocationInfo from './components/LocationInfo';
import { generateMockSensorData, generateMockAIMessages, generateMockDeviceStatus, generateMockLocationData } from './utils/mockData';
import './App.css';
import MicRecorderButton from './components/MicRecorderButton';

function App() {
  const [sensorData, setSensorData] = useState<any>({});
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 传感器类型定义
  const sensorTypes = [
    { id: 'temperature', name: '水温', unit: '°C', color: '#00a8cc', threshold: [18, 28] as [number, number] },
    { id: 'ph', name: 'pH值', unit: 'pH', color: '#41b3d3', threshold: [6.5, 8.5] as [number, number] },
    { id: 'oxygen', name: '溶解氧', unit: 'mg/L', color: '#20B2AA', threshold: [5, 12] as [number, number] },
    { id: 'ammonia', name: '氨氮', unit: 'mg/L', color: '#40E0D0', threshold: [0, 0.5] as [number, number] },
    { id: 'nitrite', name: '亚硝酸盐', unit: 'mg/L', color: '#0080b8', threshold: [0, 0.1] as [number, number] },
    { id: 'light', name: '光照强度', unit: 'lux', color: '#006994', threshold: [1000, 5000] as [number, number] },
    { id: 'level', name: '水位', unit: 'm', color: '#00a8cc', threshold: [1.5, 3.0] as [number, number] },
    { id: 'flow', name: '流量', unit: 'L/min', color: '#41b3d3', threshold: [50, 200] as [number, number] }
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

      {/* 右下角悬浮麦克风按钮 */}
      <MicRecorderButton />
    </div>
  );
}

export default App;