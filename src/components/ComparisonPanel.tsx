import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Benchmark, PerformanceMetrics, ComparisonReport } from '@/lib/types'
import { CaretUp, CaretDown, FloppyDisk, FileText, Plus } from '@phosphor-icons/react'
import { cn, parseGpuCount } from '@/lib/utils'
import { useDbReports } from '@/hooks/use-db-reports'
import { toast } from 'sonner'

interface ComparisonPanelProps {
  benchmark1: Benchmark
  benchmark2: Benchmark
}

export function ComparisonPanel({ benchmark1, benchmark2 }: ComparisonPanelProps) {
  const { reports, addReport } = useDbReports()
  const [summary, setSummary] = useState('')
  const [isOverwriteDialogOpen, setIsOverwriteDialogOpen] = useState(false)
  const [existingReport, setExistingReport] = useState<ComparisonReport | null>(null)

  const gpuCount1 = useMemo(() => parseGpuCount(benchmark1.config.shardingConfig), [benchmark1.config.shardingConfig])
  const gpuCount2 = useMemo(() => parseGpuCount(benchmark2.config.shardingConfig), [benchmark2.config.shardingConfig])

  // Check for existing report for this pair
  useEffect(() => {
    const found = reports.find(r => 
      (r.benchmarkId1 === benchmark1.id && r.benchmarkId2 === benchmark2.id) ||
      (r.benchmarkId1 === benchmark2.id && r.benchmarkId2 === benchmark1.id)
    )
    if (found) {
      setExistingReport(found)
      setSummary(found.summary)
    } else {
      setExistingReport(null)
      setSummary('')
    }
  }, [reports, benchmark1.id, benchmark2.id])

  const handleSaveReport = async (overwrite = false) => {
    if (!summary.trim()) {
      toast.error('请输入总结内容')
      return
    }

    if (existingReport && !overwrite) {
      setIsOverwriteDialogOpen(true)
      return
    }

    const report: ComparisonReport = {
      id: overwrite && existingReport ? existingReport.id : Date.now().toString(),
      benchmarkId1: benchmark1.id,
      benchmarkId2: benchmark2.id,
      modelName1: benchmark1.config.modelName,
      modelName2: benchmark2.config.modelName,
      summary: summary.trim(),
      createdAt: new Date().toISOString()
    }

    const success = await addReport(report)
    if (success) {
      toast.success(overwrite ? '报告已更新' : '报告已保存')
      setIsOverwriteDialogOpen(false)
    }
  }

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

  const metrics1 = aggregateMetrics(benchmark1.metrics)
  const metrics2 = aggregateMetrics(benchmark2.metrics)

  // Get all unique keys from both benchmarks
  const allKeys = Array.from(new Set([...metrics1.keys(), ...metrics2.keys()])).sort((a, b) => {
    const [c1, i1, o1] = a.split('-').map(Number)
    const [c2, i2, o2] = b.split('-').map(Number)
    if (c1 !== c2) return c1 - c2
    if (i1 !== i2) return i1 - i2
    return o1 - o2
  })

  // Get all unique input/output combinations
  const ioCombinations = useMemo(() => {
    const combos = new Set<string>()
    allKeys.forEach(key => {
      const [, i, o] = key.split('-')
      combos.add(`${i} / ${o}`)
    })
    return Array.from(combos).sort((a, b) => {
      const [i1, o1] = a.split(' / ').map(Number)
      const [i2, o2] = b.split(' / ').map(Number)
      if (i1 !== i2) return i1 - i2
      return o1 - o2
    })
  }, [allKeys])

  const [selectedCombo, setSelectedCombo] = useState(() => {
    return ioCombinations.includes('1024 / 1024') ? '1024 / 1024' : ioCombinations[0]
  })

  const specialKeys = allKeys.filter(key => {
    const [, i, o] = key.split('-')
    return `${i} / ${o}` === selectedCombo
  })

  const formatDiff = (val1: number | undefined, val2: number | undefined, inverse = false) => {
    if (val1 === undefined || val2 === undefined) return null
    const diff = ((val2 - val1) / val1) * 100
    const isBetter = inverse ? diff < 0 : diff > 0
    const isWorse = inverse ? diff > 0 : diff < 0

    return (
      <span className={cn(
        "text-xs font-medium flex items-center gap-0.5",
        isBetter ? "text-emerald-600" : isWorse ? "text-rose-600" : "text-muted-foreground"
      )}>
        {diff > 0 ? <CaretUp size={12} /> : diff < 0 ? <CaretDown size={12} /> : null}
        {Math.abs(diff).toFixed(1)}%
      </span>
    )
  }

  const ConfigRow = ({ label, value1, value2 }: { label: string; value1: string; value2: string }) => (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start py-3 border-b last:border-0">
      <div className="text-right text-sm font-medium break-words text-blue-600">{value1}</div>
      <div className="text-sm text-muted-foreground min-w-[120px] text-center px-2">{label}</div>
      <div className="text-sm font-medium break-words text-purple-600">{value2}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <Card className="p-4 border-blue-200 bg-blue-50/30">
          <h3 className="font-semibold mb-2 text-blue-700 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            基准测试 A
          </h3>
          <div className="space-y-1">
            <p className="text-sm font-bold text-blue-900">{benchmark1.config.modelName}</p>
            <p className="text-xs text-blue-700/70">{benchmark1.config.serverName}</p>
          </div>
        </Card>
        
        <div className="hidden md:flex items-center justify-center py-4">
          <div className="text-xl font-black text-muted-foreground/30 italic">VS</div>
        </div>
        
        <Card className="p-4 border-purple-200 bg-purple-50/30">
          <h3 className="font-semibold mb-2 text-purple-700 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            基准测试 B
          </h3>
          <div className="space-y-1">
            <p className="text-sm font-bold text-purple-900">{benchmark2.config.modelName}</p>
            <p className="text-xs text-purple-700/70">{benchmark2.config.serverName}</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-6 text-lg flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          详细配置对比
        </h3>
        <div className="space-y-1">
          <ConfigRow 
            label="提交人" 
            value1={benchmark1.config.submitter} 
            value2={benchmark2.config.submitter} 
          />
          <ConfigRow 
            label="模型名称" 
            value1={benchmark1.config.modelName} 
            value2={benchmark2.config.modelName} 
          />
          <ConfigRow 
            label="服务器名称" 
            value1={benchmark1.config.serverName} 
            value2={benchmark2.config.serverName} 
          />
          <ConfigRow 
            label="AI 芯片" 
            value1={benchmark1.config.chipName} 
            value2={benchmark2.config.chipName} 
          />
          <ConfigRow 
            label="推理框架" 
            value1={benchmark1.config.framework} 
            value2={benchmark2.config.framework} 
          />
          <ConfigRow 
            label="切分参数" 
            value1={benchmark1.config.shardingConfig} 
            value2={benchmark2.config.shardingConfig} 
          />
          <ConfigRow 
            label="算子加速" 
            value1={benchmark1.config.operatorAcceleration || '无'} 
            value2={benchmark2.config.operatorAcceleration || '无'} 
          />
          <ConfigRow 
            label="框架启动参数" 
            value1={benchmark1.config.frameworkParams || '无'} 
            value2={benchmark2.config.frameworkParams || '无'} 
          />
          <ConfigRow 
            label="测试日期" 
            value1={benchmark1.config.testDate} 
            value2={benchmark2.config.testDate} 
          />
          <ConfigRow 
            label="备注" 
            value1={benchmark1.config.notes || '无'} 
            value2={benchmark2.config.notes || '无'} 
          />
          <ConfigRow 
            label="测试数据量" 
            value1={`${benchmark1.metrics.length} 条`} 
            value2={`${benchmark2.metrics.length} 条`} 
          />
        </div>
      </Card>

      {specialKeys.length > 0 && (
        <Card className="p-6 border-amber-200 bg-amber-50/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-amber-700">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              专项性能对比 (不同并发)
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">上下文长度 (I/O):</span>
              <Select value={selectedCombo} onValueChange={setSelectedCombo}>
                <SelectTrigger className="w-[180px] bg-white border-amber-200 text-amber-900">
                  <SelectValue placeholder="选择上下文长度" />
                </SelectTrigger>
                <SelectContent>
                  {ioCombinations.map(combo => (
                    <SelectItem key={combo} value={combo}>
                      {combo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-100/50">
                  <TableHead className="w-[150px]">并发数 (Concurrency)</TableHead>
                  <TableHead className="text-center">TTFT (ms)</TableHead>
                  <TableHead className="text-center">TPOT (ms)</TableHead>
                  <TableHead className="text-center">TPS (tokens/s)</TableHead>
                  <TableHead className="text-center">每卡 TPS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialKeys.map(key => {
                  const m1 = metrics1.get(key)
                  const m2 = metrics2.get(key)
                  const [c] = key.split('-')

                  const tpsPerGpu1 = m1 ? m1.tokensPerSecond / gpuCount1 : undefined
                  const tpsPerGpu2 = m2 ? m2.tokensPerSecond / gpuCount2 : undefined

                  return (
                    <TableRow key={`special-${key}`}>
                      <TableCell className="font-bold text-amber-900">
                        {c} 并发
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-blue-600 font-medium">{m1?.ttft.toFixed(1) ?? '-'}</span>
                            <span className="text-purple-600 font-bold">{m2?.ttft.toFixed(1) ?? '-'}</span>
                          </div>
                          {formatDiff(m1?.ttft, m2?.ttft, true)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-blue-600 font-medium">{m1?.tpot.toFixed(1) ?? '-'}</span>
                            <span className="text-purple-600 font-bold">{m2?.tpot.toFixed(1) ?? '-'}</span>
                          </div>
                          {formatDiff(m1?.tpot, m2?.tpot, true)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-blue-600 font-medium">{m1?.tokensPerSecond.toFixed(1) ?? '-'}</span>
                            <span className="text-purple-600 font-bold">{m2?.tokensPerSecond.toFixed(1) ?? '-'}</span>
                          </div>
                          {formatDiff(m1?.tokensPerSecond, m2?.tokensPerSecond)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-blue-600 font-medium">{tpsPerGpu1?.toFixed(2) ?? '-'}</span>
                            <span className="text-purple-600 font-bold">{tpsPerGpu2?.toFixed(2) ?? '-'}</span>
                          </div>
                          {formatDiff(tpsPerGpu1, tpsPerGpu2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold mb-6 text-lg flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          性能指标对比 (A vs B)
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[150px]">测试场景 (C/I/O)</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>TTFT (ms)</span>
                    <div className="flex gap-2 text-[10px] mt-1">
                      <span className="text-blue-600">A</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="text-purple-600">B</span>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>TPOT (ms)</span>
                    <div className="flex gap-2 text-[10px] mt-1">
                      <span className="text-blue-600">A</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="text-purple-600">B</span>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>TPS (tokens/s)</span>
                    <div className="flex gap-2 text-[10px] mt-1">
                      <span className="text-blue-600">A</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="text-purple-600">B</span>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>每卡 TPS</span>
                    <div className="flex gap-2 text-[10px] mt-1">
                      <span className="text-blue-600">A</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="text-purple-600">B</span>
                    </div>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allKeys.map(key => {
                const m1 = metrics1.get(key)
                const m2 = metrics2.get(key)
                const [c, i, o] = key.split('-')

                const tpsPerGpu1 = m1 ? m1.tokensPerSecond / gpuCount1 : undefined
                const tpsPerGpu2 = m2 ? m2.tokensPerSecond / gpuCount2 : undefined

                return (
                  <TableRow key={key}>
                    <TableCell className="font-mono text-xs">
                      {c} / {i} / {o}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-600 font-medium">{m1?.ttft.toFixed(1) ?? '-'}</span>
                          <span className="text-purple-600 font-bold">{m2?.ttft.toFixed(1) ?? '-'}</span>
                        </div>
                        {formatDiff(m1?.ttft, m2?.ttft, true)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-600 font-medium">{m1?.tpot.toFixed(1) ?? '-'}</span>
                          <span className="text-purple-600 font-bold">{m2?.tpot.toFixed(1) ?? '-'}</span>
                        </div>
                        {formatDiff(m1?.tpot, m2?.tpot, true)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-600 font-medium">{m1?.tokensPerSecond.toFixed(1) ?? '-'}</span>
                          <span className="text-purple-600 font-bold">{m2?.tokensPerSecond.toFixed(1) ?? '-'}</span>
                        </div>
                        {formatDiff(m1?.tokensPerSecond, m2?.tokensPerSecond)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-600 font-medium">{tpsPerGpu1?.toFixed(2) ?? '-'}</span>
                          <span className="text-purple-600 font-bold">{tpsPerGpu2?.toFixed(2) ?? '-'}</span>
                        </div>
                        {formatDiff(tpsPerGpu1, tpsPerGpu2)}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground italic">
          * 注：测试场景格式为“并发数 / 输入长度 / 输出长度”。百分比表示 B 相对于 A 的性能差异，绿色表示性能提升，红色表示性能下降。
        </p>
      </Card>

      <Card className="p-6 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={24} className="text-primary" weight="duotone" />
          <h3 className="font-semibold text-lg">性能对比总结</h3>
          {existingReport && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              已有报告
            </span>
          )}
        </div>
        
        <div className="space-y-4">
          <Textarea
            placeholder="在此输入人工总结的关键差异、性能瓶颈或推荐建议..."
            className="min-h-[150px] bg-background/50 resize-none"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          
          <div className="flex justify-end gap-3">
            {existingReport && (
              <Button 
                variant="outline" 
                onClick={() => handleSaveReport(false)}
                className="gap-2"
              >
                <Plus size={18} />
                另存为新报告
              </Button>
            )}
            <Button 
              onClick={() => handleSaveReport(!!existingReport)}
              className="gap-2"
            >
              <FloppyDisk size={18} />
              {existingReport ? '更新现有报告' : '保存对比报告'}
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={isOverwriteDialogOpen} onOpenChange={setIsOverwriteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>发现现有报告</AlertDialogTitle>
            <AlertDialogDescription>
              这两个模型之间已经存在一份对比报告。您想覆盖现有报告，还是将其另存为一份新报告？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOverwriteDialogOpen(false)}>取消</AlertDialogCancel>
            <Button variant="outline" onClick={() => {
              setIsOverwriteDialogOpen(false);
              handleSaveReport(false);
            }}>另存为新报告</Button>
            <AlertDialogAction onClick={() => handleSaveReport(true)}>覆盖现有报告</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
