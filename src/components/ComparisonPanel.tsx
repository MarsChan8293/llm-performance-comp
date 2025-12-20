import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Benchmark } from '@/lib/types'
import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react'

interface ComparisonPanelProps {
  benchmark1: Benchmark
  benchmark2: Benchmark
}

export function ComparisonPanel({ benchmark1, benchmark2 }: ComparisonPanelProps) {
  const calculateDelta = (val1: number, val2: number, lowerIsBetter = false) => {
    const delta = val2 - val1
    const percentage = val1 !== 0 ? ((delta / val1) * 100) : 0
    const isBetter = lowerIsBetter ? delta < 0 : delta > 0
    const isEqual = Math.abs(percentage) < 0.01
    
    return { delta, percentage, isBetter, isEqual }
  }

  const MetricRow = ({ 
    label, 
    value1, 
    value2, 
    unit = '', 
    lowerIsBetter = false 
  }: { 
    label: string
    value1: number
    value2: number
    unit?: string
    lowerIsBetter?: boolean 
  }) => {
    const { delta, percentage, isBetter, isEqual } = calculateDelta(value1, value2, lowerIsBetter)
    
    return (
      <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 items-center py-2">
        <div className="text-right font-mono">{value1.toFixed(2)}{unit}</div>
        <div className="text-sm text-muted-foreground min-w-[180px] text-center">{label}</div>
        <div className="font-mono">{value2.toFixed(2)}{unit}</div>
        <div className="min-w-[100px]">
          {isEqual ? (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Minus size={14} />
              <span>0%</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isBetter ? 'text-green-600' : 'text-red-600'
            }`}>
              {delta > 0 ? <ArrowUp size={14} weight="bold" /> : <ArrowDown size={14} weight="bold" />}
              <span>{Math.abs(percentage).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    )
  }

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
        <h3 className="font-semibold mb-4 text-lg">性能指标对比</h3>
        <div className="space-y-1">
          <MetricRow 
            label="输入长度" 
            value1={benchmark1.metrics.inputLength} 
            value2={benchmark2.metrics.inputLength} 
            unit=" tokens"
          />
          <MetricRow 
            label="输出长度" 
            value1={benchmark1.metrics.outputLength} 
            value2={benchmark2.metrics.outputLength} 
            unit=" tokens"
          />
          <MetricRow 
            label="并发数" 
            value1={benchmark1.metrics.concurrency} 
            value2={benchmark2.metrics.concurrency}
          />
          <Separator className="my-3" />
          <MetricRow 
            label="首 Token 延迟（TTFT）" 
            value1={benchmark1.metrics.ttft} 
            value2={benchmark2.metrics.ttft} 
            unit=" ms"
            lowerIsBetter
          />
          <MetricRow 
            label="每 Token 延迟（TPOT）" 
            value1={benchmark1.metrics.tpot} 
            value2={benchmark2.metrics.tpot} 
            unit=" ms"
            lowerIsBetter
          />
          <MetricRow 
            label="吞吐量" 
            value1={benchmark1.metrics.tokensPerSecond} 
            value2={benchmark2.metrics.tokensPerSecond} 
            unit=" tokens/s"
          />
        </div>
      </Card>
    </div>
  )
}
