import React, { useState, useEffect } from 'react';
import './CameraFeed.css';

interface CameraFeedProps {
  cameraId: number;
}

interface CameraData {
  id: number;
  name: string;
  location: string;
  status: string;
  quality: string;
  resolution: string;
  fps: number;
  lastUpdate: number;
  lastUpdateTime: string;
  temperature: number | null;
  connectivity: number;
  recording: boolean;
  nightVision: boolean;
  motionDetection: boolean;
}

// 生成摄像头数据 - 从API获取真实数据
const generateMockCameraData = async (cameraId: number): Promise<CameraData> => {
  try {
    // 调用本地API获取摄像头状态数据
    const response = await fetch(`http://8.216.33.92:5002/api/cameras/${cameraId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      // 将API数据转换为前端需要的格式
      const apiData = result.data;
      return {
        id: apiData.id,
        name: apiData.name,
        location: apiData.location,
        status: apiData.status,
        quality: apiData.quality,
        resolution: apiData.resolution,
        fps: apiData.fps,
        lastUpdate: apiData.lastUpdate,
        lastUpdateTime: apiData.lastUpdateTime,
        temperature: apiData.temperature,
        connectivity: apiData.connectivity,
        recording: apiData.recording,
        nightVision: apiData.nightVision,
        motionDetection: apiData.motionDetection
      };
    } else {
      throw new Error('API返回数据格式错误');
    }
  } catch (error) {
    console.warn('API调用失败，使用备用数据:', error);
    
    // 备用数据生成逻辑（保持原有的模拟数据逻辑）
    const locations = [
      '主养殖区东北角',
      '投食区中心位置', 
      '过滤设备附近',
      '南侧水体监控',
      '应急备用区域',
      '北侧深水区',
      '中央监控点',
      '西侧浅水区'
    ];
    
    const statuses = ['在线', '离线'];
    const qualities = ['高', '中', '低'];
    
    const isOnline = Math.random() > 0.1; // 90%在线率
    const status = isOnline ? '在线' : '离线';
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    
    return {
      id: cameraId,
      name: `监控摄像头-${cameraId}`,
      location: locations[(cameraId - 1) % locations.length],
      status: status,
      quality: quality,
      resolution: '1920x1080',
      fps: isOnline ? Math.floor(Math.random() * 21) + 10 : 0, // 10-30 fps
      lastUpdate: Date.now(),
      lastUpdateTime: new Date().toLocaleTimeString(),
      temperature: isOnline ? 22.0 + (Math.random() - 0.5) * 6 : null,
      connectivity: isOnline ? Math.floor(Math.random() * 16) + 85 : 0, // 85-100%
      recording: isOnline && Math.random() > 0.2,
      nightVision: Math.random() > 0.5,
      motionDetection: isOnline && Math.random() > 0.3
    };
  }
};

const CameraFeed: React.FC<CameraFeedProps> = ({ cameraId }) => {
  const [cameraData, setCameraData] = useState<CameraData | null>(null);
  const [imageError, setImageError] = useState(false);

  // 初始化数据加载
  useEffect(() => {
    const loadCameraData = async () => {
      try {
        const data = await generateMockCameraData(cameraId);
        setCameraData(data);
      } catch (error) {
        console.error('加载摄像头数据失败:', error);
      }
    };
    
    loadCameraData();
  }, [cameraId]);

  // 模拟数据更新
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await generateMockCameraData(cameraId);
        setCameraData(data);
      } catch (error) {
        console.error('更新摄像头数据失败:', error);
      }
    // }, 5000 + Math.random() * 5000); // 5-10秒间隔更新
    }, 3600000); // 每3600秒更新一次

    return () => clearInterval(interval);
  }, [cameraId]);

  // 如果数据还未加载，显示加载状态
  if (!cameraData) {
    return (
      <div className="camera-feed loading">
        <div className="loading-text">加载摄像头数据中...</div>
      </div>
    );
  }

  // 模拟图像数据（使用Canvas生成模拟水下的景象）
  const generateMockImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d')!;
    
    // 渐变背景（模拟水下环境）
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, '#006994');
    gradient.addColorStop(0.5, '#0080b8');
    gradient.addColorStop(1, '#001f3f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 320, 180);
    
    // 模拟鱼类或气泡
    const particleCount = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * 320;
      const y = Math.random() * 180;
      const size = Math.random() * 8 + 2;
      const alpha = Math.random() * 0.7 + 0.3;
      
      ctx.fillStyle = `rgba(65, 179, 211, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 添加数字标识
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px monospace';
    ctx.fillText(`CAM-${cameraId.toString().padStart(2, '0')}`, 10, 25);
    ctx.fillText(new Date().toLocaleTimeString('ja-JP'), 10, 45);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const mockImageUrl = generateMockImage();

  return (
    <div className={`camera-feed ${cameraData.status === '离线' ? 'offline' : ''}`}>
      {/* 摄像头信息头部 */}
      <div className="camera-header">
        <div className="camera-info">
          <h4 className="camera-name">{cameraData.name}</h4>
          <span className="camera-location">{cameraData.location}</span>
        </div>
        <div className="camera-status">
          <span className={`status-indicator ${cameraData.status === '在线' ? 'online' : 'offline'}`}>
            {cameraData.status}
          </span>
        </div>
      </div>

      {/* 图像显示区域 */}
      <div className="camera-display">
        {cameraData.status === '在线' ? (
          <div className="image-container">
            {!imageError ? (
              <img
                src={mockImageUrl}
                alt={`摄像头 ${cameraId} 实时画面`}
                onError={() => setImageError(true)}
                className="camera-image"
              />
            ) : (
              <div className="image-placeholder">
                <div className="placeholder-icon">📷</div>
                <div className="placeholder-text">正在加载...</div>
              </div>
            )}
            {/* 实时数据叠加层 */}
            <div className="camera-overlay">
              <div className="recording-indicator">
                <div className="recording-dot"></div>
                <span>REC</span>
              </div>
              <div className="camera-params">
                <div className="param">{cameraData.quality} | {cameraData.fps}fps</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="offline-display">
            <div className="offline-icon">⚠️</div>
            <div className="offline-text">摄像头离线</div>
            <div className="offline-time">最后在线: {cameraData.lastUpdateTime}</div>
          </div>
        )}
      </div>

      {/* 技术参数 */}
      <div className="camera-footer">
        <div className="tech-info">
          <span className="resolution">{cameraData.resolution}</span>
          <span className="separator">|</span>
          <span className="update-time">{cameraData.lastUpdateTime}</span>
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;