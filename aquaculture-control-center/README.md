# 水产养殖智能监控中心

一个基于 React + TypeScript 的现代化水产养殖监控系统，提供实时数据监控、智能决策支持和设备管理功能。

## 🌊 项目简介

本项目是一个专为水产养殖行业设计的智能监控平台，集成了多种传感器数据监控、摄像头实时监控、AI智能决策和设备状态管理等功能，帮助养殖户实现科学化、智能化的养殖管理。

## ✨ 主要功能

### 📊 实时数据监控
- **多参数传感器监控**：水温、pH值、溶解氧、氨氮、亚硝酸盐、光照强度、水位、流量
- **实时图表展示**：动态更新的数据图表，支持历史数据查看
- **阈值报警**：自动检测参数异常并提供预警

### 📹 视频监控系统
- **实时摄像头监控**：支持多路摄像头同时监控
- **图像智能分析**：基于AI的图像识别和分析
- **远程查看**：支持远程实时查看养殖现场

### 🤖 AI智能决策
- **智能分析**：基于历史数据和实时参数的智能分析
- **决策建议**：提供专业的养殖管理建议
- **异常预警**：智能识别潜在风险并及时预警

### 🔧 设备管理
- **设备状态监控**：实时监控各类设备运行状态
- **故障诊断**：自动检测设备故障并提供解决方案
- **远程控制**：支持远程设备控制和参数调整

### 📍 位置信息管理
- **多场地管理**：支持多个养殖场地的统一管理
- **地理信息展示**：直观的地理位置和环境信息展示

### 🎤 语音输入（ASR）
- 右下角悬浮麦克风按钮：点击开始录音，再次点击停止并发送音频
- 实时识别（WebSocket）：配置 `VITE_ASR_WS_URL` 后自动启用；首帧发送 `start`（包含 `mimeType` 等），中间持续发送二进制音频分片，结束发送 `end`
- 文件上传（HTTP）：配置 `VITE_ASR_UPLOAD_URL` 时作为兜底，在停止录音后将整段音频通过 `multipart/form-data` 上传
- 支持的音频编码：优先 `audio/webm;codecs=opus`，其次 `audio/webm`、`audio/ogg;codecs=opus`、`audio/ogg`（浏览器兼容性自动选择）
- 权限与安全：需要用户允许麦克风权限；建议在 `https` 或 `localhost` 环境访问
- 跨域与代理：请确保后端已允许 CORS/WS 跨域，或在 `vite.config.ts` 中配置代理
- 协议对齐：如需鉴权或自定义 `start/end/心跳/分片封装`，请告知服务端协议，我将快速调整前端实现

使用步骤：
1. 在 `.env.development` 或 `.env` 中配置 `VITE_ASR_WS_URL` 或 `VITE_ASR_UPLOAD_URL`
2. 启动开发服务器 `npm run dev`
3. 打开页面，点击右下角麦克风按钮并允许权限
4. 说话几秒后再次点击停止，查看发送和识别结果提示

## 🛠️ 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 6
- **UI组件库**：Radix UI + Tailwind CSS
- **图表库**：Recharts
- **路由管理**：React Router DOM
- **表单处理**：React Hook Form + Zod
- **主题管理**：next-themes
- **图标库**：Lucide React

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 pnpm >= 7.0.0

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install
```

### 启动开发服务器

```bash
# 使用 npm
npm run dev

# 或使用 pnpm
pnpm dev
```

启动成功后，在浏览器中访问 [http://localhost:5173](http://localhost:5173) 即可查看应用。

### 构建生产版本

```bash
# 开发环境构建
npm run build

# 生产环境构建
npm run build:prod
```

### 预览生产版本

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 📁 项目结构

```
aquaculture-control-center/
├── public/                 # 静态资源
├── src/
│   ├── components/         # React 组件
│   │   ├── AIDecisionChat.tsx    # AI决策聊天组件
│   │   ├── CameraFeed.tsx        # 摄像头监控组件
│   │   ├── DeviceStatus.tsx      # 设备状态组件
│   │   ├── LocationInfo.tsx      # 位置信息组件
│   │   ├── SensorChart.tsx       # 传感器图表组件
│   │   ├── MicRecorderButton.tsx # 悬浮麦克风录音按钮（语音输入/ASR）
│   │   └── ErrorBoundary.tsx     # 错误边界组件
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   ├── utils/              # 工具函数
│   │   └── mockData.ts     # 模拟数据生成
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── package.json            # 项目配置
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind CSS 配置
└── tsconfig.json           # TypeScript 配置
```

## 🔧 配置说明

### 环境变量

项目支持以下环境变量配置：

- `BUILD_MODE`: 构建模式（dev/prod）
- `VITE_API_BASE_URL`: API 基础地址
- `VITE_WS_URL`: WebSocket 连接地址
- `VITE_ASR_WS_URL`: ASR 实时识别 WebSocket 地址（优先使用，实时流式发送音频分片）
- `VITE_ASR_UPLOAD_URL`: ASR 音频文件上传 HTTP 地址（兜底方案，停止录音后整段上传）

示例（在项目根目录创建 `.env.development` 或 `.env`）：

```bash
# ASR 实时识别（WebSocket）
VITE_ASR_WS_URL=ws://your-asr-server/ws

# ASR 文件上传（HTTP，作为兜底）
VITE_ASR_UPLOAD_URL=http://your-asr-server/upload
```


### 传感器配置

在 `src/App.tsx` 中可以配置监控的传感器类型：

```typescript
const sensorTypes = [
  { id: 'temperature', name: '水温', unit: '°C', color: '#00a8cc', threshold: [18, 28] },
  { id: 'ph', name: 'pH值', unit: 'pH', color: '#41b3d3', threshold: [6.5, 8.5] },
  // ... 更多传感器配置
];
```

## 🌐 在线演示

项目已部署到线上，可以通过以下地址访问：

**🔗 [在线演示地址](https://a3h3wz5wum03.space.minimax.io)**

## 📝 开发说明

### 数据模拟

项目使用 `src/utils/mockData.ts` 生成模拟数据，包括：
- 传感器数据模拟
- AI消息模拟
- 设备状态模拟
- 位置信息模拟

### 组件开发

所有组件都采用 TypeScript 开发，并包含完整的类型定义。每个组件都有对应的 CSS 文件用于样式定制。

### API 集成

项目预留了 API 集成接口，可以轻松替换模拟数据为真实的后端 API 调用。

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至项目维护者
- 加入项目讨论群

---

**🐟 让科技赋能水产养殖，让智能守护蓝色家园！**
