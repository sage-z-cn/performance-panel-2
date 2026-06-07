/**
 * LibreHardwareMonitor 数据解析器
 *
 * 将 LHM /data.json 返回的树形 JSON 解析为 performance 对象。
 * 优先使用精确 SensorId 匹配，失败时回退到 SensorId 前缀 + Type + Text 模糊匹配。
 *
 * 适配你的机器：修改 SENSOR_ID_MAP 中的 SensorId 索引号即可。
 */

// ============================================================
// SensorId 映射表 — 按你的硬件编辑此区域
// ============================================================

const SENSOR_ID_MAP = {
  // --- CPU ---
  'cpu.load':        ['/intelcpu/0/load/0',        '/amdcpu/0/load/0'],
  'cpu.temperature': ['/intelcpu/0/temperature/0', '/amdcpu/0/temperature/0'],
  'cpu.clock':       ['/intelcpu/0/clock/1',       '/amdcpu/0/clock/0'],       // Intel P-Core #1, AMD Core #0
  'cpu.voltage':     ['/intelcpu/0/voltage/0',     '/amdcpu/0/voltage/0'],
  'cpu.power':       ['/intelcpu/0/power/0',       '/amdcpu/0/power/0'],
  'cpu.fan':         ['/lpc/nct6687d/0/fan/0'],                                  // 主板风扇，无 AMD 通用映射

  // --- GPU ---
  'gpu.load':        ['/gpu-nvidia/0/load/0',      '/gpu-amd/0/load/0'],
  'gpu.temperature': ['/gpu-nvidia/0/temperature/0', '/gpu-amd/0/temperature/0'],
  'gpu.clock':       ['/gpu-nvidia/0/clock/0',     '/gpu-amd/0/clock/0'],
  'gpu.voltage':     ['/gpu-nvidia/0/voltage/0',   '/gpu-amd/0/voltage/0'],
  'gpu.fan':         ['/gpu-nvidia/0/fan/0',       '/gpu-amd/0/fan/0'],

  // --- VRAM (来自 GPU) ---
  'videoRam.load':   ['/gpu-nvidia/0/load/3',      '/gpu-amd/0/load/3'],
  'videoRam.used':   ['/gpu-nvidia/0/smalldata/1', '/gpu-amd/0/smalldata/1'],   // MB，后续转为 GB
  'videoRam.free':   ['/gpu-nvidia/0/smalldata/0', '/gpu-amd/0/smalldata/0'],
  'videoRam.total':  ['/gpu-nvidia/0/smalldata/2', '/gpu-amd/0/smalldata/2'],
};

// ============================================================
// 模糊匹配规则（精确 SensorId 匹配失败时使用）
// 用 SensorId 前缀精确限定硬件，避免 /ram/ 和 /vram/ 混淆
// ============================================================

const FUZZY_RULES = [
  // --- GPU Power（部分显卡不暴露，兼容 NVIDIA 和 AMD）---
  { field: 'gpu.power',   prefix: '/gpu-nvidia/', type: 'Power' },
  { field: 'gpu.power',   prefix: '/gpu-amd/',     type: 'Power' },

  // --- RAM（前缀 /ram/ 精确排除 /vram/）---
  { field: 'ram.load',    prefix: '/ram/', type: 'Load', text: 'Memory' },
  { field: 'ram.used',    prefix: '/ram/', type: 'Data', text: 'Used' },
  { field: 'ram.free',    prefix: '/ram/', type: 'Data', text: 'Available' },
];

// ============================================================
// 辅助函数
// ============================================================

/**
 * 从 JSON 树中提取硬件名称（按 HardwareId 前缀匹配）
 */
function getHardwareName(jsonData, prefix) {
  function walk(node) {
    if (!node) return null;
    if (node.HardwareId && node.HardwareId.startsWith(prefix)) {
      return node.Text;
    }
    for (const child of node.Children || []) {
      const result = walk(child);
      if (result) return result;
    }
    return null;
  }
  return walk(jsonData) || '';
}

/**
 * 从 LHM 值字符串中提取数字（如 "52.0 °C" → 52.0）
 */
function parseValue(rawValue) {
  if (rawValue == null || rawValue === '') return 0;
  const num = parseFloat(rawValue);
  return Number.isFinite(num) ? num : 0;
}

/**
 * 递归遍历树，收集所有传感器节点到 { SensorId → node } 的映射
 */
function flattenSensors(node, map = {}) {
  if (!node) return map;
  if (node.SensorId) {
    map[node.SensorId] = node;
  }
  if (node.Children) {
    for (const child of node.Children) {
      flattenSensors(child, map);
    }
  }
  return map;
}

/**
 * 精确 SensorId 查找
 */
function getBySensorId(sensorMap, sensorId) {
  const node = sensorMap[sensorId];
  return node ? parseValue(node.RawValue) : null;
}

/**
 * 按 SensorId 前缀 + Type + Text 关键词模糊查找传感器值
 * @param {object} sensorMap   - 扁平传感器映射
 * @param {string} prefix      - SensorId 前缀（如 "/ram/", "/gpu-nvidia/"）
 * @param {string} type        - 传感器类型
 * @param {string} textContains - Text 中需包含的关键词（可选）
 * @param {string} textNotContains - Text 中不能包含的关键词（可选）
 */
function getBySensorPrefix(sensorMap, prefix, type, textContains, textNotContains) {
  for (const node of Object.values(sensorMap)) {
    if (!node.SensorId || !node.SensorId.startsWith(prefix)) continue;
    if (node.Type !== type) continue;
    if (textContains && !node.Text.toLowerCase().includes(textContains.toLowerCase())) continue;
    if (textNotContains && node.Text.toLowerCase().includes(textNotContains.toLowerCase())) continue;
    return parseValue(node.RawValue);
  }
  return null;
}

// ============================================================
// 网络数据聚合（仅统计有线和 Wi-Fi 适配器）
// ============================================================

/**
 * 从 JSON 树中提取 NIC GUID → 网卡名称 的映射
 */
function getNicNames(jsonData) {
  const names = {};
  function walk(node) {
    if (node.HardwareId && node.HardwareId.includes('/nic/')) {
      const guid = node.HardwareId.replace('/nic/', '');
      names[guid] = node.Text || '';
    }
    for (const child of node.Children || []) {
      walk(child);
    }
  }
  walk(jsonData);
  return names;
}

/**
 * 判断网卡名称是否为有线或 Wi-Fi
 */
function isPhysicalNic(name) {
  const lower = (name || '').toLowerCase();
  return lower.includes('以太网') || lower.includes('ethernet')
      || lower.includes('wlan') || lower.includes('wi-fi')
      || lower.includes('wifi') || lower.includes('无线');
}

function aggregateNetwork(sensorMap, nicNames) {
  // 按 GUID 分组，收集每个物理网卡的 Throughput 传感器
  const nics = {};

  for (const node of Object.values(sensorMap)) {
    if (node.Type !== 'Throughput') continue;
    if (!node.SensorId || !node.SensorId.includes('/nic/')) continue;

    const parts = node.SensorId.split('/');
    const guid = parts[2];
    if (!isPhysicalNic(nicNames[guid])) continue;

    if (!nics[guid]) nics[guid] = { name: nicNames[guid] || guid, download: '0 KB/s', downloadNum: 0, upload: '0 KB/s', uploadNum: 0 };

    const text = (node.Text || '').toLowerCase();
    const val = node.Value || '';
    // 归一化到 KB/s：LHM 网速单位可能是 "KB/s" 或 "MB/s"
    let num = parseFloat(val) || 0;
    if (val.toLowerCase().includes('mb/s')) num *= 1000;

    if (text.includes('upload')) {
      nics[guid].upload = val;
      nics[guid].uploadNum = num;
    } else if (text.includes('download')) {
      nics[guid].download = val;
      nics[guid].downloadNum = num;
    }
  }

  // 选总速度最大的物理网卡
  let best = { download: '0 KB/s', upload: '0 KB/s' };
  let bestTotal = 0;
  for (const nic of Object.values(nics)) {
    const total = nic.downloadNum + nic.uploadNum;
    if (total > bestTotal) {
      bestTotal = total;
      best = { download: nic.download, upload: nic.upload };
    }
  }

  return best;
}

// ============================================================
// 磁盘数据聚合（立即选中总速度最大的磁盘，但切换后至少保持 3 秒）
// ============================================================

let currentDiskKey = null;
let lastSwitchTime = 0;
const MIN_HOLD_MS = 3000;

/**
 * 从 JSON 树中获取磁盘前缀 → 型号名称 的映射
 * 通过 HardwareId 精确匹配磁盘节点（如 /nvme/2, /hdd/0）
 */
function getDiskNames(jsonData) {
  const names = {};
  const DISK_PREFIXES = ['/nvme/', '/hdd/', '/ssd/', '/disk/', '/storage/'];

  function walk(node) {
    if (!node) return;
    if (node.HardwareId && node.Text) {
      for (const p of DISK_PREFIXES) {
        if (node.HardwareId.startsWith(p)) {
          // HardwareId 格式：/nvme/2, /hdd/0 等
          names[node.HardwareId] = node.Text;
          break;
        }
      }
    }
    if (node.Children) {
      for (const child of node.Children) walk(child);
    }
  }
  walk(jsonData);
  return names;
}

/**
 * 按 SensorId 前缀将磁盘传感器分组
 * 磁盘 SensorId 格式：/nvme/N/type/idx 或 /hdd/N/type/idx
 */
function aggregateDisks(sensorMap, jsonData) {
  const diskNames = getDiskNames(jsonData);
  const DISK_PREFIXES = ['/nvme/', '/hdd/', '/ssd/', '/disk/', '/storage/'];
  // 存储：{ diskKey: { name, sensors: [] } }
  const disks = {};

  for (const node of Object.values(sensorMap)) {
    if (!node.SensorId) continue;

    // 匹配磁盘前缀，提取磁盘标识
    let diskKey = null;
    for (const prefix of DISK_PREFIXES) {
      if (node.SensorId.startsWith(prefix)) {
        // 提取 /nvme/2/... → "nvme-2"
        const rest = node.SensorId.substring(prefix.length);
        const idx = rest.indexOf('/');
        const diskId = idx > 0 ? rest.substring(0, idx) : rest;
        diskKey = prefix + diskId;
        break;
      }
    }
    if (!diskKey) continue;

    if (!disks[diskKey]) {
      disks[diskKey] = { name: diskKey.replace('/', ' ').trim(), sensors: [] };
    }
    disks[diskKey].sensors.push(node);
  }

  const results = [];
  for (const diskKey of Object.keys(disks)) {
    const data = parseDiskData(disks[diskKey].sensors);
    data.key = diskKey;
    // 改写 name 为更友好的磁盘名称
    data.name = diskNames[diskKey] || diskKey.replace('/nvme/', 'NVMe #').replace('/hdd/', 'HDD #').replace('/ssd/', 'SSD #').replace('/disk/', 'Disk #');
    results.push(data);
  }

  if (results.length === 0) {
    return { name: '', readSpeed: '0 KB/s', writeSpeed: '0 KB/s', temperature: 0, load: 0, used: 0, total: 0 };
  }

  // 选总速度最大的磁盘，切换后至少保持 3 秒
  results.sort((a, b) => b._totalSpeed - a._totalSpeed);
  const fastest = results[0];
  const now = Date.now();

  if (!currentDiskKey) {
    currentDiskKey = fastest.key;
    lastSwitchTime = now;
  } else if (fastest.key !== currentDiskKey && (now - lastSwitchTime) >= MIN_HOLD_MS) {
    currentDiskKey = fastest.key;
    lastSwitchTime = now;
  } else {
    const current = results.find(r => r.key === currentDiskKey);
    if (current) return current;
    // 当前磁盘不存在了，直接切换
    currentDiskKey = fastest.key;
    lastSwitchTime = now;
  }

  return fastest;
}

/**
 * 从单个磁盘的传感器列表中提取数据
 */
function parseDiskData(diskSensors) {
  let readSpeed = '';
  let writeSpeed = '';
  let temperature = 0;
  let load = 0;
  let used = 0;
  let total = 0;

  for (const node of diskSensors) {
    const text = (node.Text || '').toLowerCase();
    const type = node.Type;

    if (type === 'Throughput') {
      // LHM 的 Throughput.Value 自带单位，直接用
      if (text.includes('read')) {
        readSpeed = node.Value || '';
      } else if (text.includes('write')) {
        writeSpeed = node.Value || '';
      }
    } else if (type === 'Temperature') {
      // 跳过警告/临界温度，取实际的 Composite 温度或第一个非警告值
      if (text.includes('warning') || text.includes('critical')) continue;
      if (temperature === 0 || text.includes('composite')) {
        temperature = parseValue(node.RawValue);
      }
    } else if (type === 'Load') {
      // 只取 Used Space，避免 Read/Write Activity 覆盖
      if (text.includes('used space') || text.includes('已用')) {
        load = parseValue(node.RawValue);
      }
    } else if (type === 'Data') {
      if (text.includes('used') || text.includes('已用')) {
        used = parseValue(node.RawValue);
      } else if (text.includes('total') || text.includes('总')) {
        total = parseValue(node.RawValue);
      } else if (text.includes('available') || text.includes('free') || text.includes('可用') || text.includes('空闲')) {
        // free 保留但不使用
      }
    }
  }

  // 如果有 total 但没有 used，但有 load 值，尝试计算 used
  if (total > 0 && used === 0 && load > 0) {
    used = +(total * load / 100).toFixed(1);
  }

  // 转换 GB（假设 Data 类型的值是 GB 单位；如果值很大可能是 MB 单位）
  if (total > 20000) {
    // 可能是 MB 单位，转换为 GB
    total = +(total / 1024).toFixed(2);
    used = +(used / 1024).toFixed(2);
  }

  return {
    readSpeed: readSpeed || '0 KB/s',
    writeSpeed: writeSpeed || '0 KB/s',
    _totalSpeed: (parseFloat(readSpeed) || 0) + (parseFloat(writeSpeed) || 0),  // 排序用
    temperature: +temperature.toFixed(1),
    load: +load.toFixed(1),
    used: +used.toFixed(1),
    total: +total.toFixed(1),
  };
}

// ============================================================
// 主解析函数
// ============================================================

/**
 * 将 LHM JSON 树解析为 performance 对象
 *
 * @param {object} jsonData - fetchLHMData() 返回的 JSON 树
 * @returns {object} performance 对象
 */
export function parseLHMData(jsonData) {
  const sensorMap = flattenSensors(jsonData);
  const nicNames = getNicNames(jsonData);

  /**
   * 三级查找：精确 SensorId（逐个尝试）→ 模糊匹配 → 兜底 0
   */
  function resolve(field, fuzzyRule) {
    // 1. 精确 SensorId 匹配（依次尝试 Intel/NVIDIA/AMD 等）
    const sensorIds = SENSOR_ID_MAP[field];
    if (sensorIds) {
      for (const sid of sensorIds) {
        const val = getBySensorId(sensorMap, sid);
        if (val != null) return val;
      }
    }
    // 2. 模糊匹配（SensorId 前缀 + Type + Text）
    if (fuzzyRule) {
      const val = getBySensorPrefix(
        sensorMap,
        fuzzyRule.prefix,
        fuzzyRule.type,
        fuzzyRule.text,
        fuzzyRule.notText,
      );
      if (val != null) return val;
    }
    // 3. 兜底
    return 0;
  }

  const timestamp = Date.now();

  // 提取硬件名称
  const cpuName = getHardwareName(jsonData, '/intelcpu/') || getHardwareName(jsonData, '/amdcpu/');
  const gpuName = getHardwareName(jsonData, '/gpu-nvidia/') || getHardwareName(jsonData, '/gpu-amd/');

  // VRAM used/free/total 在 LHM 中是 SmallData，单位为 MB，需转为 GB
  const vramUsedMB = resolve('videoRam.used', null);
  const vramFreeMB = resolve('videoRam.free', null);
  const vramTotalMB = resolve('videoRam.total', null);

  const performance = {
    cpu: {
      name:        cpuName,
      load:        resolve('cpu.load'),
      temperature: resolve('cpu.temperature'),
      clock:       resolve('cpu.clock'),
      voltage:     resolve('cpu.voltage'),
      power:       resolve('cpu.power'),
      fan:         resolve('cpu.fan'),
    },
    gpu: {
      name:        gpuName,
      load:        resolve('gpu.load'),
      temperature: resolve('gpu.temperature'),
      clock:       resolve('gpu.clock'),
      voltage:     resolve('gpu.voltage'),
      power:       resolve('gpu.power', FUZZY_RULES.find(r => r.field === 'gpu.power')),
      fan:         resolve('gpu.fan'),
    },
    ram: {
      load:  resolve('ram.load', FUZZY_RULES.find(r => r.field === 'ram.load')),
      total: +(resolve('ram.used', FUZZY_RULES.find(r => r.field === 'ram.used')) + resolve('ram.free', FUZZY_RULES.find(r => r.field === 'ram.free'))).toFixed(1),
      free:  resolve('ram.free', FUZZY_RULES.find(r => r.field === 'ram.free')),
      used:  resolve('ram.used', FUZZY_RULES.find(r => r.field === 'ram.used')),
    },
    videoRam: {
      load:  vramTotalMB > 0 ? +((vramUsedMB / vramTotalMB) * 100).toFixed(1) : 0,
      total: +(vramTotalMB / 1024).toFixed(2),  // MB → GB
      free:  +(vramFreeMB / 1024).toFixed(2),
      used:  +(vramUsedMB / 1024).toFixed(2),
    },
    display: {
      timestamp,
    },
    volume: 0,
    network: aggregateNetwork(sensorMap, nicNames),
    disk: aggregateDisks(sensorMap, jsonData),
  };

  return performance;
}
