import React, { useState } from 'react';
import './LocationInfo.css';

interface Location {
  id: string;
  name: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  area: number;
  status: string;
  statusColor: string;
  fishCount: number;
  waterDepth: string;
  lastInspection: string;
  coordinates_str: string;
}

interface LocationInfoProps {
  locations: Location[];
}

const LocationInfo: React.FC<LocationInfoProps> = ({ locations }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'area' | 'fishCount'>('name');

  // 获取所有区域
  const regions = Array.from(new Set(locations.map(loc => loc.region)));

  // 过滤和排序
  const filteredAndSortedLocations = locations
    .filter(location => selectedRegion === 'all' || location.region === selectedRegion)
    .sort((a, b) => {
      switch (sortBy) {
        case 'area':
          return b.area - a.area;
        case 'fishCount':
          return b.fishCount - a.fishCount;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // 获取区域统计
  const getRegionStats = () => {
    return regions.map(region => {
      const regionLocations = locations.filter(loc => loc.region === region);
      const totalArea = regionLocations.reduce((sum, loc) => sum + loc.area, 0);
      const totalFish = regionLocations.reduce((sum, loc) => sum + loc.fishCount, 0);
      const normalStatus = regionLocations.filter(loc => loc.status === '正常运行').length;
      
      return {
        region,
        count: regionLocations.length,
        totalArea,
        totalFish,
        normalStatus,
        healthRate: ((normalStatus / regionLocations.length) * 100).toFixed(1)
      };
    });
  };

  const regionStats = getRegionStats();

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    const icons = {
      '正常运行': '✅',
      '投食中': '🍽️',
      '清洁中': '🧧',
      '检修中': '🔧'
    };
    return icons[status as keyof typeof icons] || '📍';
  };

  return (
    <div className="location-info">
      {/* 地理位置信息头部 */}
      <div className="location-header">
        <h2 className="section-title">养殖区域信息</h2>
        
        {/* 区域统计概览 */}
        <div className="region-overview">
          {regionStats.map(stat => (
            <div key={stat.region} className="region-stat">
              <div className="region-name">{stat.region}</div>
              <div className="region-metrics">
                <span className="metric">{stat.count}个池</span>
                <span className="metric">{stat.healthRate}%正常</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 控制面板 */}
      <div className="location-controls">
        <div className="region-filter">
          <label htmlFor="region-select">区域：</label>
          <select
            id="region-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="region-select"
          >
            <option value="all">全部区域</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        
        <div className="sort-options">
          <label htmlFor="sort-select">排序：</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'area' | 'fishCount')}
            className="sort-select"
          >
            <option value="name">名称</option>
            <option value="area">面积</option>
            <option value="fishCount">鱼类数量</option>
          </select>
        </div>
      </div>

      {/* 位置列表 */}
      <div className="location-list">
        {filteredAndSortedLocations.map(location => (
          <div key={location.id} className="location-item">
            {/* 位置基本信息 */}
            <div className="location-main">
              <div className="location-identity">
                <h4 className="location-name">{location.name}</h4>
                <span className="location-region">{location.region}</span>
              </div>
              
              <div className="location-status">
                <div className="status-indicator">
                  <span className="status-icon">{getStatusIcon(location.status)}</span>
                  <span className="status-text" style={{ color: location.statusColor }}>
                    {location.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 位置详细信息 */}
            <div className="location-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">面积：</span>
                  <span className="detail-value">{location.area.toLocaleString()} m²</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">鱼量：</span>
                  <span className="detail-value">{location.fishCount.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">水深：</span>
                  <span className="detail-value">{location.waterDepth} m</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">检查：</span>
                  <span className="detail-value">{location.lastInspection}</span>
                </div>
              </div>
              
              {/* 坐标信息 */}
              <div className="coordinates-info">
                <div className="coordinates-label">📍 坐标：</div>
                <div className="coordinates-value" title="点击复制坐标">
                  {location.coordinates_str}
                </div>
              </div>
            </div>

            {/* 状态指示条 */}
            <div className="location-status-bar">
              <div 
                className="status-fill" 
                style={{ backgroundColor: location.statusColor }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationInfo;