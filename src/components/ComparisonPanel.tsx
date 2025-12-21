import { Card } from '@/components/ui/card'
import { Benchmark } from '@/lib/types'

interface ComparisonPanelProps {
  benchmark1: Benchmark
  benchmark2: Benchmark
}

export function ComparisonPanel({ benchmark1, benchmark2 }: ComparisonPanelProps) {
  const ConfigRow = ({ label, value1, value2 }: { label: string; value1: string; value2: string }) => (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start py-3 border-b last:border-0">
      <div className="text-right text-sm font-medium break-words">{value1}</div>
      <div className="text-sm text-muted-foreground min-w-[120px] text-center px-2">{label}</div>
      <div className="text-sm font-medium break-words">{value2}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold mb-2 text-primary">基准测试 A</h3>
          <div className="space-y-1">
            <p className="text-sm font-bold">{benchmark1.config.modelName}</p>
            <p className="text-sm text-muted-foreground">{benchmark1.config.serverName}</p>
          </div>
        </Card>
        
        <div className="hidden md:flex items-center justify-center py-4">
          <div className="text-xl font-bold text-muted-foreground">VS</div>
        </div>
        
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold mb-2 text-primary">基准测试 B</h3>
          <div className="space-y-1">
            <p className="text-sm font-bold">{benchmark2.config.modelName}</p>
            <p className="text-sm text-muted-foreground">{benchmark2.config.serverName}</p>
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
            label="组网配置" 
            value1={benchmark1.config.networkConfig} 
            value2={benchmark2.config.networkConfig} 
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
    </div>
  )
}
