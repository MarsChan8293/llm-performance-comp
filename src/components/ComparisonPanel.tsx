import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Benchmark } from '@/lib/types'
import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react'

interface ComparisonPanelProps {
  benchmark1: Benchmark
  benchmark2: Benchmark
}

type AggregatedMetric = {
  concurrency: number
  inputLength: number
  outputLength: number
  ttft: number
  tpot: number
  tokensPerSecond: number
}

type AggregatedMap = Map<string, AggregatedMetric>

const keyFromMetric = (m: AggregatedMetric | Benchmark['metrics'][number]) =>
  `${m.concurrency}-${m.inputLength}-${m.outputLength}`

const averageMetrics = (metrics: Benchmark['metrics']): AggregatedMap => {
  const map: AggregatedMap = new Map()
  metrics.forEach((m) => {
    const key = keyFromMetric(m)
    const current = map.get(key)
    if (!current) {
      map.set(key, { ...m })
    } else {
      const countKey = `${key}-count`
      const counts = (map as unknown as Record<string, number>)[countKey] ?? 1
      const nextCount = counts + 1
      map.set(key, {
        concurrency: (current.concurrency * counts + m.concurrency) / nextCount,
        inputLength: (current.inputLength * counts + m.inputLength) / nextCount,
        outputLength: (current.outputLength * counts + m.outputLength) / nextCount,
        ttft: (current.ttft * counts + m.ttft) / nextCount,
        tpot: (current.tpot * counts + m.tpot) / nextCount,
        tokensPerSecond: (current.tokensPerSecond * counts + m.tokensPerSecond) / nextCount,
      })
      ;(map as unknown as Record<string, number>)[countKey] = nextCount
    }
  })
  return map
}

const buildRows = (mapA: AggregatedMap, mapB: AggregatedMap) => {
  const keys = new Set<string>([...mapA.keys(), ...mapB.keys()])
  return Array.from(keys)
    .map((key) => {
      const [concurrency, inputLength, outputLength] = key.split('-').map(Number)
      return {
        key,
        concurrency,
        inputLength,
        outputLength,
        a: mapA.get(key),
        b: mapB.get(key),
      }
    })
    .sort((a, b) => {
      if (a.concurrency !== b.concurrency) return a.concurrency - b.concurrency
      if (a.inputLength !== b.inputLength) return a.inputLength - b.inputLength
      return a.outputLength - b.outputLength
    })
}

const deltaInfo = (valA?: number, valB?: number, lowerIsBetter = false) => {
  if (valA === undefined || valB === undefined) return null
  const delta = valB - valA
  const percentage = valA !== 0 ? (delta / valA) * 100 : 0
  const isBetter = lowerIsBetter ? delta < 0 : delta > 0
  const isEqual = Math.abs(percentage) < 0.01
  return { delta, percentage, isBetter, isEqual }
}

export function ComparisonPanel({ benchmark1, benchmark2 }: ComparisonPanelProps) {
  const mapA = averageMetrics(benchmark1.metrics)
  const mapB = averageMetrics(benchmark2.metrics)
  const rows = buildRows(mapA, mapB)

  const ConfigRow = ({ label, value1, value2 }: { label: string; value1: string; value2: string }) => (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start py-2">
      <div className="text-right text-sm break-words">{value1}</div>
      <div className="text-sm text-muted-foreground min-w-[180px] text-center">{label}</div>
      <div className="text-sm break-words">{value2}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold mb-2">基准测试 A</h3>
          <div className="space-y-1">
            <p className="text-sm"><span className="text-muted-foreground">模型：</span> {benchmark1.config.modelName}</p>
            <p className="text-sm"><span className="text-muted-foreground">服务器：</span> {benchmark1.config.serverName}</p>
            <div className="flex gap-2 flex-wrap mt-2">
              <Badge variant="secondary">{benchmark1.config.chipName}</Badge>
              <Badge variant="secondary">{benchmark1.config.framework}</Badge>
            </div>
          </div>
        </Card>
        
        <div className="hidden md:flex items-center justify-center py-8">
          <div className="text-2xl font-bold text-muted-foreground">对比</div>
        </div>
        
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold mb-2">基准测试 B</h3>
          <div className="space-y-1">
            <p className="text-sm"><span className="text-muted-foreground">模型：</span> {benchmark2.config.modelName}</p>
            <p className="text-sm"><span className="text-muted-foreground">服务器：</span> {benchmark2.config.serverName}</p>
            <div className="flex gap-2 flex-wrap mt-2">
              <Badge variant="secondary">{benchmark2.config.chipName}</Badge>
              <Badge variant="secondary">{benchmark2.config.framework}</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-lg">配置对比</h3>
        <div className="space-y-1">
          <ConfigRow 
            label="组网配置" 
            value1={benchmark1.config.networkConfig} 
            value2={benchmark2.config.networkConfig} 
          />
          <ConfigRow 
            label="框架参数" 
            value1={benchmark1.config.frameworkParams || '无'} 
            value2={benchmark2.config.frameworkParams || '无'} 
          />
          <ConfigRow 
            label="测试日期" 
            value1={benchmark1.config.testDate} 
            value2={benchmark2.config.testDate} 
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-lg">性能指标对比（按输入组合逐行展示）</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Process Num</TableHead>
                <TableHead className="w-28">Input Length</TableHead>
                <TableHead className="w-28">Output Length</TableHead>
                <TableHead className="text-right">A · TTFT (ms)</TableHead>
                <TableHead className="text-right">B · TTFT (ms)</TableHead>
                <TableHead className="text-right">Δ TTFT</TableHead>
                <TableHead className="text-right">A · TPOT (ms)</TableHead>
                <TableHead className="text-right">B · TPOT (ms)</TableHead>
                <TableHead className="text-right">Δ TPOT</TableHead>
                <TableHead className="text-right">A · TPS</TableHead>
                <TableHead className="text-right">B · TPS</TableHead>
                <TableHead className="text-right">Δ TPS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const ttftDelta = deltaInfo(row.a?.ttft, row.b?.ttft, true)
                const tpotDelta = deltaInfo(row.a?.tpot, row.b?.tpot, true)
                const tpsDelta = deltaInfo(row.a?.tokensPerSecond, row.b?.tokensPerSecond, false)

                const renderDelta = (delta: ReturnType<typeof deltaInfo>) => {
                  if (!delta) return <span className="text-muted-foreground">—</span>
                  if (delta.isEqual) return (
                    <div className="flex items-center justify-end gap-1 text-muted-foreground text-sm">
                      <Minus size={12} />
                      <span>0%</span>
                    </div>
                  )
                  return (
                    <div className={`flex items-center justify-end gap-1 text-sm font-medium ${
                      delta.isBetter ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {delta.delta > 0 ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
                      <span>{Math.abs(delta.percentage).toFixed(1)}%</span>
                    </div>
                  )
                }

                const renderVal = (val?: number) =>
                  val === undefined ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className="font-mono">{val.toFixed(2)}</span>
                  )

                return (
                  <TableRow key={row.key}>
                    <TableCell className="font-mono">{row.concurrency}</TableCell>
                    <TableCell className="font-mono">{row.inputLength}</TableCell>
                    <TableCell className="font-mono">{row.outputLength}</TableCell>
                    <TableCell className="text-right">{renderVal(row.a?.ttft)}</TableCell>
                    <TableCell className="text-right">{renderVal(row.b?.ttft)}</TableCell>
                    <TableCell className="text-right">{renderDelta(ttftDelta)}</TableCell>
                    <TableCell className="text-right">{renderVal(row.a?.tpot)}</TableCell>
                    <TableCell className="text-right">{renderVal(row.b?.tpot)}</TableCell>
                    <TableCell className="text-right">{renderDelta(tpotDelta)}</TableCell>
                    <TableCell className="text-right">{renderVal(row.a?.tokensPerSecond)}</TableCell>
                    <TableCell className="text-right">{renderVal(row.b?.tokensPerSecond)}</TableCell>
                    <TableCell className="text-right">{renderDelta(tpsDelta)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Δ 为 B 相对 A 的变化百分比；TTFT/TPOT 下降为好，TPS 上升为好。</p>
      </Card>
    </div>
  )
}
