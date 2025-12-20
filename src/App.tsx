import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { BenchmarkForm } from '@/components/BenchmarkForm'
import { BenchmarkCard } from '@/components/BenchmarkCard'
import { ComparisonPanel } from '@/components/ComparisonPanel'
import { Benchmark, BenchmarkConfig, PerformanceMetrics } from '@/lib/types'
import { Plus, MagnifyingGlass, ArrowsLeftRight, ChartBar } from '@phosphor-icons/react'
import { toast } from 'sonner'

function App() {
  const [benchmarks, setBenchmarks] = useKV<Benchmark[]>('benchmarks', [])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBenchmark, setEditingBenchmark] = useState<Benchmark | undefined>()
  const [activeTab, setActiveTab] = useState('list')

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
        b.config.networkConfig.toLowerCase().includes(query)
    )
  }, [benchmarks, searchQuery])

  const selectedBenchmarks = useMemo(() => {
    const allBenchmarks = benchmarks || []
    return allBenchmarks.filter((b) => selectedIds.has(b.id))
  }, [benchmarks, selectedIds])

  const handleSave = (config: BenchmarkConfig, metrics: PerformanceMetrics) => {
    if (editingBenchmark) {
      setBenchmarks((current) =>
        (current || []).map((b) =>
          b.id === editingBenchmark.id
            ? { ...b, config, metrics }
            : b
        )
      )
      toast.success('Benchmark updated successfully')
    } else {
      const newBenchmark: Benchmark = {
        id: Date.now().toString(),
        config,
        metrics,
        createdAt: new Date().toISOString(),
      }
      setBenchmarks((current) => [newBenchmark, ...(current || [])])
      toast.success('Benchmark added successfully')
    }
    setIsFormOpen(false)
    setEditingBenchmark(undefined)
  }

  const handleDelete = (id: string) => {
    setBenchmarks((current) => (current || []).filter((b) => b.id !== id))
    setSelectedIds((current) => {
      const newSet = new Set(current)
      newSet.delete(id)
      return newSet
    })
    toast.success('Benchmark deleted')
  }

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((current) => {
      const newSet = new Set(current)
      if (selected) {
        if (newSet.size >= 2) {
          toast.error('You can only select 2 benchmarks for comparison')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ChartBar size={40} weight="duotone" className="text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              LLM Performance Benchmark
            </h1>
          </div>
          <p className="text-muted-foreground">
            Upload, manage, and compare AI model inference performance across different configurations
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <TabsList>
              <TabsTrigger value="list">All Benchmarks</TabsTrigger>
              <TabsTrigger value="compare" disabled={selectedIds.size !== 2}>
                Comparison
                {selectedIds.size > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedIds.size}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2 w-full md:w-auto">
              {selectedIds.size === 2 && activeTab === 'list' && (
                <Button onClick={handleCompare} variant="outline" className="flex-1 md:flex-none">
                  <ArrowsLeftRight size={18} className="mr-2" />
                  Compare
                </Button>
              )}
              <Button onClick={handleAddNew} className="flex-1 md:flex-none">
                <Plus size={18} weight="bold" className="mr-2" />
                Add Benchmark
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
                placeholder="Search by model, server, chip, framework..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredBenchmarks.length === 0 ? (
              <div className="text-center py-16">
                <ChartBar size={64} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? 'No benchmarks found' : 'No benchmarks yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Add your first LLM performance benchmark to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleAddNew}>
                    <Plus size={18} weight="bold" className="mr-2" />
                    Add Your First Benchmark
                  </Button>
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
        </Tabs>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBenchmark ? 'Edit Benchmark' : 'Add New Benchmark'}
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
    </div>
  )
}

export default App