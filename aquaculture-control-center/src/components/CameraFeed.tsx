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

/**
 * getCameraData
 * 功能：通过后端接口获取摄像头状态信息
 * 输入：cameraId 摄像头ID
 * 输出：CameraData 对象；如失败抛出异常
 * 关键逻辑：
 * - 使用相对路径 /api/cameras/:id/status，经由 Vite 代理转发到后端；避免浏览器跨域拦截
 * - GET 请求不设置 Content-Type，减少 CORS 预检的触发；保留 5 秒超时
 */
const getCameraData = async (cameraId: number): Promise<CameraData> => {
  // 通过相对路径交由 Vite 代理处理跨域
  const response = await fetch(`/api/cameras/${cameraId}/status`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
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
};

/**
 * 从API获取摄像头图片URL
 * @param cameraId 摄像头ID
 * @returns Promise<string> 图片URL或错误信息
 */
const fetchCameraImage = async (cameraId: number): Promise<string> => {
  try {
    // 使用相对路径并通过代理解决跨域；移除不必要的 Content-Type
    const response = await fetch(`/api/cameras/${cameraId}/image`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000), // 8秒超时，图片加载需要更长时间
    });

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error('摄像头离线');
      }
      throw new Error(`获取图片失败: ${response.status}`);
    }

    // 解析JSON响应
    const result = await response.json();
    
    if (result.success && result.data && result.data.imageUrl) {
      console.log('摄像头图片API调用成功:', result);
      // 直接返回API提供的图片URL
      return result.data.imageUrl;
    } else {
      throw new Error('API返回数据格式错误或缺少imageUrl');
    }
    
  } catch (error) {
    console.warn(`摄像头 ${cameraId} 图片获取失败:`, error);
    throw error;
  }
};

const CameraFeed: React.FC<CameraFeedProps> = ({ cameraId }) => {
  const [cameraData, setCameraData] = useState<CameraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // 加载摄像头数据
  const loadCameraData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCameraData(cameraId);
      setCameraData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载摄像头数据失败');
      console.error('加载摄像头数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载摄像头图片
  const loadCameraImage = async () => {
    if (!cameraData || cameraData.status !== '在线') {
      setImageUrl(null);
      setImageError('摄像头离线');
      return;
    }

    try {
      setImageLoading(true);
      setImageError(null);
      
      // 清理之前的URL（只有当它是ObjectURL时才需要revoke）
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      
      const newImageUrl = await fetchCameraImage(cameraId);
      setImageUrl(newImageUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : '加载图片失败');
      console.error('加载摄像头图片失败:', err);
    } finally {
      setImageLoading(false);
    }
  };

  // 初始化数据加载
  useEffect(() => {
    loadCameraData();
  }, [cameraId]);

  // 当摄像头数据更新后，加载图片
  useEffect(() => {
    if (cameraData) {
      loadCameraImage();
    }
  }, [cameraData]);

  // 定时更新数据和图片（每10分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      loadCameraData();
    }, 600000); // 10分钟更新一次

    return () => clearInterval(interval);
  }, [cameraId]);

  // 组件卸载时清理URL（只清理ObjectURL）
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // 如果数据还未加载，显示加载状态
  if (loading) {
    return (
      <div className="camera-feed loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>正在加载摄像头数据...</p>
        </div>
      </div>
    );
  }

  // 如果加载出错，显示错误信息
  if (error || !cameraData) {
    return (
      <div className="camera-feed error">
        <div className="error-message">
          <h3>⚠️ 加载失败</h3>
          <p>{error || '无法获取摄像头数据'}</p>
          <button onClick={loadCameraData} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );
  }

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
        <div className="image-container">
          {cameraData.status === '在线' ? (
            <div className="image-wrapper">
              {imageLoading && (
                <div className="image-loading-overlay">
                  <div className="spinner"></div>
                  <p>正在加载图片...</p>
                </div>
              )}
              
              {imageError && !imageLoading && (
                <div className="image-error-overlay">
                  <div className="error-content">
                    <span className="error-icon">📷</span>
                    <p>{imageError}</p>
                    <button 
                      onClick={loadCameraImage} 
                      className="retry-image-button"
                    >
                      重新加载图片
                    </button>
                  </div>
                </div>
              )}
              
              {imageUrl && !imageError && (
                <img
                  src={imageUrl}
                  alt={`摄像头 ${cameraId} 实时画面`}
                  className="camera-image"
                  onError={() => {
                    setImageError('图片加载失败');
                    console.error('图片显示错误');
                  }}
                  onLoad={() => {
                    console.log('图片加载成功');
                  }}
                />
              )}
              
              {/* 实时数据叠加层 */}
              <div className="overlay-info">
                <div className="overlay-item">
                  <span className="label">温度:</span>
                  <span className="value">
                    {cameraData.temperature ? `${cameraData.temperature.toFixed(1)}°C` : 'N/A'}
                  </span>
                </div>
                <div className="overlay-item">
                  <span className="label">连接:</span>
                  <span className="value">{cameraData.connectivity}%</span>
                </div>
                <div className="overlay-item">
                  <span className="label">FPS:</span>
                  <span className="value">{cameraData.fps}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="offline-placeholder">
              <div className="offline-content">
                <span className="offline-icon">📷</span>
                <h3>摄像头离线</h3>
                <p>设备当前不可用</p>
                <button onClick={loadCameraData} className="reconnect-button">
                  尝试重连
                </button>
              </div>
            </div>
          )}
        </div>
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
