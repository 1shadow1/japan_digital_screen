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
    host: true,
    /**
     * 代理配置（开发环境消除跨域）：
     * - 将以 /api 开头的请求代理到后端服务 http://8.216.33.92:5002
     * - 开启 changeOrigin 以伪装来源为目标地址，避免后端基于 Host 的限制
     * - secure: false 允许代理到 http（非 https）目标
     *
     * 注意：vite.config.ts 变更后需重启开发服务器生效
     */
    proxy: {
      "/api": {
        target: "http://8.216.43.146:5002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
