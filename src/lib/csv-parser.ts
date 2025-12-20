import { BenchmarkConfig, PerformanceMetrics } from './types'

export interface ParsedBenchmarkRow {
  config: Omit<BenchmarkConfig, 'testDate'>
  metrics: PerformanceMetrics
}

export function parseCSV(csvText: string): ParsedBenchmarkRow[] {
  const lines = csvText.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('CSV文件格式无效：需要至少包含标题行和一行数据')
  }

  const headers = lines[0].split(',').map(h => h.trim())
  
  const processNumIndex = headers.indexOf('Process Num')
  const inputLengthIndex = headers.indexOf('Input Length')
  const outputLengthIndex = headers.indexOf('Output Length')
  const ttftIndex = headers.indexOf('TTFT (ms)')
  const tpsWithPrefillIndex = headers.indexOf('TPS (with prefill)')
  const totalTimeIndex = headers.indexOf('Total Time (ms)')
  
  if (processNumIndex === -1 || inputLengthIndex === -1 || outputLengthIndex === -1 || 
      ttftIndex === -1 || tpsWithPrefillIndex === -1) {
    throw new Error('CSV文件缺少必要的列：Process Num, Input Length, Output Length, TTFT (ms), TPS (with prefill)')
  }

  const rows: ParsedBenchmarkRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',').map(v => v.trim())
    
    if (values.length < headers.length) continue

    const processNum = parseInt(values[processNumIndex])
    const inputLength = parseInt(values[inputLengthIndex])
    const outputLength = parseInt(values[outputLengthIndex])
    const ttft = parseFloat(values[ttftIndex])
    const tokensPerSecond = parseFloat(values[tpsWithPrefillIndex])
    const totalTime = totalTimeIndex !== -1 ? parseFloat(values[totalTimeIndex]) : 0

    if (isNaN(processNum) || isNaN(inputLength) || isNaN(outputLength) || 
        isNaN(ttft) || isNaN(tokensPerSecond)) {
      continue
    }

    const tpot = totalTime > 0 && outputLength > 0 
      ? (totalTime - ttft) / outputLength 
      : 0

    rows.push({
      config: {
        modelName: '',
        serverName: '',
        networkConfig: '',
        chipName: '',
        framework: '',
        frameworkParams: '',
      },
      metrics: {
        inputLength,
        outputLength,
        concurrency: processNum,
        ttft,
        tpot: parseFloat(tpot.toFixed(4)),
        tokensPerSecond: parseFloat(tokensPerSecond.toFixed(4)),
      },
    })
  }

  if (rows.length === 0) {
    throw new Error('CSV文件中没有有效的数据行')
  }

  return rows
}
