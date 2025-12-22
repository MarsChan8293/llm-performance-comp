export interface BenchmarkConfig {
  modelName: string
  serverName: string
  shardingConfig: string
  chipName: string
  framework: string
  frameworkParams: string
  testDate: string
  submitter: string
  operatorAcceleration?: string
  notes?: string
}

export interface PerformanceMetrics {
  inputLength: number
  outputLength: number
  concurrency: number
  ttft: number
  tpot: number
  tokensPerSecond: number
}

// Multiple metric entries are supported per benchmark to represent one dataset.
export type BenchmarkMetricsEntry = PerformanceMetrics

export interface Benchmark {
  id: string
  config: BenchmarkConfig
  metrics: BenchmarkMetricsEntry[]
  createdAt: string
}

export type MessageType = 'feedback' | 'feature_request'

export interface Message {
  id: string
  type: MessageType
  content: string
  author: string
  createdAt: string
}

export interface ComparisonReport {
  id: string
  benchmarkId1: string
  benchmarkId2: string
  modelName1: string
  modelName2: string
  summary: string
  createdAt: string
}
