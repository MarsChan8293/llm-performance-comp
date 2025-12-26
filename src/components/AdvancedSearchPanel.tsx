import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarBlank, MagnifyingGlass, X } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export interface AdvancedSearchFilters {
  submitter?: string
  modelName?: string
  serverName?: string
  shardingConfig?: string
  chipName?: string
  framework?: string
  frameworkVersion?: string
  startDate?: Date
  endDate?: Date
  operatorAcceleration?: string
  notes?: string
  frameworkParams?: string
}

interface AdvancedSearchPanelProps {
  onSearch: (filters: AdvancedSearchFilters) => void
  onReset: () => void
}

export function AdvancedSearchPanel({ onSearch, onReset }: AdvancedSearchPanelProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({})

  const handleInputChange = (field: keyof AdvancedSearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }))
  }

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: date
    }))
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters({})
    onReset()
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '')

  return (
    <div className="w-80 bg-card border-r p-4 space-y-4 overflow-y-auto h-full">
      <div className="sticky top-0 bg-card pb-3 border-b mb-2">
        <h2 className="text-lg font-semibold mb-1">高级搜索</h2>
        <p className="text-xs text-muted-foreground">多条件精确筛选基准测试</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="submitter">提交人</Label>
          <Input
            id="submitter"
            placeholder="输入提交人姓名"
            value={filters.submitter || ''}
            onChange={(e) => handleInputChange('submitter', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelName">模型名称</Label>
          <Input
            id="modelName"
            placeholder="输入模型名称"
            value={filters.modelName || ''}
            onChange={(e) => handleInputChange('modelName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serverName">服务器名称</Label>
          <Input
            id="serverName"
            placeholder="输入服务器名称"
            value={filters.serverName || ''}
            onChange={(e) => handleInputChange('serverName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shardingConfig">切分参数</Label>
          <Input
            id="shardingConfig"
            placeholder="例如: tp=8"
            value={filters.shardingConfig || ''}
            onChange={(e) => handleInputChange('shardingConfig', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chipName">AI芯片</Label>
          <Input
            id="chipName"
            placeholder="输入芯片名称"
            value={filters.chipName || ''}
            onChange={(e) => handleInputChange('chipName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="framework">推理框架</Label>
          <Input
            id="framework"
            placeholder="输入推理框架"
            value={filters.framework || ''}
            onChange={(e) => handleInputChange('framework', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frameworkVersion">推理框架版本号</Label>
          <Input
            id="frameworkVersion"
            placeholder="输入版本号"
            value={filters.frameworkVersion || ''}
            onChange={(e) => handleInputChange('frameworkVersion', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>测试日期范围</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">起始日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="startDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarBlank size={16} className="mr-2" />
                    {filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : "选择日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => handleDateChange('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">结束日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="endDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarBlank size={16} className="mr-2" />
                    {filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : "选择日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => handleDateChange('endDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operatorAcceleration">算子加速</Label>
          <Input
            id="operatorAcceleration"
            placeholder="输入算子加速方式"
            value={filters.operatorAcceleration || ''}
            onChange={(e) => handleInputChange('operatorAcceleration', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">备注</Label>
          <Input
            id="notes"
            placeholder="模糊搜索备注内容"
            value={filters.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">支持模糊匹配</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frameworkParams">框架启动参数</Label>
          <Input
            id="frameworkParams"
            placeholder="模糊搜索框架启动参数"
            value={filters.frameworkParams || ''}
            onChange={(e) => handleInputChange('frameworkParams', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">支持模糊匹配</p>
        </div>
      </div>

      <div className="sticky bottom-0 bg-card pt-4 border-t space-y-2">
        <Button 
          onClick={handleSearch} 
          className="w-full"
          disabled={!hasActiveFilters}
        >
          <MagnifyingGlass size={18} className="mr-2" weight="bold" />
          搜索
        </Button>
        <Button 
          onClick={handleReset} 
          variant="outline" 
          className="w-full"
          disabled={!hasActiveFilters}
        >
          <X size={18} className="mr-2" />
          清空筛选
        </Button>
      </div>
    </div>
  )
}
