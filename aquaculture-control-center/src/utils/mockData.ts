// 模拟数据生成工具
// 注意：这些是演示用的模拟数据，实际部署时需要替换为真实的API接口

/**
 * API接口替换指南：
 * 
 * 1. 传感器数据接口
 * - 替换函数：generateMockSensorData
 * - 建议API端点：GET /api/sensors/realtime
 * - 数据格式：{ sensorId: string, timestamp: number, value: number }
 * 
 * 2. AI决策消息接口
 * - 替换函数：generateMockAIMessages
 * - 建议API端点：GET /api/ai/decisions/recent
 * - 数据格式：{ id: string, timestamp: number, type: string, message: string, action?: string }
 * 
 * 3. 设备状态接口
 * - 替换函数：generateMockDeviceStatus
 * - 建议API端点：GET /api/devices/status
 * - 数据格式：{ id: string, name: string, status: string, parameters: object, lastUpdate: number }
 * 
 * 4. 地理位置数据接口
 * - 替换函数：generateMockLocationData
 * - 建议API端点：GET /api/locations/ponds
 * - 数据格式：{ id: string, name: string, coordinates: [number, number], area: number, status: string }
 * 
 * 5. 摄像头画面接口
 * - 替换函数：generateMockCameraData (在CameraFeed组件中)
 * - 建议API端点：GET /api/cameras/:id/snapshot
 * - 或WebSocket连接：ws://api-server/camera-feed/:id
 */

// 生成随机数据的辅助函数
const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// 传感器数据生成
export const generateMockSensorData = (sensorTypes: any[]) => {
  const now = Date.now();
  const data: any = {};
  
  sensorTypes.forEach(sensor => {
    // 生成最近30个数据点（每个点间隔2分钟）
    const points = [];
    for (let i = 29; i >= 0; i--) {
      const timestamp = now - (i * 2 * 60 * 1000); // 2分钟间隔
      let value;
      
      // 根据传感器类型生成合理的数据
      switch (sensor.id) {
        case 'temperature':
          value = randomBetween(20, 26) + Math.sin(i * 0.1) * 2;
          break;
        case 'ph':
          value = randomBetween(7.0, 7.8) + Math.sin(i * 0.15) * 0.3;
          break;
        case 'oxygen':
          value = randomBetween(6, 9) + Math.sin(i * 0.2) * 1;
          break;
        case 'ammonia':
          value = randomBetween(0.1, 0.3) + Math.sin(i * 0.05) * 0.1;
          break;
        case 'nitrite':
          value = randomBetween(0.02, 0.08) + Math.sin(i * 0.1) * 0.02;
          break;
        case 'light':
          value = randomBetween(2000, 4000) + Math.sin(i * 0.3) * 500;
          break;
        case 'level':
          value = randomBetween(2.0, 2.5) + Math.sin(i * 0.05) * 0.2;
          break;
        case 'flow':
          value = randomBetween(80, 150) + Math.sin(i * 0.1) * 20;
          break;
        default:
          value = randomBetween(0, 100);
      }
      
      points.push({
        timestamp,
        value: Math.max(0, value),
        time: new Date(timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    data[sensor.id] = points;
  });
  
  return data;
};

// AI决策消息生成
export const generateMockAIMessages = () => {
  const messageTypes = [
    { type: 'analysis', icon: '🔍', color: '#00a8cc' },
    { type: 'warning', icon: '⚠️', color: '#ff6b35' },
    { type: 'action', icon: '🎯', color: '#20B2AA' },
    { type: 'optimization', icon: '⚡', color: '#41b3d3' }
  ];
  
  const messages = [
    { type: 'analysis', text: '检测到1号池塘pH值轻微下降，建议监控', action: '持续观察pH变化趋势' },
    { type: 'warning', text: '3号池塘溶解氧浓度接近临界值', action: '启动增氧设备' },
    { type: 'action', text: '基于历史数据，调整投食量至最优配比', action: '投食量减少15%' },
    { type: 'optimization', text: '水质参数稳定，建议维持当前管理策略', action: '保持现状' },
    { type: 'analysis', text: '温度传感器显示昼夜温差适宜鱼类生长', action: '无需调整' },
    { type: 'warning', text: '检测到2号池塘水位下降', action: '检查进水阀门' },
    { type: 'action', text: 'AI模型预测未来6小时天气变化', action: '准备应对降温措施' },
    { type: 'optimization', text: '能耗优化：夜间模式已自动启动', action: '设备功率降低30%' }
  ];
  
  // 随机返回1-2条新消息
  const numMessages = Math.random() > 0.7 ? 2 : 1;
  const selectedMessages = [];
  
  for (let i = 0; i < numMessages; i++) {
    const message = randomChoice(messages);
    const messageType = messageTypes.find(t => t.type === message.type) || messageTypes[0];
    
    selectedMessages.push({
      id: `msg_${Date.now()}_${i}`,
      timestamp: Date.now() - (i * 30000), // 30秒间隔
      type: message.type,
      icon: messageType.icon,
      color: messageType.color,
      message: message.text,
      action: message.action,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  }
  
  return selectedMessages;
};

// 设备状态数据生成
export const generateMockDeviceStatus = () => {
  const devices = [
    { name: '增氧泵-1号池', type: 'aerator', normalParams: { power: 85, flow: 120 } },
    { name: '增氧泵-2号池', type: 'aerator', normalParams: { power: 78, flow: 115 } },
    { name: '过滤系统-主干', type: 'filter', normalParams: { pressure: 2.3, efficiency: 94 } },
    { name: '投食机-A区', type: 'feeder', normalParams: { schedule: '正常', remaining: 78 } },
    { name: '投食机-B区', type: 'feeder', normalParams: { schedule: '正常', remaining: 65 } },
    { name: '循环水泵-1', type: 'pump', normalParams: { flow: 145, temperature: 45 } },
    { name: '循环水泵-2', type: 'pump', normalParams: { flow: 138, temperature: 43 } },
    { name: '紫外消毒器', type: 'sterilizer', normalParams: { intensity: 92, runtime: 18 } },
    { name: '备用发电机', type: 'generator', normalParams: { fuel: 85, readiness: 100 } },
    { name: '环境监控主机', type: 'monitor', normalParams: { sensors: 24, connectivity: 98 } }
  ];
  
  const statuses = ['运行中', '待机', '维护中', '故障'];
  const statusColors = {
    '运行中': '#20B2AA',
    '待机': '#41b3d3',
    '维护中': '#ffa500',
    '故障': '#ff6b35'
  };
  
  return devices.map(device => {
    const status = randomChoice(Math.random() > 0.85 ? ['待机', '维护中', '故障'] : ['运行中']);
    const lastUpdate = Date.now() - randomBetween(1000, 300000); // 最近5分钟内更新
    
    // 根据状态调整参数
    let parameters: any = { ...device.normalParams };
    if (status === '故障') {
      Object.keys(parameters).forEach(key => {
        if (typeof parameters[key] === 'number') {
          parameters[key] = Math.max(0, parameters[key] * randomBetween(0.3, 0.7));
        }
      });
    } else if (status === '维护中') {
      parameters = { ...parameters, maintenanceProgress: randomBetween(30, 95).toFixed(0) + '%' };
    }
    
    return {
      id: `device_${device.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: device.name,
      type: device.type,
      status,
      statusColor: statusColors[status as keyof typeof statusColors],
      parameters,
      lastUpdate,
      lastUpdateTime: new Date(lastUpdate).toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    };
  });
};

// 地理位置数据生成
export const generateMockLocationData = () => {
  const locations = [
    { name: '1号养殖池', area: 2500, region: 'A区' },
    { name: '2号养殖池', area: 2800, region: 'A区' },
    { name: '3号养殖池', area: 2200, region: 'B区' },
    { name: '4号养殖池', area: 3000, region: 'B区' },
    { name: '5号养殖池', area: 2600, region: 'C区' },
    { name: '孵化池-1', area: 800, region: 'D区' },
    { name: '孵化池-2', area: 750, region: 'D区' },
    { name: '暂养池', area: 1200, region: 'E区' }
  ];
  
  const baseCoordinates = { lat: 35.6762, lng: 139.6503 }; // 东京附近
  const statuses = ['正常运行', '投食中', '清洁中', '检修中'];
  const statusColors = {
    '正常运行': '#20B2AA',
    '投食中': '#41b3d3',
    '清洁中': '#ffa500',
    '检修中': '#ff6b35'
  };
  
  return locations.map((location, index) => {
    const status = randomChoice(statuses);
    const coordinates = {
      lat: baseCoordinates.lat + randomBetween(-0.01, 0.01),
      lng: baseCoordinates.lng + randomBetween(-0.01, 0.01)
    };
    
    return {
      id: `location_${index + 1}`,
      name: location.name,
      region: location.region,
      coordinates,
      area: location.area,
      status,
      statusColor: statusColors[status as keyof typeof statusColors],
      fishCount: Math.floor(randomBetween(800, 2500)),
      waterDepth: randomBetween(1.8, 3.2).toFixed(1),
      lastInspection: new Date(Date.now() - randomBetween(3600000, 86400000)).toLocaleDateString('ja-JP'),
      coordinates_str: `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
    };
  });
};