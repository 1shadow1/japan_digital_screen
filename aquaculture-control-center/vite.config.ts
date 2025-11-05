import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
// import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

// const isProd = process.env.BUILD_MODE === 'prod'
export default defineConfig({
  plugins: [
    react(), 
    // sourceIdentifierPlugin({
    //   enabled: !isProd,
    //   attributePrefix: 'data-matrix',
    //   includeProps: true,
    // })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  /**
   * 开发服务器配置（中文说明）：
   * - port: 指定开发服务器端口为 8083；
   * - strictPort: 当端口被占用时直接报错，避免自动切换到其他端口导致访问地址混乱；
   * - host: 如需在局域网设备访问，可设置为 true（此项目默认不启用，可根据需要打开）。
   */
  server: {
    port: 8083,
    strictPort: true,
    // host: true,
  },
})

