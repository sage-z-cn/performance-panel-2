// 分析 LHM 数据中有哪些硬件类别和传感器
const fs = require('fs');
const d = JSON.parse(fs.readFileSync('./example/lhm-data.json', 'utf-8'));

// 列出顶层硬件
function catalog(node, depth = 0) {
  if (depth > 3) return;
  if (!node || !node.Children) return;

  for (const child of node.Children) {
    const hw = child.HardwareId || '';
    const text = child.Text || '';
    if (hw || depth === 1) {
      // 收集该硬件下的传感器类型
      const types = new Set();
      function getTypes(n) {
        if (n.Type) types.add(n.Type);
        if (n.Children) n.Children.forEach(getTypes);
      }
      getTypes(child);

      const prefix = '  '.repeat(depth);
      console.log(`${prefix}[${text}]  HardwareId="${hw}"  类型: ${[...types].join(', ')}`);
    }
    catalog(child, depth + 1);
  }
}

console.log('=== LHM 硬件分类 ===\n');
catalog(d);
