/**
 * LibreHardwareMonitor 数据解析器
 *
 * 将 LHM /data.json 返回的树形 JSON 解析为与 AIDA64 兼容的 performance 对象。
 * 优先使用精确 SensorId 匹配，失败时回退到 SensorId 前缀 + Type + Text 模糊匹配。
 *
 * 适配你的机器：修改 SENSOR_ID_MAP 中的 SensorId 索引号即可。
 */

// ============================================================
// SensorId 映射表 — 按你的硬件编辑此区域
// ============================================================

const SENSOR_ID_MAP = {
  // --- CPU (Intel Core i5-12600KF: /intelcpu/0) ---
  'cpu.load':        '/intelcpu/0/load/0',
  'cpu.temperature': '/intelcpu/0/temperature/0',
  'cpu.clock':       '/intelcpu/0/clock/1',        // P-Core #1, clock/0 是 Bus Speed
  'cpu.voltage':     '/intelcpu/0/voltage/0',
  'cpu.power':       '/intelcpu/0/power/0',
  'cpu.fan':         '/lpc/nct6687d/0/fan/0',       // 主板 CPU 风扇

  // --- GPU (NVIDIA RTX 4060: /gpu-nvidia/0) ---
  'gpu.load':        '/gpu-nvidia/0/load/0',
  'gpu.temperature': '/gpu-nvidia/0/temperature/0',
  'gpu.clock':       '/gpu-nvidia/0/clock/0',
  'gpu.voltage':     '/gpu-nvidia/0/voltage/0',
  'gpu.fan':         '/gpu-nvidia/0/fan/0',

  // --- VRAM (来自 GPU) ---
  'videoRam.load':   '/gpu-nvidia/0/load/3',          // GPU Memory Load
  'videoRam.used':   '/gpu-nvidia/0/smalldata/1',     // GPU Memory Used (MB, 后续转为 GB)
  'videoRam.free':   '/gpu-nvidia/0/smalldata/0',     // GPU Memory Free (MB, 后续转为 GB)
  'videoRam.total':  '/gpu-nvidia/0/smalldata/2',     // GPU Memory Total (MB, 后续转为 GB)
  // 注意：ram.clock 和 videoRam.clock 无可靠 LHM 传感器，已用 total 替代
};

// ============================================================
// 模糊匹配规则（精确 SensorId 匹配失败时使用）
// 用 SensorId 前缀精确限定硬件，避免 /ram/ 和 /vram/ 混淆
// ============================================================

const FUZZY_RULES = [
  // --- GPU Power（部分显卡不暴露）---
  { field: 'gpu.power',   prefix: '/gpu-nvidia/', type: 'Power' },

  // --- RAM（前缀 /ram/ 精确排除 /vram/）---
  { field: 'ram.load',    prefix: '/ram/', type: 'Load', text: 'Memory' },
  { field: 'ram.used',    prefix: '/ram/', type: 'Data', text: 'Used' },
  { field: 'ram.free',    prefix: '/ram/', type: 'Data', text: 'Available' },
];

// ============================================================
// 辅助函数
// ============================================================

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
  let download = 0;
  let upload = 0;

  for (const node of Object.values(sensorMap)) {
    if (node.Type !== 'Throughput') continue;
    if (!node.SensorId || !node.SensorId.includes('/nic/')) continue;

    // 从 SensorId 提取 GUID，匹配网卡名称
    const parts = node.SensorId.split('/');
    const guid = parts[2];  // /nic/{GUID}/throughput/X
    if (!isPhysicalNic(nicNames[guid])) continue;

    const text = (node.Text || '').toLowerCase();
    const val = parseValue(node.Value);  // Throughput 的 Value 已是 KB/s，RawValue 是 B/s

    if (text.includes('upload')) {
      upload += val;
    } else if (text.includes('download')) {
      download += val;
    }
  }

  return { download, upload };
}

// ============================================================
// 主解析函数
// ============================================================

/**
 * 将 LHM JSON 树解析为与 AIDA64 兼容的 performance 对象
 *
 * @param {object} jsonData - fetchLHMData() 返回的 JSON 树
 * @returns {object} performance 对象
 */
export function parseLHMData(jsonData) {
  const sensorMap = flattenSensors(jsonData);
  const nicNames = getNicNames(jsonData);

  /**
   * 三级查找：精确 SensorId → 模糊匹配 → 兜底 0
   */
  function resolve(field, fuzzyRule) {
    // 1. 精确 SensorId 匹配
    const sensorId = SENSOR_ID_MAP[field];
    if (sensorId) {
      const val = getBySensorId(sensorMap, sensorId);
      if (val != null) return val;
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

  // VRAM used/free/total 在 LHM 中是 SmallData，单位为 MB，需转为 GB
  const vramUsedMB = resolve('videoRam.used', null);
  const vramFreeMB = resolve('videoRam.free', null);
  const vramTotalMB = resolve('videoRam.total', null);

  const performance = {
    cpu: {
      load:        resolve('cpu.load'),
      temperature: resolve('cpu.temperature'),
      clock:       resolve('cpu.clock'),
      voltage:     resolve('cpu.voltage'),
      power:       resolve('cpu.power'),
      fan:         resolve('cpu.fan'),
    },
    gpu: {
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
      fps: 0,  // LHM 不提供 FPS
    },
    volume: 0,
    network: aggregateNetwork(sensorMap, nicNames),
  };

  return performance;
}
