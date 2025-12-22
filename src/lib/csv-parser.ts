import { BenchmarkMetricsEntry } from './types'
import Papa from 'papaparse'

/**
 * Parses CSV content and returns an array of PerformanceMetrics
 * @param csvText 
 * @returns BenchmarkMetricsEntry[]
 */
export function parseCSV(csvText: string): BenchmarkMetricsEntry[] {
  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })

  if (results.errors.length > 0) {
    console.error('CSV Parsing errors:', results.errors)
    throw new Error(`CSV解析错误: ${results.errors[0].message}`)
  }

  const data = results.data as any[]
  
  if (data.length === 0) {
    throw new Error('CSV文件没有有效的数据行')
  }

  const firstRow = data[0]
  const requiredColumns = ['Process Num', 'Input Length', 'Output Length', 'TTFT (ms)', 'TPS (with prefill)']
  const missingColumns = requiredColumns.filter(col => !(col in firstRow))

  if (missingColumns.length > 0) {
    throw new Error(`CSV文件缺少必要的列: ${missingColumns.join(', ')}`)
  }

  return data.map((row) => {
    const processNum = row['Process Num']
    const inputLength = row['Input Length']
    const outputLength = row['Output Length']
    const ttft = row['TTFT (ms)']
    const tokensPerSecond = row['TPS (with prefill)']
    const totalTime = row['Total Time (ms)'] || 0

    // Calculate TPOT (Time Per Output Token)
    // Formula: (Total Time - TTFT) / Output Length
    const tpot = totalTime > 0 && outputLength > 0 
      ? (totalTime - ttft) / outputLength 
      : 0

    return {
      inputLength,
      outputLength,
      concurrency: processNum,
      ttft,
      tpot: parseFloat(tpot.toFixed(4)),
      tokensPerSecond: parseFloat(tokensPerSecond.toFixed(4)),
    }
  })
}
