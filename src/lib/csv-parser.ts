import { BenchmarkMetricsEntry } from './types'
import Papa from 'papaparse'
import { mapHeaders, validateRequiredFields, StandardField } from './csv-header-mapper'

/**
 * Parses CSV content and returns an array of PerformanceMetrics
 * Supports multiple CSV formats with fuzzy header matching and unit conversion
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

  // Get headers from the first row
  const firstRow = data[0]
  const csvHeaders = Object.keys(firstRow)
  
  // Map headers to standard fields with fuzzy matching
  const headerMapping = mapHeaders(csvHeaders)
  
  // Validate that all required fields are present
  const missingFields = validateRequiredFields(headerMapping)
  if (missingFields.length > 0) {
    throw new Error(`CSV文件缺少必要的列: ${missingFields.join(', ')}`)
  }

  return data.map((row) => {
    // Extract values using mapped headers
    const processNumInfo = headerMapping.get(StandardField.PROCESS_NUM)
    const inputLengthInfo = headerMapping.get(StandardField.INPUT_LENGTH)
    const outputLengthInfo = headerMapping.get(StandardField.OUTPUT_LENGTH)
    const ttftInfo = headerMapping.get(StandardField.TTFT)
    const tpsInfo = headerMapping.get(StandardField.TPS)
    const totalTimeInfo = headerMapping.get(StandardField.TOTAL_TIME)
    
    // Safety check: ensure all required fields are present
    if (!processNumInfo || !inputLengthInfo || !outputLengthInfo || !ttftInfo || !tpsInfo) {
      throw new Error('Missing required field mapping')
    }
    
    const processNum = row[processNumInfo.csvColumn]
    const inputLength = row[inputLengthInfo.csvColumn]
    const outputLength = row[outputLengthInfo.csvColumn]
    let ttft = row[ttftInfo.csvColumn]
    const tokensPerSecond = row[tpsInfo.csvColumn]
    let totalTime = 0
    
    // Apply unit conversion for TTFT if needed
    if (ttftInfo.conversionFactor !== 1) {
      ttft = ttft * ttftInfo.conversionFactor
    }
    
    // Get total time with unit conversion if available
    if (totalTimeInfo) {
      totalTime = row[totalTimeInfo.csvColumn] || 0
      if (totalTimeInfo.conversionFactor !== 1) {
        totalTime = totalTime * totalTimeInfo.conversionFactor
      }
    }

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
