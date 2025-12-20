import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Benchmark } from '@/lib/types'
import { PencilSimple, Trash, ChartBar } from '@phosphor-icons/react'

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
  onDelete 
}: BenchmarkCardProps) {
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
              <h3 className="font-semibold text-lg truncate">{benchmark.config.modelName}</h3>
              <p className="text-sm text-muted-foreground">{benchmark.config.serverName}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
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

          <div className="flex gap-2 flex-wrap mb-3">
            <Badge variant="outline">{benchmark.config.chipName}</Badge>
            <Badge variant="outline">{benchmark.config.framework}</Badge>
            <Badge variant="outline">{benchmark.config.networkConfig}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">TTFT</p>
              <p className="font-mono font-medium">{benchmark.metrics.ttft.toFixed(2)} ms</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">TPOT</p>
              <p className="font-mono font-medium">{benchmark.metrics.tpot.toFixed(2)} ms</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Throughput</p>
              <p className="font-mono font-medium">{benchmark.metrics.tokensPerSecond.toFixed(2)} tok/s</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Concurrency</p>
              <p className="font-mono font-medium">{benchmark.metrics.concurrency}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Input/Output</p>
              <p className="font-mono font-medium">{benchmark.metrics.inputLength}/{benchmark.metrics.outputLength}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Test Date</p>
              <p className="font-medium">{benchmark.config.testDate}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
