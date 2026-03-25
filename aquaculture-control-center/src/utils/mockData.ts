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
/**
 * generateMockSensorData
 * 功能：从后端拉取传感器实时数据（经由 Vite 开发代理 /api → 8.216.33.92:5002）
 * 输入：sensorTypes - 传感器类型列表（当前未使用，保留参数以兼容未来筛选）
 * 输出：返回按传感器ID分组的对象格式 { sensorId: [{timestamp, value, time}, ...] }
 * 关键逻辑：
 * - 使用相对路径 /api/sensors/realtime，避免直接跨域；由 Vite 代理转发到后端
 * - GET 请求不设置 Content-Type（无请求体时不需要，且可避免触发 CORS 预检）
 * - 设置 5 秒超时并对响应进行格式校验
 * - 将后端返回的数组格式转换为按传感器ID分组的对象格式
 */
export const generateMockSensorData = async (sensorTypes: any[]) => {
  // 通过相对路径交由 Vite 代理处理跨域
  const response = await fetch('/api/sensors/realtime', {
    method: 'GET',
    headers: {
      // 'Accept' 为简单请求头，不会触发预检
      'Accept': 'application/json',
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
    
    // 如果返回的是数组，需要转换为按传感器ID分组的对象格式
    if (Array.isArray(result.data)) {
      const groupedData: { [key: string]: Array<{ timestamp: number; value: number; time: string }> } = {};
      
      result.data.forEach((item: any) => {
        const sensorId = item.sensorId || item.id;
        if (!sensorId) {
          console.warn('传感器数据缺少sensorId:', item);
          return;
        }
        
        if (!groupedData[sensorId]) {
          groupedData[sensorId] = [];
        }
        
        groupedData[sensorId].push({
          timestamp: item.timestamp,
          value: item.value,
          time: new Date(item.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        });
      });
      
      return groupedData;
    }
    
    // 如果已经是对象格式，直接返回
    return result.data;
  } else {
    throw new Error('API返回数据格式错误');
  }
};

// AI决策消息API接口调用
/**
 * generateMockAIMessages
 * 功能：获取最近的 AI 决策消息列表
 * 输入：无
 * 输出：返回后端的 data 数组；如失败抛出异常
 * 关键逻辑：改为相对路径 /api/ai/decisions/recent，并移除不必要的 Content-Type
 */
export const generateMockAIMessages = async () => {
  // 调用真实的AI助手API接口（通过代理消除跨域）
  const response = await fetch('/api/ai/decisions/recent', {
    method: 'GET',
    headers: {
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
/**
 * generateMockDeviceStatus
 * 功能：获取设备状态列表
 * 输入：无
 * 输出：返回后端的 data 数组；如失败抛出异常
 * 关键逻辑：相对路径 /api/devices/status；只保留 Accept 以减少预检
 */
export const generateMockDeviceStatus = async () => {
  // 调用真实的设备状态API接口（通过代理消除跨域）
  const response = await fetch('/api/devices/status', {
    method: 'GET',
    headers: {
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
/**
 * generateMockLocationData
 * 功能：获取地理位置数据，并转换为前端需要的结构
 * 输入：无
 * 输出：转换后的位置数据数组；如失败则回退到本地模拟数据
 * 关键逻辑：相对路径 /api/location/data；移除不必要的 Content-Type 以减少预检
 */
export const generateMockLocationData = async () => {
  try {
    // 调用后端API（通过代理）获取地理位置数据
    const response = await fetch('/api/location/data', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
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
      { name: '1号养殖池', area: 15, region: 'A区' },
      // { name: '2号养殖池', area: 2800, region: 'A区' },
      // { name: '3号养殖池', area: 2200, region: 'B区' },
      // { name: '4号养殖池', area: 3000, region: 'B区' },
      // { name: '5号养殖池', area: 2600, region: 'C区' },
      // { name: '孵化池-1', area: 800, region: 'D区' },
      // { name: '孵化池-2', area: 750, region: 'D区' },
      // { name: '暂养池', area: 1200, region: 'E区' }
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
