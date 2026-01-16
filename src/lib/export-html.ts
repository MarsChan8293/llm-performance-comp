import { Benchmark, PerformanceMetrics } from './types'
import { parseGpuCount } from './utils'

interface ComparisonData {
  benchmark1: Benchmark
  benchmark2: Benchmark
  summary: string
  selectedCombo?: string
}

/**
 * Aggregates metrics by concurrency, inputLength, and outputLength
 */
function aggregateMetrics(metrics: PerformanceMetrics[]): Map<string, PerformanceMetrics> {
  const map = new Map<string, PerformanceMetrics[]>()
  metrics.forEach(m => {
    const key = `${m.concurrency}-${m.inputLength}-${m.outputLength}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  })

  const result = new Map<string, PerformanceMetrics>()
  map.forEach((items, key) => {
    const avg = {
      concurrency: items[0].concurrency,
      inputLength: items[0].inputLength,
      outputLength: items[0].outputLength,
      ttft: items.reduce((sum, i) => sum + i.ttft, 0) / items.length,
      tpot: items.reduce((sum, i) => sum + i.tpot, 0) / items.length,
      tokensPerSecond: items.reduce((sum, i) => sum + i.tokensPerSecond, 0) / items.length,
    }
    result.set(key, avg)
  })
  return result
}

/**
 * Formats the difference percentage with color coding
 */
function formatDiff(val1: number | undefined, val2: number | undefined, inverse = false): string {
  if (val1 === undefined || val2 === undefined) return '-'
  const diff = ((val2 - val1) / val1) * 100
  const isBetter = inverse ? diff < 0 : diff > 0
  const isWorse = inverse ? diff > 0 : diff < 0
  
  const color = isBetter ? '#10b981' : isWorse ? '#ef4444' : '#6b7280'
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : ''
  
  return `<span style="color: ${color}; font-weight: bold;">${arrow}${Math.abs(diff).toFixed(1)}%</span>`
}

/**
 * Generates a configuration comparison row
 */
function generateConfigRow(label: string, value1: string, value2: string): string {
  const normalizedValue1 = value1?.trim() || ''
  const normalizedValue2 = value2?.trim() || ''
  const isDifferent = normalizedValue1 !== normalizedValue2
  const isMultiLine = label === '框架启动参数' || label === '备注'
  
  const bgColor = isDifferent ? '#fef3c7' : 'transparent'
  const value1Style = isDifferent ? 'background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px;' : 'color: #2563eb;'
  const value2Style = isDifferent ? 'background: #e9d5ff; color: #6b21a8; padding: 4px 8px; border-radius: 4px;' : 'color: #7c3aed;'
  const fontFamily = isMultiLine ? 'font-family: monospace; white-space: pre-wrap;' : ''
  
  return `
    <tr style="background: ${bgColor}; border-bottom: 1px solid #e5e7eb;">
      <td style="text-align: right; padding: 12px; ${value1Style} ${fontFamily}">${value1}</td>
      <td style="text-align: center; padding: 12px; color: #6b7280; min-width: 120px;">
        ${label}
        ${isDifferent ? '<br><span style="background: #fbbf24; color: #78350f; font-size: 10px; padding: 2px 6px; border-radius: 4px;">不同</span>' : ''}
      </td>
      <td style="text-align: left; padding: 12px; ${value2Style} ${fontFamily}">${value2}</td>
    </tr>
  `
}

/**
 * Generates the HTML report for a comparison
 */
export function generateComparisonHTML(data: ComparisonData): string {
  const { benchmark1, benchmark2, summary, selectedCombo = '1024 / 1024' } = data
  
  const gpuCount1 = parseGpuCount(benchmark1.config.shardingConfig)
  const gpuCount2 = parseGpuCount(benchmark2.config.shardingConfig)
  
  const metrics1 = aggregateMetrics(benchmark1.metrics)
  const metrics2 = aggregateMetrics(benchmark2.metrics)
  
  const allKeys = Array.from(new Set([...metrics1.keys(), ...metrics2.keys()])).sort((a, b) => {
    const [c1, i1, o1] = a.split('-').map(Number)
    const [c2, i2, o2] = b.split('-').map(Number)
    if (c1 !== c2) return c1 - c2
    if (i1 !== i2) return i1 - i2
    return o1 - o2
  })
  
  // Filter keys for the selected I/O combination
  const specialKeys = allKeys.filter(key => {
    const [, i, o] = key.split('-')
    return `${i} / ${o}` === selectedCombo
  })
  
  // Generate configuration comparison rows
  const configRows = [
    generateConfigRow('提交人', benchmark1.config.submitter, benchmark2.config.submitter),
    generateConfigRow('模型名称', benchmark1.config.modelName, benchmark2.config.modelName),
    generateConfigRow('服务器名称', benchmark1.config.serverName, benchmark2.config.serverName),
    generateConfigRow('AI 芯片', benchmark1.config.chipName, benchmark2.config.chipName),
    generateConfigRow('推理框架', benchmark1.config.framework, benchmark2.config.framework),
    generateConfigRow('推理框架版本号', benchmark1.config.frameworkVersion, benchmark2.config.frameworkVersion),
    generateConfigRow('切分参数', benchmark1.config.shardingConfig, benchmark2.config.shardingConfig),
    generateConfigRow('算子加速', benchmark1.config.operatorAcceleration || '无', benchmark2.config.operatorAcceleration || '无'),
    generateConfigRow('框架启动参数', benchmark1.config.frameworkParams || '无', benchmark2.config.frameworkParams || '无'),
    generateConfigRow('测试日期', benchmark1.config.testDate, benchmark2.config.testDate),
    generateConfigRow('备注', benchmark1.config.notes || '无', benchmark2.config.notes || '无'),
    generateConfigRow('测试数据量', `${benchmark1.metrics.length} 条`, `${benchmark2.metrics.length} 条`),
  ].join('')
  
  // Generate special comparison rows for selected I/O combo
  const specialRows = specialKeys.map(key => {
    const m1 = metrics1.get(key)
    const m2 = metrics2.get(key)
    const [c] = key.split('-')
    
    const tpsPerGpu1 = m1 ? m1.tokensPerSecond / gpuCount1 : undefined
    const tpsPerGpu2 = m2 ? m2.tokensPerSecond / gpuCount2 : undefined
    
    return `
      <tr>
        <td style="padding: 12px; font-weight: bold; color: #92400e;">${c} 并发</td>
        <td style="padding: 12px; text-align: center;">
          <div style="color: #2563eb; margin-bottom: 4px;">${m1?.ttft.toFixed(1) ?? '-'}</div>
          <div style="color: #7c3aed; font-weight: bold; margin-bottom: 4px;">${m2?.ttft.toFixed(1) ?? '-'}</div>
          ${formatDiff(m1?.ttft, m2?.ttft, true)}
        </td>
        <td style="padding: 12px; text-align: center;">
          <div style="color: #2563eb; margin-bottom: 4px;">${m1?.tpot.toFixed(1) ?? '-'}</div>
          <div style="color: #7c3aed; font-weight: bold; margin-bottom: 4px;">${m2?.tpot.toFixed(1) ?? '-'}</div>
          ${formatDiff(m1?.tpot, m2?.tpot, true)}
        </td>
        <td style="padding: 12px; text-align: center;">
          <div style="color: #2563eb; margin-bottom: 4px;">${m1?.tokensPerSecond.toFixed(1) ?? '-'}</div>
          <div style="color: #7c3aed; font-weight: bold; margin-bottom: 4px;">${m2?.tokensPerSecond.toFixed(1) ?? '-'}</div>
          ${formatDiff(m1?.tokensPerSecond, m2?.tokensPerSecond)}
        </td>
        <td style="padding: 12px; text-align: center;">
          <div style="color: #2563eb; margin-bottom: 4px;">${tpsPerGpu1?.toFixed(2) ?? '-'}</div>
          <div style="color: #7c3aed; font-weight: bold; margin-bottom: 4px;">${tpsPerGpu2?.toFixed(2) ?? '-'}</div>
          ${formatDiff(tpsPerGpu1, tpsPerGpu2)}
        </td>
      </tr>
    `
  }).join('')
  
  // Generate all metrics comparison rows
  const allMetricsRows = allKeys.map(key => {
    const m1 = metrics1.get(key)
    const m2 = metrics2.get(key)
    const [c, i, o] = key.split('-')
    
    const tpsPerGpu1 = m1 ? m1.tokensPerSecond / gpuCount1 : undefined
    const tpsPerGpu2 = m2 ? m2.tokensPerSecond / gpuCount2 : undefined
    
    return `
      <tr>
        <td style="padding: 12px; font-family: monospace; font-size: 12px;">${c} / ${i} / ${o}</td>
        <td style="padding: 12px; text-align: center;">
          <div style="color: #2563eb; margin-bottom: 4px;">${m1?.ttft.toFixed(1) ?? '-'}</div>
          <div style="color: #7c3aed; font-weight: bold; margin-bottom: 4px;">${m2?.ttft.toFixed(1) ?? '-'}</div>
          ${formatDiff(m1?.ttft, m2?.ttft, true)}
        </td>
        <td style="padding: 12px; text-align: center;">
          <div style="color: #2563eb; margin-bottom: 4px;">${m1?.tpot.toFixed(1) ?? '-'}</div>
          <div style="color: #7c3aed; font-weight: bold; margin-bottom: 4px;">${m2?.tpot.toFixed(1) ?? '-'}</div>
          ${formatDiff(m1?.tpot, m2?.tpot, true)}
        </td>
        <td style="padding: 12px; text-align: center;">
          <div style="color: #2563eb; margin-bottom: 4px;">${m1?.tokensPerSecond.toFixed(1) ?? '-'}</div>
          <div style="color: #7c3aed; font-weight: bold; margin-bottom: 4px;">${m2?.tokensPerSecond.toFixed(1) ?? '-'}</div>
          ${formatDiff(m1?.tokensPerSecond, m2?.tokensPerSecond)}
        </td>
        <td style="padding: 12px; text-align: center;">
          <div style="color: #2563eb; margin-bottom: 4px;">${tpsPerGpu1?.toFixed(2) ?? '-'}</div>
          <div style="color: #7c3aed; font-weight: bold; margin-bottom: 4px;">${tpsPerGpu2?.toFixed(2) ?? '-'}</div>
          ${formatDiff(tpsPerGpu1, tpsPerGpu2)}
        </td>
      </tr>
    `
  }).join('')
  
  const now = new Date().toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM 性能对比报告 - ${benchmark1.config.modelName} vs ${benchmark2.config.modelName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }
    
    .header h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: #6b7280;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 20px;
      padding-left: 12px;
      border-left: 4px solid #3b82f6;
    }
    
    .comparison-cards {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .card {
      padding: 20px;
      border-radius: 8px;
      border: 2px solid;
    }
    
    .card-a {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    
    .card-b {
      background: #f5f3ff;
      border-color: #ddd6fe;
    }
    
    .card-title {
      font-weight: bold;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .card-a .card-title {
      color: #1e40af;
    }
    
    .card-b .card-title {
      color: #6b21a8;
    }
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .dot-blue {
      background: #3b82f6;
    }
    
    .dot-purple {
      background: #7c3aed;
    }
    
    .vs-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 900;
      color: #d1d5db;
      font-style: italic;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: center;
      font-weight: bold;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .summary-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    
    .summary-box h3 {
      color: #1e40af;
      margin-bottom: 12px;
      font-size: 18px;
    }
    
    .summary-content {
      color: #374151;
      white-space: pre-wrap;
      line-height: 1.8;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    .note {
      margin-top: 12px;
      font-size: 12px;
      color: #6b7280;
      font-style: italic;
    }
    
    .id-badge {
      display: inline-block;
      background: #e5e7eb;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      color: #374151;
      margin-left: 8px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LLM 性能基准测试对比报告</h1>
      <p class="subtitle">生成时间: ${now}</p>
    </div>
    
    <div class="section">
      <div class="comparison-cards">
        <div class="card card-a">
          <div class="card-title">
            <span class="dot dot-blue"></span>
            基准测试 A
          </div>
          <div style="font-weight: bold; color: #1e3a8a; margin: 8px 0;">${benchmark1.config.modelName}</div>
          <div style="font-size: 12px; color: #1e40af;">${benchmark1.config.serverName}</div>
          ${benchmark1.uniqueId ? `<div class="id-badge">${benchmark1.uniqueId}</div>` : ''}
        </div>
        
        <div class="vs-divider">VS</div>
        
        <div class="card card-b">
          <div class="card-title">
            <span class="dot dot-purple"></span>
            基准测试 B
          </div>
          <div style="font-weight: bold; color: #581c87; margin: 8px 0;">${benchmark2.config.modelName}</div>
          <div style="font-size: 12px; color: #6b21a8;">${benchmark2.config.serverName}</div>
          ${benchmark2.uniqueId ? `<div class="id-badge">${benchmark2.uniqueId}</div>` : ''}
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">详细配置对比</h2>
      <table>
        <tbody>
          ${configRows}
        </tbody>
      </table>
    </div>
    
    ${specialKeys.length > 0 ? `
    <div class="section">
      <h2 class="section-title">专项性能对比 (不同并发) - 上下文长度: ${selectedCombo}</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 150px;">并发数 (Concurrency)</th>
            <th>TTFT (ms)</th>
            <th>TPOT (ms)</th>
            <th>TPS (tokens/s)</th>
            <th>每卡 TPS</th>
          </tr>
        </thead>
        <tbody>
          ${specialRows}
        </tbody>
      </table>
      <div class="note">
        * 注：蓝色数值代表基准测试 A，紫色数值代表基准测试 B。百分比表示 B 相对于 A 的性能差异。
      </div>
    </div>
    ` : ''}
    
    <div class="section">
      <h2 class="section-title">性能指标对比 (A vs B)</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 150px;">测试场景 (C/I/O)</th>
            <th>TTFT (ms)<br><span style="font-size: 10px; font-weight: normal; color: #6b7280;">A vs B</span></th>
            <th>TPOT (ms)<br><span style="font-size: 10px; font-weight: normal; color: #6b7280;">A vs B</span></th>
            <th>TPS (tokens/s)<br><span style="font-size: 10px; font-weight: normal; color: #6b7280;">A vs B</span></th>
            <th>每卡 TPS<br><span style="font-size: 10px; font-weight: normal; color: #6b7280;">A vs B</span></th>
          </tr>
        </thead>
        <tbody>
          ${allMetricsRows}
        </tbody>
      </table>
      <div class="note">
        * 注：测试场景格式为"并发数 / 输入长度 / 输出长度"。百分比表示 B 相对于 A 的性能差异，绿色表示性能提升，红色表示性能下降。
      </div>
    </div>
    
    ${summary ? `
    <div class="section">
      <div class="summary-box">
        <h3>性能对比总结</h3>
        <div class="summary-content">${summary}</div>
      </div>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>本报告由 LLM 性能基准测试平台自动生成</p>
      <p>LLM Performance Comparison Platform</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Downloads the comparison report as an HTML file
 */
export function downloadComparisonHTML(data: ComparisonData): void {
  const html = generateComparisonHTML(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  const filename = `LLM性能对比报告_${data.benchmark1.config.modelName}_vs_${data.benchmark2.config.modelName}_${new Date().getTime()}.html`
  link.download = filename
  
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
