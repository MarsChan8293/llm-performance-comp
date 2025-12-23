import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ComparisonReport } from '@/lib/types'
import { MagnifyingGlass, Trash, CalendarBlank, ArrowsLeftRight, FileText, Copy } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'

interface ComparisonReportListProps {
  reports: ComparisonReport[]
  onViewReport: (report: ComparisonReport) => void
  onDeleteReport: (id: string) => void
  isLoading: boolean
}

export function ComparisonReportList({ 
  reports, 
  onViewReport, 
  onDeleteReport,
  isLoading 
}: ComparisonReportListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports
    const query = searchQuery.toLowerCase()
    return reports.filter(r => 
      r.uniqueId?.toLowerCase().includes(query) ||
      r.modelName1.toLowerCase().includes(query) ||
      r.modelName2.toLowerCase().includes(query) ||
      r.summary.toLowerCase().includes(query)
    )
  }, [reports, searchQuery])

  const handleCopyUniqueId = (e: React.MouseEvent, uniqueId: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(uniqueId)
    toast.success('编号已复制')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">正在加载报告...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <MagnifyingGlass
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="搜索编号、模型名称或总结内容..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <FileText size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-muted-foreground">
            {searchQuery ? '未找到匹配的报告' : '暂无对比报告'}
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {searchQuery ? '请尝试调整搜索关键词' : '在性能对比页面完成总结并保存后，报告将显示在这里'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <Card 
              key={report.id} 
              className="p-5 hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-primary/30 hover:border-l-primary"
              onClick={() => onViewReport(report)}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span className="truncate max-w-[150px] md:max-w-[250px]">{report.modelName1}</span>
                    <ArrowsLeftRight size={14} className="text-muted-foreground" />
                    <span className="truncate max-w-[150px] md:max-w-[250px]">{report.modelName2}</span>
                  </div>
                  
                  {report.uniqueId && (
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                        {report.uniqueId}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleCopyUniqueId(e, report.uniqueId)}
                        className="h-6 w-6"
                        title="复制编号"
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {report.summary}
                  </p>
                  
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60">
                    <div className="flex items-center gap-1">
                      <CalendarBlank size={12} />
                      {format(new Date(report.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('确定要删除这份对比报告吗？')) {
                      onDeleteReport(report.id)
                    }
                  }}
                >
                  <Trash size={18} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
