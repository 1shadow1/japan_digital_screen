import React, { useState } from 'react';
import './DeviceStatus.css';

interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  statusColor: string;
  parameters: Record<string, any>;
  lastUpdate: number;
  lastUpdateTime: string;
}

interface DeviceStatusProps {
  devices: Device[];
}

const DeviceStatus: React.FC<DeviceStatusProps> = ({ devices }) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 过滤和搜索设备
  const filteredDevices = devices.filter(device => {
    const matchesFilter = filter === 'all' || device.status === filter;
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // 获取设备类型图标
  const getDeviceIcon = (type: string) => {
    const icons = {
      'aerator': '💨',
      'filter': '🌊', 
      'feeder': '🍽️',
      'pump': '⚡',
      'sterilizer': '✨',
      'generator': '🔋',
      'monitor': '💻'
    };
    return icons[type as keyof typeof icons] || '💻';
  };

  // 获取状态统计
  const getStatusStats = () => {
    const stats = devices.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: devices.length,
      running: stats['运行中'] || 0,
      standby: stats['待机'] || 0,
      maintenance: stats['维护中'] || 0,
      error: stats['故障'] || 0
    };
  };

  const stats = getStatusStats();

  return (
    <div className="device-status">
      {/* 设备状态头部 */}
      <div className="device-header">
        <h2 className="section-title">设备状态监控</h2>
        
        {/* 状态统计 */}
        <div className="status-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">总设备</span>
          </div>
          <div className="stat-card running">
            <span className="stat-number">{stats.running}</span>
            <span className="stat-label">运行中</span>
          </div>
          <div className="stat-card error">
            <span className="stat-number">{stats.error}</span>
            <span className="stat-label">故障</span>
          </div>
        </div>
      </div>

      {/* 过滤和搜索控件 */}
      <div className="device-controls">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          <button 
            className={`filter-btn ${filter === '运行中' ? 'active' : ''}`}
            onClick={() => setFilter('运行中')}
          >
            运行中
          </button>
          <button 
            className={`filter-btn ${filter === '故障' ? 'active' : ''}`}
            onClick={() => setFilter('故障')}
          >
            故障
          </button>
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索设备..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="search-icon">🔍</div>
        </div>
      </div>

      {/* 设备列表 */}
      <div className="device-list">
        {filteredDevices.length === 0 ? (
          <div className="no-devices">
            <div className="no-devices-icon">🔍</div>
            <p>未找到匹配的设备</p>
          </div>
        ) : (
          filteredDevices.map(device => (
            <div key={device.id} className={`device-item ${device.status.replace(/\s+/g, '-').toLowerCase()}`}>
              {/* 设备基本信息 */}
              <div className="device-main">
                <div className="device-icon">
                  {getDeviceIcon(device.type)}
                </div>
                <div className="device-info">
                  <h4 className="device-name">{device.name}</h4>
                  <div className="device-meta">
                    <span className="device-type">{device.type}</span>
                    <span className="separator">|</span>
                    <span className="last-update">{device.lastUpdateTime}</span>
                  </div>
                </div>
                <div className="device-status-indicator">
                  <div 
                    className="status-dot" 
                    style={{ backgroundColor: device.statusColor }}
                  ></div>
                  <span className="status-text" style={{ color: device.statusColor }}>
                    {device.status}
                  </span>
                </div>
              </div>

              {/* 设备参数 */}
              <div className="device-parameters">
                {Object.entries(device.parameters).map(([key, value]) => (
                  <div key={key} className="parameter-item">
                    <span className="parameter-key">{key}:</span>
                    <span className="parameter-value">
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                  </div>
                ))}
              </div>

              {/* 状态指示器 */}
              <div className="device-status-bar">
                <div 
                  className="status-fill" 
                  style={{ backgroundColor: device.statusColor }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeviceStatus;