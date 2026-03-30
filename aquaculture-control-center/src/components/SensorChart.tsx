import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import './SensorChart.css';

interface SensorChartProps {
  sensorType: {
    id: string;
    name: string;
    unit: string;
    color: string;
    threshold: [number, number];
  };
  data: Array<{
    timestamp: number;
    value: number;
    time: string;
  }>;
  prediction?: {
    trend: 'up' | 'down' | 'stable';
    predicted_value?: number;
    analysis_text?: string;
  };
}

const SensorChart: React.FC<SensorChartProps> = ({ sensorType, data, prediction }) => {
  const { currentValue, isAlert, calculatedTrend } = useMemo(() => {
    if (!data || data.length === 0) {
      return { currentValue: 0, isAlert: false, calculatedTrend: 'stable' };
    }
    
    const current = data[data.length - 1].value;
    const previous = data.length > 1 ? data[data.length - 2].value : current;
    const isOutOfThreshold = current < sensorType.threshold[0] || current > sensorType.threshold[1];
    
    let trendDirection = 'stable';
    if (Math.abs(current - previous) > 0.01) {
      trendDirection = current > previous ? 'up' : 'down';
    }
    
    return {
      currentValue: current,
      isAlert: isOutOfThreshold,
      calculatedTrend: trendDirection
    };
  }, [data, sensorType.threshold]);

  const activeTrend = prediction?.trend || calculatedTrend;

  const getTrendIcon = () => {
    switch (activeTrend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  const formatValue = (value: number) => {
    return Math.round(value * 10) / 10;
  };

  return (
    <div className={`sensor-chart ${isAlert ? 'alert' : ''}`}>
      {/* 传感器标题和当前值 */}
      <div className="sensor-header">
        <h3 className="sensor-name">{sensorType.name}</h3>
        <div className="sensor-value">
          <span className="current-value">
            {formatValue(currentValue)}
          </span>
          <span className="sensor-unit">{sensorType.unit}</span>
          <span className="trend-icon" title={prediction?.analysis_text}>{getTrendIcon()}</span>
        </div>
      </div>

      {/* 预测与分析 */}
      {prediction && prediction.predicted_value !== undefined && (
        <div className="prediction-info" style={{ fontSize: '11px', color: '#88d7f4', marginBottom: '4px' }}>
          预测值: {formatValue(prediction.predicted_value)} {sensorType.unit} ({prediction.trend === 'up' ? '上升' : prediction.trend === 'down' ? '下降' : '平稳'})
        </div>
      )}

      {/* 阈值显示 */}
      <div className="threshold-info">
        <span className="threshold-range">
          阈值: {sensorType.threshold[0]} - {sensorType.threshold[1]} {sensorType.unit}
        </span>
        {isAlert && (
          <span className="alert-badge">超阈</span>
        )}
      </div>

      {/* 折线图 */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(65, 179, 211, 0.2)" />
            <XAxis 
              dataKey="time" 
              stroke="#41b3d3" 
              fontSize={10}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#41b3d3" 
              fontSize={10}
              domain={['dataMin - 1', 'dataMax + 1']}
              tickFormatter={(v: number) => Math.round(v * 10) / 10 + ''}
            />
            {/* 阈值线 */}
            <ReferenceLine 
              y={sensorType.threshold[0]} 
              stroke="#ff6b35" 
              strokeDasharray="5 5" 
              opacity={0.7}
            />
            <ReferenceLine 
              y={sensorType.threshold[1]} 
              stroke="#ff6b35" 
              strokeDasharray="5 5" 
              opacity={0.7}
            />
            {/* 数据线 */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={sensorType.color}
              strokeWidth={2}
              dot={{ fill: sensorType.color, r: 2 }}
              activeDot={{ r: 4, fill: sensorType.color }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 报警效果 */}
      {isAlert && <div className="alert-pulse"></div>}
    </div>
  );
};

export default SensorChart;