import { defineConfig } from "vite"; // 动态配置函数
import { createVuePlugin } from "vite-plugin-vue2";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { resolve } from "path";


const PREFIX = "agora-engine"


const genBaseUrl = (mode) => {
  switch (mode) {
    case "production":
      return `${PREFIX}`
    default:
      return "/"
  }
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      createVuePlugin(),
      nodePolyfills(),
    ],
    base: genBaseUrl(mode),
    resolve: {
      // 别名
      alias: {
        "@": resolve(__dirname, "./src"),
        assets: resolve(__dirname, "./assets"),
      },
    },
    server:{
      host: 'y-dev.tuwan.com',
      https: true,
      port: 443,
    },
    // server: {
    //   host: "0.0.0.0",
    // },
    // test: {
    //   testTimeout: 30000,
    // },
  }
})
