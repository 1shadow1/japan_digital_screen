import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const listRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const directionRef = useRef<1 | -1>(1);
  const waitTimerRef = useRef<number>(0);

  // 获取所有区域
  const regions = Array.from(new Set(locations.map(loc => loc.region)));

  // 过滤
  const filteredLocations = locations
    .filter(location => selectedRegion === 'all' || location.region === selectedRegion);

  // 自动滚动（到两端停顿后反向）
  const autoScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || pausedRef.current) {
      rafRef.current = requestAnimationFrame(autoScroll);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      rafRef.current = requestAnimationFrame(autoScroll);
      return;
    }

    if (waitTimerRef.current > 0) {
      waitTimerRef.current--;
      rafRef.current = requestAnimationFrame(autoScroll);
      return;
    }

    el.scrollLeft += 0.5 * directionRef.current;

    if (el.scrollLeft >= maxScroll) {
      el.scrollLeft = maxScroll;
      directionRef.current = -1;
      waitTimerRef.current = 120; // ~2秒 @60fps
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft = 0;
      directionRef.current = 1;
      waitTimerRef.current = 120;
    }

    rafRef.current = requestAnimationFrame(autoScroll);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(rafRef.current);
  }, [autoScroll]);

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
      {/* 头部：标题 + 区域筛选 */}
      <div className="location-header">
        <h2 className="section-title">养殖区域信息</h2>
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
      </div>

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

      {/* 位置列表 */}
      <div
        className="location-list"
        ref={listRef}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {filteredLocations.map(location => (
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
                  <span className="detail-label">虾量：</span>
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