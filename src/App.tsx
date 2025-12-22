import { useState, useMemo } from 'react'
import { useDbBenchmarks } from '@/hooks/use-db-benchmarks'
import { useDbReports } from '@/hooks/use-db-reports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { BenchmarkForm } from '@/components/BenchmarkForm'
import { CSVImportForm } from '@/components/CSVImportForm'
import { BenchmarkCard } from '@/components/BenchmarkCard'
import { ComparisonPanel } from '@/components/ComparisonPanel'
import { ComparisonReportList } from '@/components/ComparisonReportList'
import { MessageBoard } from '@/components/MessageBoard'
import { Benchmark, BenchmarkConfig, BenchmarkMetricsEntry, ComparisonReport } from '@/lib/types'
import { Plus, MagnifyingGlass, ArrowsLeftRight, ChartBar, FileArrowDown, FileText } from '@phosphor-icons/react'
import { toast } from 'sonner'

function App() {
  const { benchmarks, addBenchmark, deleteBenchmark, importBenchmarks, isLoading: isBenchmarksLoading } = useDbBenchmarks()
  const { reports, deleteReport, isLoading: isReportsLoading } = useDbReports()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false)
  const [editingBenchmark, setEditingBenchmark] = useState<Benchmark | undefined>()
  const [activeTab, setActiveTab] = useState('list')

  const isLoading = isBenchmarksLoading || isReportsLoading

  const filteredBenchmarks = useMemo(() => {
    const allBenchmarks = benchmarks || []
    if (!searchQuery.trim()) return allBenchmarks

    const query = searchQuery.toLowerCase()
    return allBenchmarks.filter(
      (b) =>
        b.config.modelName.toLowerCase().includes(query) ||
        b.config.serverName.toLowerCase().includes(query) ||
        b.config.chipName.toLowerCase().includes(query) ||
        b.config.framework.toLowerCase().includes(query) ||
        b.config.shardingConfig.toLowerCase().includes(query) ||
        b.config.submitter.toLowerCase().includes(query) ||
        (b.config.operatorAcceleration || '').toLowerCase().includes(query)
    )
  }, [benchmarks, searchQuery])

  const selectedBenchmarks = useMemo(() => {
    const allBenchmarks = benchmarks || []
    return allBenchmarks.filter((b) => selectedIds.has(b.id))
  }, [benchmarks, selectedIds])

  const handleSave = async (config: BenchmarkConfig, metrics: BenchmarkMetricsEntry[]) => {
    if (editingBenchmark) {
      const updated = await addBenchmark({ ...editingBenchmark, config, metrics })
      if (updated) toast.success('基准测试更新成功')
    } else {
      const newBenchmark: Benchmark = {
        id: crypto.randomUUID(),
        config,
        metrics,
        createdAt: new Date().toISOString(),
      }
      const added = await addBenchmark(newBenchmark)
      if (added) toast.success('基准测试添加成功')
    }
    setIsFormOpen(false)
    setEditingBenchmark(undefined)
  }

  const handleCSVImport = async (config: BenchmarkConfig, file: File) => {
    await importBenchmarks({ config, file })
    setIsCSVImportOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条基准测试吗？关联的对比报告也将被永久删除。')) {
      return
    }
    const deleted = await deleteBenchmark(id)
    if (deleted) {
      setSelectedIds((current) => {
        const newSet = new Set(current)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((current) => {
      const newSet = new Set(current)
      if (selected) {
        if (newSet.size >= 2) {
          toast.error('只能选择 2 个基准测试进行对比')
          return current
        }
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleEdit = (benchmark: Benchmark) => {
    setEditingBenchmark(benchmark)
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingBenchmark(undefined)
    setIsFormOpen(true)
  }

  const handleCompare = () => {
    if (selectedIds.size === 2) {
      setActiveTab('compare')
    }
  }

  const handleViewReport = (report: ComparisonReport) => {
    // Check if both benchmarks still exist
    const b1 = benchmarks.find(b => b.id === report.benchmarkId1)
    const b2 = benchmarks.find(b => b.id === report.benchmarkId2)
    
    if (!b1 || !b2) {
      toast.error('关联的基准测试数据已不存在')
      return
    }

    setSelectedIds(new Set([report.benchmarkId1, report.benchmarkId2]))
    setActiveTab('compare')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-[1600px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 xl:col-span-9">
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <ChartBar size={40} weight="duotone" className="text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  LLM 性能基准测试
                </h1>
              </div>
              <p className="text-muted-foreground">
                上传、管理并对比不同配置下的 AI 模型推理性能数据
              </p>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <TabsList>
                  <TabsTrigger value="list">所有基准测试</TabsTrigger>
                  <TabsTrigger value="compare" disabled={selectedIds.size !== 2}>
                    性能对比
                    {selectedIds.size > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedIds.size}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="reports">
                    对比报告
                    {reports.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {reports.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2 w-full md:w-auto">
                  {selectedIds.size === 2 && activeTab === 'list' && (
                    <Button onClick={handleCompare} variant="outline" className="flex-1 md:flex-none">
                      <ArrowsLeftRight size={18} className="mr-2" />
                      性能对比
                    </Button>
                  )}
                  <Button 
                    onClick={() => setIsCSVImportOpen(true)} 
                    variant="outline" 
                    className="flex-1 md:flex-none"
                  >
                    <FileArrowDown size={18} weight="bold" className="mr-2" />
                    导入 CSV
                  </Button>
                  <Button onClick={handleAddNew} className="flex-1 md:flex-none">
                    <Plus size={18} weight="bold" className="mr-2" />
                    手动添加
                  </Button>
                </div>
              </div>

              <TabsContent value="list" className="space-y-4">
                <div className="relative">
                  <MagnifyingGlass
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="搜索模型、服务器、芯片、框架..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isLoading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">正在从数据库加载数据...</p>
                  </div>
                ) : filteredBenchmarks.length === 0 ? (
                  <div className="text-center py-16">
                    <ChartBar size={64} className="mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">
                      {searchQuery ? '未找到相关基准测试' : '暂无基准测试数据'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery
                        ? '请尝试调整搜索关键词'
                        : '通过导入 CSV 文件批量添加或手动添加单条测试数据'}
                    </p>
                    {!searchQuery && (
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => setIsCSVImportOpen(true)} variant="outline">
                          <FileArrowDown size={18} weight="bold" className="mr-2" />
                          导入 CSV
                        </Button>
                        <Button onClick={handleAddNew}>
                          <Plus size={18} weight="bold" className="mr-2" />
                          手动添加
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredBenchmarks.map((benchmark) => (
                      <BenchmarkCard
                        key={benchmark.id}
                        benchmark={benchmark}
                        isSelected={selectedIds.has(benchmark.id)}
                        onSelect={handleSelect}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="compare">
                {selectedBenchmarks.length === 2 && (
                  <ComparisonPanel
                    benchmark1={selectedBenchmarks[0]}
                    benchmark2={selectedBenchmarks[1]}
                  />
                )}
              </TabsContent>

              <TabsContent value="reports">
                <ComparisonReportList
                  reports={reports}
                  onViewReport={handleViewReport}
                  onDeleteReport={deleteReport}
                  isLoading={isReportsLoading}
                />
              </TabsContent>
            </Tabs>
          </div>

          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-6">
              <MessageBoard />
            </div>
          </aside>
        </div>
      </div>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBenchmark ? '编辑基准测试' : '手动添加基准测试'}
            </DialogTitle>
          </DialogHeader>
          <BenchmarkForm
            benchmark={editingBenchmark}
            onSave={handleSave}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingBenchmark(undefined)
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isCSVImportOpen} onOpenChange={setIsCSVImportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批量导入基准测试（CSV）</DialogTitle>
          </DialogHeader>
          <CSVImportForm
            onSave={handleCSVImport}
            onCancel={() => setIsCSVImportOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App