/**
 * LibreHardwareMonitor Remote Web Server API 封装
 *
 * LHM 远程 Web 服务器默认端口 8085，在 GUI 的 Options → Remote Web Server 中启用。
 * 主要数据端点：GET /data.json  返回所有传感器的树形 JSON。
 */

/**
 * 获取 LHM 传感器数据
 * @param {string} host - LHM 主机地址，默认 localhost
 * @param {number|string} port - LHM 端口，默认 8085
 * @returns {Promise<object>} 解析后的 JSON 树
 */
export async function fetchLHMData(host = 'localhost', port = 8085) {
  const url = `http://${host}:${port}/data.json`;
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`LHM responded with ${res.status}: ${res.statusText}`);
  }
  return res.json();
}
