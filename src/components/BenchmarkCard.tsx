import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Benchmark } from '@/lib/types'
import { PencilSimple, Trash, Copy } from '@phosphor-icons/react'
import { parseGpuCount } from '@/lib/utils'
import { toast } from 'sonner'

interface BenchmarkCardProps {
  benchmark: Benchmark
  isSelected: boolean
  onSelect: (id: string, selected: boolean) => void
  onEdit: (benchmark: Benchmark) => void
  onDelete: (id: string) => void
}

export function BenchmarkCard({
  benchmark,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: BenchmarkCardProps) {
  const handleCopyUniqueId = async () => {
    if (benchmark.uniqueId) {
      try {
        await navigator.clipboard.writeText(benchmark.uniqueId)
        toast.success('编号已复制')
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = benchmark.uniqueId
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          toast.success('编号已复制')
        } catch (e) {
          toast.error('复制失败，请手动复制')
        }
        document.body.removeChild(textArea)
      }
    }
  }

  return (
    <Card className={`p-4 transition-all hover:shadow-md ${
      isSelected ? 'ring-2 ring-accent' : ''
    }`}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={`select-${benchmark.id}`}
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(benchmark.id, checked as boolean)}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg truncate">{benchmark.config.modelName}</h3>
                {benchmark.uniqueId && (
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                      {benchmark.uniqueId}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyUniqueId}
                      className="h-6 w-6"
                      title="复制编号"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Badge variant="secondary" className="mr-2">
                {benchmark.metrics.length} 条数据
              </Badge>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onEdit(benchmark)}
                className="h-8 w-8"
              >
                <PencilSimple size={16} />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onDelete(benchmark.id)}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash size={16} />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm border-t pt-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">提交人</span>
              <span className="font-medium">{benchmark.config.submitter}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">模型名称</span>
              <span className="font-medium">{benchmark.config.modelName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">服务器名称</span>
              <span className="font-medium">{benchmark.config.serverName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">切分参数</span>
              <span className="font-medium">
                {benchmark.config.shardingConfig}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({parseGpuCount(benchmark.config.shardingConfig)}卡)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">AI 芯片</span>
              <span className="font-medium">{benchmark.config.chipName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">推理框架</span>
              <span className="font-medium">{benchmark.config.framework}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">推理框架版本号</span>
              <span className="font-medium">{benchmark.config.frameworkVersion}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">测试日期</span>
              <span className="font-medium">{benchmark.config.testDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">算子加速</span>
              <span className="font-medium">{benchmark.config.operatorAcceleration || '无'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">框架启动参数</span>
              <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">
                {benchmark.config.frameworkParams || '无'}
              </span>
            </div>
            {benchmark.config.notes && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">备注</span>
                <span className="italic text-muted-foreground">{benchmark.config.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
