# Performance Panel

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

中文 | [English](./README-EN.md)

此项目为 Wallpaper Engine 的网页壁纸，展示 [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor) 提供的硬件性能数据，并且可以响应音频，识别当前播放的媒体。

在 Steam 创意工坊中订阅 [Performance Panel](https://steamcommunity.com/sharedfiles/filedetails/?id=3465632551) .

<img src="./assets/screenshot.gif" alt="screenshot">

# 使用方法

## 安装 LibreHardwareMonitor 并启用 Remote Web Server

1. 从 [LibreHardwareMonitor Releases](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases) 下载最新版本的便携版（zip 包）
2. 解压到一个固定目录（建议不要放在会经常变动的路径）
3. 运行 `LibreHardwareMonitor.exe`，首次启动会提示是否安装 PawnIO 驱动，选择**是**
4. 打开 **Options** 菜单，勾选：
   - `Start Minimized` — 启动时最小化
   - `Minimize To Tray` — 最小化到系统托盘
   - `Minimize On Close` — 关闭时最小化
   - `Run On Windows Startup` — 开机自启动
5. 打开 **Options → Remote Web Server** 菜单，勾选 `Run`，即可启用 Remote Web Server（默认端口 **8085**）

## 应用 Wallpaper Engine 壁纸

在 Wallpaper Engine 的 Steam 创意工坊中订阅 [Performance Panel](https://steamcommunity.com/sharedfiles/filedetails/?id=3464821056)，即可开始享用

# 常见问题

### 问：为什么无法显示数据？

> 答：请检查 LibreHardwareMonitor 是否正在后台运行，且 Remote Web Server 已启用。如果均检查无误，可以在 Wallpaper Engine 的本壁纸设置中修改 Host/端口重试。

### 问：为什么有的数据显示错误或为 0？

> 答：不同电脑中 LibreHardwareMonitor 的传感器 SensorId 不同。需要编辑 `src/main/lhm-parser.js` 中的 `SENSOR_ID_MAP`，根据自己硬件的 SensorId 修改映射关系。修改后需要重新部署。

### 问：为什么未识别到当前正在播放的媒体？

> 答：只有接入了 SMTC 的媒体播放软件才能够被识别。网易云音乐可以安装 [BetterNCM PC版 NCM 客户端插件管理器](https://microblock.cc/betterncm) 解决。

### 问：为什么音频响应的幅度那么小？

> 答：原因不详。可以在 Wallpaper Engine 的设置中调整录音音量或者本壁纸的设置中设置音频响应增强。
