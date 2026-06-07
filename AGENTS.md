# AGENTS.md — Performance Panel

Wallpaper Engine 网页壁纸，展示 LibreHardwareMonitor 硬件性能数据、音频波形、SMTC 媒体信息。

## 技术栈

- **React 18**（函数组件 + Hooks）、**Vite 6**、**Ant Design 5**（仅 Row/Col 布局 + @ant-design/icons）、**ECharts 5**（echarts-for-react 按需注册）
- **env-cmd**（部署脚本环境变量注入）
- **纯 JavaScript ESM**，无 TypeScript（`@types/*` 仅供编辑器类型提示，无编译步骤）
- 风格：每个卡片独立目录 `src/main/cards/CardName/index.jsx`

## 命令

```bash
npm run dev          # vite dev server
npm run build        # 生产构建到 dist/
npm run deploy       # build + 部署到 Wallpaper Engine 项目目录（Windows only）
npm run lint         # eslint（Vite 6 + eslint 9 flat config）
npm run preview      # vite preview
```

## 部署

`deploy.js` 仅支持 Windows：先用 `rd /s /q` 清空部署目录，再用 `xcopy` 复制 `dist/` → 目标目录。

目标目录在 `.env` 中配置（**该文件已 gitignore，需手动创建**）：
```
DEPLOY_DIR=D:\GamePlatform\Steam\steamapps\common\wallpaper_engine\projects\myprojects\performance_pane_2
```

部署命令使用 `env-cmd` 加载 `.env` 后依次执行 `vite build && node deploy.js`。

## Wallpaper Engine 集成

### WE 平台约束
- **`vite.config.js` 必须 `base: './'`**：WE 用 CEF 加载壁纸，所有资源引用必须是相对路径
- **禁止文本选择/点击**：`index.css` 中 `user-select: none; cursor: default;`，不加会破坏壁纸体验（注意 `pointer-events: none` 已被注释掉）
- **固定暗色主题**：无亮色模式，无 Ant Design ConfigProvider 主题

### WE JavaScript API（全局注入，无需导入）

**配置入站**（`src/App.jsx`）：
```
window.wallpaperPropertyListener.applyUserProperties(properties)
```
用户在 WE 壁纸设置面板修改属性时触发，`properties` 的每个 key 有 `.value` 字段。颜色值是 `"r g b"`（0–1 范围），通过 `convertColor()` 转为 CSS `rgb()`。

**音频入站**（`src/main/cards/AudioCard/index.jsx`）：
```
window.wallpaperRegisterAudioListener(callback)              // 128 float 数组，左 64 + 右 64
window.wallpaperRegisterMediaPropertiesListener(cb)          // { title, artist, albumTitle, ... }
window.wallpaperRegisterMediaThumbnailListener(cb)           // { thumbnail: base64 data URI, primaryColor, ... }
window.wallpaperRegisterMediaPlaybackListener(cb)            // { state: 0|1|2 }
```

**注销监听器**通过传入 `undefined` 完成（而非文档中的 remove 方法）：
```js
window.wallpaperRegisterAudioListener(undefined);
```

**用户配置项**在 `public/project.json` 中定义，当前包含：`language`、`host`、`port`、`themeColor`、`customFont`、`clockFont`、`clockFontSize`、`dateSeparator`、`timeSeparator`、`marginBottom`、`audioResponseEnhance`、`schemecolor`。添加新配置项需同步修改 `project.json` + `App.jsx` 的 `applyUserProperties` 处理 + `useConfig` 默认值。

## 架构与数据流

```
Wallpaper Engine 用户设置 ──→ wallpaperPropertyListener ──→ App.jsx (config state) ──→ ConfigContext ──→ 所有子组件
LibreHardwareMonitor      ──→ HTTP GET /data.json (轮询) ──→ Main/index.jsx 解析 ──→ performance state ──→ 卡片 props
WE 音频/媒体监听器          ──→ AudioCard 直接注册          ──→ AudioCard 内部 state
```

**关键变更**：本项目数据源为 **LibreHardwareMonitor (LHM) Remote Web Server**，通过 HTTP 轮询（`fetch` + `setInterval`，1s 间隔）获取数据。

### LHM 数据格式

LHM Remote Web Server 默认端口 **8085**，在 GUI 的 Options → Remote Web Server 中启用。

数据端点 `GET /data.json` 返回树形 JSON，每个传感器节点结构：
```json
{
  "SensorId": "/intelcpu/0/load/0",
  "Text": "CPU Core #1",
  "Type": "Load",
  "RawValue": "52.0",
  "Value": 52.0
}
```

`lhm-parser.js` 将树形 JSON 解析为 `performance` 对象，解析策略分三级：
1. 精确 `SensorId` 匹配（通过 `SENSOR_ID_MAP`）
2. `SensorId` 前缀 + Type + Text 模糊匹配（通过 `FUZZY_RULES`）
3. 兜底返回 `0`

### 组件树（当前实际布局，两行结构）

```
App (ConfigContext.Provider)
├── Header          — 时钟，每 499ms 更新
└── Main            — LHM 轮询 + 数据解析
    └── Row gutter={[16,16]}
        ├── Col span=12: ChipCard CPU
        ├── Col span=4:  RamCard RAM
        ├── Col span=4:  NetworkCard
        ├── Col span=4:  DiskCard
        ├── Col span=12: ChipCard GPU  (合并 gpu + display)
        ├── Col span=4:  RamCard VRAM
        └── Col span=8:  AudioCard
```

布局为 Ant Design `<Row gutter={[16,16]}>` 按 24 列网格的单行自动换行（两排）。

### performance 对象结构（Main/index.jsx 构建）

```js
{
  cpu:      { load, temperature, clock, voltage, power, fan },
  gpu:      { load, temperature, clock, voltage, power, fan },
  ram:      { load, total, free, used },
  videoRam: { load, total, free, used },
  display:  { timestamp, fps },     // fps 始终为 0（LHM 不提供 FPS）
  volume:   0,                       // 音量，由 Main 维护但初始为 0
  network:  { download, upload },    // KB/s，仅汇总有线/Wi-Fi 网卡
  disk:     { readSpeed, writeSpeed, temperature, load, used, total },  // 选速度最大的磁盘
}
```

## LHM Parser 配置（CRITICAL）

`src/main/lhm-parser.js` 包含 `SENSOR_ID_MAP`，需要用户根据自身硬件编辑。不同机器的 SensorId 索引号不同——**在未适配的机器上大部分传感器值会是 0**。

### SENSOR_ID_MAP 结构
```js
const SENSOR_ID_MAP = {
  'cpu.load':        '/intelcpu/0/load/0',
  'cpu.temperature': '/intelcpu/0/temperature/0',
  'gpu.load':        '/gpu-nvidia/0/load/0',
  'videoRam.used':   '/gpu-nvidia/0/smalldata/1',  // SmallData，单位 MB
  // ...
};
```
VRAM 的 used/free/total 在 LHM 中是 SmallData 类型（单位 MB），parser 会自动转为 GB。

### 模糊匹配回退
当精确 SensorId 查不到时，`FUZZY_RULES` 提供备选匹配：按 SensorId **前缀**（如 `/ram/` 避免与 `/vram/` 混淆）+ Type + Text 关键词查找。

### 网络适配器过滤
`isPhysicalNic()` 函数仅汇总名称中包含 `以太网`/`ethernet`/`wlan`/`wi-fi`/`wifi`/`无线` 的适配器，自动忽略虚拟网卡和回环接口。Throughput 传感器使用 `Value` 字段（KB/s），非 `RawValue`（B/s）。

## 卡片开发约定

每个卡片放在 `src/main/cards/CardName/index.jsx`。卡片结构统一：
```jsx
<div className="card card-xxx">
  <div className="card-header">[图标] [标题]</div>
  <div className="card-body">...</div>
</div>
```
样式继承 `App.css` 的全局 `.card` / `.card-header` / `.card-body` / `.big-item` / `.small-item` 规则。

**图标**统一在 `src/icon/index.jsx` 中定义，使用 `@ant-design/icons` 的 `<Icon component={...} />` 包装 SVG。

**ECharts 按需注册**——每个图表组件只注册实际使用的类型（LineChart / BarChart 等），使用方式：
```js
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { DatasetComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([LineChart, CanvasRenderer, DatasetComponent, GridComponent]);
```
所有 ECharts 图表使用 `notMerge={true}` + `lazyUpdate={true}` + `animation: false` 以优化性能。

## API 层

- `src/api/lhm.js` — `fetchLHMData(host, port)` 获取 LHM `/data.json`

## Hooks

- `useConfig()` — 从 `ConfigContext` 读取 WE 配置
- `useIntl()` — 双语（中/英）翻译，`language` 值为 `"chinese"` / `"english"`，返回 `(key) => translation` 函数

## CSS 注意事项

- `App.css` 使用 **CSS 嵌套语法**（`.header { .datetime { ... } }`），依赖现代浏览器原生支持（WE 的 CEF 内核需 ≥ Chromium 120）
- CSS 变量通过 `setCssVar()` 动态设置 `document.documentElement.style.setProperty(key, value)`
- 全局变量：`--theme-color`、`--custom-font`、`--clock-font`、`--clock-font-size`、`--margin-bottom`
- `index.css` 使用 `rem` 单位 + 媒体查询实现响应式字体（≤1440px: 14px, 1441-1920px: 18px, ≥1921px: 22px）

## 注意事项

- **`dayjs` 和 `axios` 已安装但未使用**——`src/utils/date.js` 用原生 Date，网络调用用原生 fetch。不要引入新依赖除非确实需要。
- **无测试**——项目没有测试框架和测试文件。
- **无 CI/CD**——无 GitHub Actions 或其他 CI 配置。
- **License: GPL v3**。
- **`.env` 已 gitignore**——不要提交 `.env` 文件。
- **Head 组件渲染**：当 LHM 数据不可用时（`readyState !== 1`），Main 显示 `usage-tips` 而非卡片。`readyState` 在首次成功解析后变为 `1`，host/port 变化时重置。
