import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList } from 'recharts'
import { Benchmark, PerformanceMetrics } from '@/lib/types'
import { parseGpuCount } from '@/lib/utils'
import { ChartLine, MagnifyingGlass } from '@phosphor-icons/react'

interface MultiVersionTrendChartsProps {
  benchmarks: Benchmark[]
}

// Soft, low-saturation color palette for up to 10 versions
const VERSION_COLORS = [
  'hsl(210, 50%, 70%)', // Soft blue
  'hsl(150, 45%, 65%)', // Soft green
  'hsl(280, 45%, 70%)', // Soft purple
  'hsl(30, 55%, 70%)',  // Soft orange
  'hsl(340, 50%, 75%)', // Soft pink
  'hsl(180, 45%, 65%)', // Soft teal
  'hsl(60, 50%, 65%)',  // Soft yellow
  'hsl(200, 50%, 65%)', // Soft cyan
  'hsl(320, 45%, 70%)', // Soft magenta
  'hsl(120, 45%, 65%)', // Soft lime
]

export function MultiVersionTrendCharts({ benchmarks }: MultiVersionTrendChartsProps) {
  const [selectedVersionIds, setSelectedVersionIds] = useState<Set<string>>(new Set())
  const [selectedContextLength, setSelectedContextLength] = useState<string>('')
  const [showCharts, setShowCharts] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Get all unique I/O context length combinations
  const contextLengths = useMemo(() => {
    const combos = new Set<string>()
    benchmarks.forEach(benchmark => {
      benchmark.metrics.forEach(metric => {
        combos.add(`${metric.inputLength} / ${metric.outputLength}`)
      })
    })
    return Array.from(combos).sort((a, b) => {
      const [i1, o1] = a.split(' / ').map(Number)
      const [i2, o2] = b.split(' / ').map(Number)
      if (i1 !== i2) return i1 - i2
      return o1 - o2
    })
  }, [benchmarks])

  // Set default context length
  useMemo(() => {
    if (contextLengths.length > 0 && !selectedContextLength) {
      const defaultContext = contextLengths.includes('1024 / 1024') 
        ? '1024 / 1024' 
        : contextLengths[0]
      setSelectedContextLength(defaultContext)
    }
  }, [contextLengths, selectedContextLength])

  const handleVersionToggle = (benchmarkId: string, checked: boolean) => {
    setSelectedVersionIds(prev => {
      const newSet = new Set(prev)
      if (checked) {
        if (newSet.size >= 10) {
          return prev // Max 10 versions
        }
        newSet.add(benchmarkId)
      } else {
        newSet.delete(benchmarkId)
      }
      return newSet
    })
  }

  const selectedBenchmarks = useMemo(() => {
    return benchmarks.filter(b => selectedVersionIds.has(b.id))
  }, [benchmarks, selectedVersionIds])

  // Filter benchmarks based on search query
  const filteredBenchmarks = useMemo(() => {
    if (!searchQuery.trim()) {
      return benchmarks
    }
    
    const query = searchQuery.toLowerCase().trim()
    return benchmarks.filter(benchmark => {
      const searchFields = [
        benchmark.uniqueId,
        benchmark.config.modelName,
        benchmark.config.serverName,
        benchmark.config.chipName,
        benchmark.config.framework,
        benchmark.config.frameworkVersion,
        benchmark.config.notes,
      ]
      
      return searchFields.some(field => 
        field?.toLowerCase().includes(query)
      )
    })
  }, [benchmarks, searchQuery])

  // Aggregate metrics for each selected benchmark
  const aggregateMetrics = (metrics: PerformanceMetrics[]) => {
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

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedContextLength || selectedBenchmarks.length === 0) {
      return []
    }

    const [inputLen, outputLen] = selectedContextLength.split(' / ').map(Number)
    
    // Get all unique concurrency values for the selected context length
    const concurrencies = new Set<number>()
    selectedBenchmarks.forEach(benchmark => {
      const aggregated = aggregateMetrics(benchmark.metrics)
      aggregated.forEach((metric, key) => {
        const [c, i, o] = key.split('-').map(Number)
        if (i === inputLen && o === outputLen) {
          concurrencies.add(c)
        }
      })
    })

    const sortedConcurrencies = Array.from(concurrencies).sort((a, b) => a - b)

    return sortedConcurrencies.map(concurrency => {
      const dataPoint: any = { concurrency }
      
      selectedBenchmarks.forEach((benchmark, index) => {
        const aggregated = aggregateMetrics(benchmark.metrics)
        const key = `${concurrency}-${inputLen}-${outputLen}`
        const metric = aggregated.get(key)
        
        if (metric) {
          const gpuCount = parseGpuCount(benchmark.config.shardingConfig)
          dataPoint[`ttft_${benchmark.id}`] = metric.ttft
          dataPoint[`tpot_${benchmark.id}`] = metric.tpot
          dataPoint[`tps_${benchmark.id}`] = metric.tokensPerSecond
          dataPoint[`tpsPerGpu_${benchmark.id}`] = metric.tokensPerSecond / gpuCount
        }
      })
      
      return dataPoint
    })
  }, [selectedContextLength, selectedBenchmarks])

  const chartConfig = useMemo(() => {
    const config: any = {}
    selectedBenchmarks.forEach((benchmark, index) => {
      config[benchmark.id] = {
        label: benchmark.config.modelName,
        color: VERSION_COLORS[index % VERSION_COLORS.length],
      }
    })
    return config
  }, [selectedBenchmarks])

  const renderBarLabel = (props: any) => {
    const { x, y, width, value } = props
    if (value === undefined || value === null) return null
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#666" 
        textAnchor="middle" 
        fontSize={9}
        fontWeight="500"
      >
        {typeof value === 'number' ? value.toFixed(1) : value}
      </text>
    )
  }

  const renderLineLabel = (props: any) => {
    const { x, y, value } = props
    if (value === undefined || value === null) return null
    
    return (
      <text 
        x={x} 
        y={y - 8} 
        fill="#666" 
        textAnchor="middle" 
        fontSize={9}
        fontWeight="500"
      >
        {typeof value === 'number' ? value.toFixed(1) : value}
      </text>
    )
  }

  const renderBarChart = (metricKey: string, title: string, yAxisLabel: string) => {
    if (chartData.length === 0) return null

    return (
      <Card key={`bar-${metricKey}`} className="p-6">
        <h4 className="font-semibold mb-4 text-center text-base">{title}</h4>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="concurrency"
              type="category"
              label={{ value: '并发数', position: 'insideBottom', offset: -15 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                const concurrency = payload[0]?.payload?.concurrency
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-md">
                    <p className="font-semibold mb-2">并发数: {concurrency}</p>
                    {payload.map((entry: any, index: number) => {
                      const benchmarkId = entry.dataKey.split('_')[1]
                      const benchmark = selectedBenchmarks.find(b => b.id === benchmarkId)
                      if (!benchmark) return null
                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span>{benchmark.config.modelName}:</span>
                          <span className="font-medium">{entry.value?.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value, entry: any) => {
                const benchmarkId = value
                const benchmark = selectedBenchmarks.find(b => b.id === benchmarkId)
                return benchmark?.config.frameworkVersion || value
              }}
            />
            {selectedBenchmarks.map((benchmark, index) => (
              <Bar
                key={benchmark.id}
                dataKey={`${metricKey}_${benchmark.id}`}
                fill={VERSION_COLORS[index % VERSION_COLORS.length]}
                name={benchmark.id}
                barSize={Math.min(60, Math.floor(400 / selectedBenchmarks.length))}
              >
                <LabelList content={renderBarLabel} />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </Card>
    )
  }

  const renderTrendChart = (metricKey: string, title: string, yAxisLabel: string) => {
    if (chartData.length === 0) return null

    return (
      <Card key={`trend-${metricKey}`} className="p-6">
        <h4 className="font-semibold mb-4 text-center text-base">{title}</h4>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="concurrency"
              type="category"
              label={{ value: '并发数', position: 'insideBottom', offset: -15 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                const concurrency = payload[0]?.payload?.concurrency
                return (
                  <div className="bg-white p-3 border rounded-lg shadow-md">
                    <p className="font-semibold mb-2">并发数: {concurrency}</p>
                    {payload.map((entry: any, index: number) => {
                      const benchmarkId = entry.dataKey.split('_')[1]
                      const benchmark = selectedBenchmarks.find(b => b.id === benchmarkId)
                      if (!benchmark) return null
                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span>{benchmark.config.modelName}:</span>
                          <span className="font-medium">{entry.value?.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value, entry: any) => {
                const benchmarkId = value
                const benchmark = selectedBenchmarks.find(b => b.id === benchmarkId)
                return benchmark?.config.frameworkVersion || value
              }}
            />
            {selectedBenchmarks.map((benchmark, index) => (
              <Line
                key={benchmark.id}
                type="monotone"
                dataKey={`${metricKey}_${benchmark.id}`}
                stroke={VERSION_COLORS[index % VERSION_COLORS.length]}
                strokeWidth={2}
                name={benchmark.id}
                dot={{ r: 3, strokeWidth: 1, fill: VERSION_COLORS[index % VERSION_COLORS.length] }}
                activeDot={{ r: 5 }}
              >
                <LabelList content={renderLineLabel} />
              </Line>
            ))}
          </LineChart>
        </ChartContainer>
      </Card>
    )
  }

  const canShowCharts = selectedVersionIds.size >= 2 && selectedVersionIds.size <= 10 && selectedContextLength

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">选择性能版本进行对比 (2-10个)</h3>
        
        {/* Search input */}
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlass 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
              size={18} 
            />
            <Input
              type="text"
              placeholder="搜索：编号、模型、服务器、芯片、框架、版本号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {filteredBenchmarks.map(benchmark => (
            <div key={benchmark.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
              <Checkbox
                id={`version-${benchmark.id}`}
                checked={selectedVersionIds.has(benchmark.id)}
                onCheckedChange={(checked) => handleVersionToggle(benchmark.id, checked as boolean)}
                disabled={!selectedVersionIds.has(benchmark.id) && selectedVersionIds.size >= 10}
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`version-${benchmark.id}`}
                  className="text-sm font-medium cursor-pointer block"
                >
                  {benchmark.config.modelName}
                </Label>
                <p className="text-xs text-muted-foreground truncate">
                  {benchmark.config.serverName} · {benchmark.config.chipName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {benchmark.config.framework} · {benchmark.config.frameworkVersion}
                </p>
                {benchmark.config.notes && (
                  <p className="text-xs text-muted-foreground truncate" title={benchmark.config.notes}>
                    备注: {benchmark.config.notes}
                  </p>
                )}
                {benchmark.uniqueId && (
                  <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                    {benchmark.uniqueId}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1">
            <Label htmlFor="context-length" className="text-sm font-medium mb-2 block">
              上下文长度 (I/O)
            </Label>
            <Select value={selectedContextLength} onValueChange={setSelectedContextLength}>
              <SelectTrigger id="context-length" className="w-full">
                <SelectValue placeholder="选择上下文长度" />
              </SelectTrigger>
              <SelectContent>
                {contextLengths.map(combo => (
                  <SelectItem key={combo} value={combo}>
                    {combo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={selectedVersionIds.size >= 2 && selectedVersionIds.size <= 10 ? "default" : "secondary"}>
              已选择 {selectedVersionIds.size} 个版本
            </Badge>
            <Button
              onClick={() => setShowCharts(true)}
              disabled={!canShowCharts}
              className="gap-2"
            >
              <ChartLine size={18} weight="bold" />
              性能对比图
            </Button>
          </div>
        </div>

        {selectedVersionIds.size < 2 && (
          <p className="text-sm text-amber-600 mt-3">
            请至少选择 2 个性能版本进行对比
          </p>
        )}
        {selectedVersionIds.size > 10 && (
          <p className="text-sm text-amber-600 mt-3">
            最多只能选择 10 个性能版本
          </p>
        )}
      </Card>

      {showCharts && canShowCharts && (
        <div className="space-y-8">
          {chartData.length === 0 ? (
            <Card className="p-12">
              <p className="text-center text-muted-foreground text-lg">
                暂无该上下文长度下的性能数据
              </p>
            </Card>
          ) : (
            <>
              {/* TTFT Charts */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center">{selectedBenchmarks[0]?.config.modelName} TTFT性能对比</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {renderBarChart('ttft', 'TTFT 性能柱状图', 'TTFT (ms)')}
                  {renderTrendChart('ttft', 'TTFT 性能趋势图', 'TTFT (ms)')}
                </div>
              </div>

              {/* TPOT Charts */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center">{selectedBenchmarks[0]?.config.modelName} TPOT性能对比</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {renderBarChart('tpot', 'TPOT 性能柱状图', 'TPOT (ms)')}
                  {renderTrendChart('tpot', 'TPOT 性能趋势图', 'TPOT (ms)')}
                </div>
              </div>

              {/* TPS Charts */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center">{selectedBenchmarks[0]?.config.modelName} TPS性能对比</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {renderBarChart('tps', 'TPS 性能柱状图', 'TPS (tokens/s)')}
                  {renderTrendChart('tps', 'TPS 性能趋势图', 'TPS (tokens/s)')}
                </div>
              </div>

              {/* TPS per GPU Charts */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center">{selectedBenchmarks[0]?.config.modelName} 每卡TPS性能对比</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {renderBarChart('tpsPerGpu', '每卡 TPS 性能柱状图', '每卡 TPS')}
                  {renderTrendChart('tpsPerGpu', '每卡 TPS 性能趋势图', '每卡 TPS')}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
