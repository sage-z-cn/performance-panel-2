# Performance Panel

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

[中文](./README.md) | English

This project is a web wallpaper for Wallpaper Engine that displays hardware performance data provided by [LibreHardwareMonitor](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor), and can respond to audio, recognizing the currently playing media.

Subscribe [Performance Panel](https://steamcommunity.com/sharedfiles/filedetails/?id=3465632551) in Wallpaper Engine's Steam Workshop.

<img src="./assets/screenshot-eng.gif" alt="screenshot">

# Usage Guide

## Install LibreHardwareMonitor and Enable Remote Web Server

1. Download the latest portable version (zip) from [LibreHardwareMonitor Releases](https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases)
2. Extract to a fixed directory (avoid paths that may change frequently)
3. Run `LibreHardwareMonitor.exe`. If prompted to install the PawnIO driver on first launch, choose **Yes**
4. Open the **Options** menu and check:
   - `Start Minimized`
   - `Minimize To Tray`
   - `Minimize On Close`
   - `Run On Windows Startup`
5. Open **Options → Remote Web Server** menu and check `Run` to enable Remote Web Server (default port **8085**)

## Apply Wallpaper Engine Wallpaper

Subscribe to [Performance Panel](https://steamcommunity.com/sharedfiles/filedetails/?id=3464821056) in Wallpaper Engine's Steam Workshop and enjoy it

# FAQ

### Q: Why the data do not display?

> A: Please check if LibreHardwareMonitor is running in the background and Remote Web Server is enabled. If everything checks out, you can modify the Host/Port in the Wallpaper Engine wallpaper settings to retry.

### Q: Why are some data displays incorrect or showing 0?

> A: Different computers have different LibreHardwareMonitor SensorId values. You need to edit `src/main/lhm-parser.js` and modify the `SENSOR_ID_MAP` to match your hardware's SensorId. Then redeploy the wallpaper.

### Q: Why isn't currently playing media detected?

> A: Only media players support SMTC can be detected.

### Q: Why is the audio response amplitude so small?

> A: The reason is unknown. You can adjust the recording volume in Wallpaper Engine settings or enable audio response enhancement in this wallpaper's settings.
