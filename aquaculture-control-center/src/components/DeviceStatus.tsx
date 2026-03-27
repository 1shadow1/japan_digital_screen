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

// 判断设备是否在线（仅 online / 运行中 视为在线，其余均归为离线）
const isDeviceOnline = (device: Device) => {
  const s = (device.status || '').toLowerCase();
  return s === 'online' || device.status === '运行中';
};

const FAULT_STATUS_COLOR = '#e74c3c';

const DeviceStatus: React.FC<DeviceStatusProps> = ({ devices }) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());

  const toggleExpand = (deviceId: string) => {
    setExpandedDevices(prev => {
      const next = new Set(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }
      return next;
    });
  };

  // 过滤和搜索设备（离线 = 非 online 的设备）
  const filteredDevices = devices.filter(device => {
    const isOnline = isDeviceOnline(device);
    const matchesFilter =
      filter === 'all' ||
      (filter === '运行中' && isOnline) ||
      (filter === '离线' && !isOnline);
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

  // 获取状态统计：非 online 的均计入离线
  const getStatusStats = () => {
    const running = devices.filter(isDeviceOnline).length;
    const error = devices.length - running;
    return {
      total: devices.length,
      running,
      error
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
            <span className="stat-label">离线</span>
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
            className={`filter-btn ${filter === '离线' ? 'active' : ''}`}
            onClick={() => setFilter('离线')}
          >
            离线
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
          filteredDevices.map(device => {
            const online = isDeviceOnline(device);
            const displayStatus = online ? device.status : '离线';
            const displayColor = online ? device.statusColor : FAULT_STATUS_COLOR;
            return (
            <div key={device.id} className={`device-item ${online ? device.status.replace(/\s+/g, '-').toLowerCase() : 'error'}`}>
              {/* 设备基本信息 */}
              <div className="device-main" onClick={() => toggleExpand(device.id)}>
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
                    style={{ backgroundColor: displayColor }}
                  ></div>
                  <span className="status-text" style={{ color: displayColor }}>
                    {displayStatus}
                  </span>
                </div>
                <span className={`expand-arrow ${expandedDevices.has(device.id) ? 'expanded' : ''}`}>▸</span>
              </div>

              {/* 设备参数（默认折叠） */}
              {expandedDevices.has(device.id) && (
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
              )}

              {/* 状态指示器 */}
              <div className="device-status-bar">
                <div 
                  className="status-fill" 
                  style={{ backgroundColor: displayColor }}
                ></div>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DeviceStatus;