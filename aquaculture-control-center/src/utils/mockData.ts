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

// 传感器数据生成 - 从API获取真实数据
export const generateMockSensorData = async (sensorTypes: any[]) => {
  // 调用真实API获取传感器数据
  const response = await fetch('http://8.216.33.92:5002/api/sensors/realtime', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // 设置超时时间
    signal: AbortSignal.timeout(5000)
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.success && result.data) {
    console.log('传感器数据API调用成功:', result);
    return result.data;
  } else {
    throw new Error('API返回数据格式错误');
  }
};

// AI决策消息API接口调用
export const generateMockAIMessages = async () => {
  // 调用真实的AI助手API接口
  const response = await fetch('http://8.216.33.92:5002/api/ai/decisions/recent', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    // 设置超时时间
    signal: AbortSignal.timeout(5000) // 5秒超时
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.success && result.data) {
    return result.data;
  } else {
    throw new Error('API返回数据格式错误');
  }
};

// 设备状态API接口调用
export const generateMockDeviceStatus = async () => {
  // 调用真实的设备状态API接口
  const response = await fetch('http://8.216.33.92:5002/api/devices/status', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    // 设置超时时间
    signal: AbortSignal.timeout(5000) // 5秒超时
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.success && result.data) {
    return result.data;
  } else {
    throw new Error('API返回数据格式错误');
  }
};



// 地理位置数据生成 - 替换为API调用
export const generateMockLocationData = async () => {
  try {
    // 调用本地API获取地理位置数据
    const response = await fetch('http://8.216.33.92:5002/api/location/data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 设置超时时间
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('地理位置数据API调用成功:', result);
      
      // 将API数据转换为前端需要的格式
      const transformedData = result.data.map((item: any, index: number) => {
        const statusMap: { [key: string]: string } = {
          'active': '正常运行',
          'maintenance': '检修中',
          'operational': '正常运行'
        };
        
        const statusColorMap: { [key: string]: string } = {
          '正常运行': '#20B2AA',
          '检修中': '#ff6b35',
          '投食中': '#41b3d3',
          '清洁中': '#ffa500'
        };
        
        const status = statusMap[item.status] || '正常运行';
        
        return {
          id: item.id || `location_${index + 1}`,
          name: item.name || `位置${index + 1}`,
          region: item.type === 'pond' ? 'A区' : 'B区',
          coordinates: item.coordinates || { lat: 35.6762, lng: 139.6503 },
          area: item.area || 2500,
          status: status,
          statusColor: statusColorMap[status],
          fishCount: Math.floor(Math.random() * 1500 + 800),
          waterDepth: (item.depth || 2.5).toFixed(1),
          lastInspection: new Date(item.lastUpdate || Date.now()).toLocaleDateString('ja-JP'),
          coordinates_str: `${(item.coordinates?.lat || 35.6762).toFixed(6)}, ${(item.coordinates?.lng || 139.6503).toFixed(6)}`
        };
      });
      
      return transformedData;
    } else {
      throw new Error('API返回数据格式错误');
    }
    
  } catch (error) {
    console.error('地理位置数据API调用失败，使用备用模拟数据:', error);
    
    // 备用模拟数据生成逻辑（与原函数相同）
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
  }
};