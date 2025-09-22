import React, { useState, useEffect } from 'react';
import './CameraFeed.css';

interface CameraFeedProps {
  cameraId: number;
}

// 模拟摄像头数据生成
// API替换指南：
// 1. 实时图像流：WebSocket连接 ws://api-server/camera-feed/:id
// 2. 快照接口：GET /api/cameras/:id/snapshot
// 3. 摄像头状态：GET /api/cameras/:id/status
const generateMockCameraData = (cameraId: number) => {
  const locations = [
    '主养殖区东北角',
    '投食区中心位置',
    '过滤设备附近',
    '南侧水体监控',
    '应急备用区域'
  ];
  
  const status = Math.random() > 0.9 ? '离线' : '在线';
  const quality = Math.random() > 0.8 ? '低' : Math.random() > 0.5 ? '中' : '高';
  
  return {
    id: cameraId,
    name: `监控摄像头-${cameraId}`,
    location: locations[cameraId - 1],
    status,
    quality,
    resolution: '1920x1080',
    fps: status === '在线' ? Math.floor(Math.random() * 30) + 10 : 0,
    lastUpdate: new Date().toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  };
};

const CameraFeed: React.FC<CameraFeedProps> = ({ cameraId }) => {
  const [cameraData, setCameraData] = useState(() => generateMockCameraData(cameraId));
  const [imageError, setImageError] = useState(false);

  // 模拟数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCameraData(generateMockCameraData(cameraId));
    }, 5000 + Math.random() * 5000); // 5-10秒间隔更新

    return () => clearInterval(interval);
  }, [cameraId]);

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
            <div className="offline-time">最后在线: {cameraData.lastUpdate}</div>
          </div>
        )}
      </div>

      {/* 技术参数 */}
      <div className="camera-footer">
        <div className="tech-info">
          <span className="resolution">{cameraData.resolution}</span>
          <span className="separator">|</span>
          <span className="update-time">{cameraData.lastUpdate}</span>
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;