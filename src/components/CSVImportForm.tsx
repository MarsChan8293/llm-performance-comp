import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BenchmarkConfig, Benchmark } from '@/lib/types'
import { parseCSV, ParsedBenchmarkRow } from '@/lib/csv-parser'
import { UploadSimple, FileArrowDown, X, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface CSVImportFormProps {
  onSave: (benchmarks: Benchmark[]) => void
  onCancel: () => void
}

export function CSVImportForm({ onSave, onCancel }: CSVImportFormProps) {
  const [config, setConfig] = useState<Omit<BenchmarkConfig, 'testDate'>>({
    modelName: '',
    serverName: '',
    networkConfig: '',
    chipName: '',
    framework: '',
    frameworkParams: '',
  })
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0])
  const [parsedRows, setParsedRows] = useState<ParsedBenchmarkRow[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError('')
    setParsedRows([])

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string
        const parsed = parseCSV(csvText)
        setParsedRows(parsed)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '解析 CSV 文件时出错'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    }
    reader.readAsText(file)
  }

  const handleRemoveFile = () => {
    setFileName('')
    setParsedRows([])
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (parsedRows.length === 0) {
      toast.error('请先上传并解析 CSV 文件')
      return
    }

    const benchmarks: Benchmark[] = parsedRows.map((row) => ({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      config: {
        ...config,
        testDate,
      },
      metrics: row.metrics,
      createdAt: new Date().toISOString(),
    }))

    onSave(benchmarks)
  }

  const isFormValid = 
    parsedRows.length > 0 &&
    config.modelName && 
    config.serverName && 
    config.networkConfig && 
    config.chipName && 
    config.framework && 
    testDate

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            上传 CSV 文件批量导入基准测试数据。CSV 文件需包含以下列：Process Num, Input Length, Output Length, TTFT (ms), TPS (with prefill)
          </p>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            {!fileName ? (
              <label htmlFor="csv-upload">
                <Card className="p-8 border-2 border-dashed cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <UploadSimple size={48} className="text-muted-foreground" weight="duotone" />
                    <div>
                      <p className="text-sm font-medium mb-1">点击上传 CSV 文件</p>
                      <p className="text-xs text-muted-foreground">
                        支持 Process Num, Input Length, Output Length, TTFT, TPS 等列
                      </p>
                    </div>
                  </div>
                </Card>
              </label>
            ) : (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileArrowDown size={24} className="text-primary flex-shrink-0" weight="duotone" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {parsedRows.length > 0 ? (
                          <>
                            <CheckCircle size={16} className="text-green-600" weight="fill" />
                            <p className="text-xs text-muted-foreground">
                              已解析 {parsedRows.length} 条数据
                            </p>
                          </>
                        ) : error ? (
                          <>
                            <WarningCircle size={16} className="text-destructive" weight="fill" />
                            <p className="text-xs text-destructive">解析失败</p>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="flex-shrink-0"
                  >
                    <X size={18} />
                  </Button>
                </div>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <WarningCircle size={18} className="mt-0.5" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      {parsedRows.length > 0 && (
        <>
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">配置信息</h3>
            <p className="text-sm text-muted-foreground">
              以下配置将应用于所有 {parsedRows.length} 条导入的数据
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="import-modelName">模型名称 *</Label>
                <Input
                  id="import-modelName"
                  required
                  value={config.modelName}
                  onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                  placeholder="例如：Qwen3-32B-FP8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-serverName">服务器名称 *</Label>
                <Input
                  id="import-serverName"
                  required
                  value={config.serverName}
                  onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
                  placeholder="例如：服务器-A1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-networkConfig">组网配置 *</Label>
                <Input
                  id="import-networkConfig"
                  required
                  value={config.networkConfig}
                  onChange={(e) => setConfig({ ...config, networkConfig: e.target.value })}
                  placeholder="例如：8xH100-NVLink"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-chipName">AI 芯片 *</Label>
                <Input
                  id="import-chipName"
                  required
                  value={config.chipName}
                  onChange={(e) => setConfig({ ...config, chipName: e.target.value })}
                  placeholder="例如：H100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-framework">推理框架 *</Label>
                <Input
                  id="import-framework"
                  required
                  value={config.framework}
                  onChange={(e) => setConfig({ ...config, framework: e.target.value })}
                  placeholder="例如：vLLM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-testDate">测试日期 *</Label>
                <Input
                  id="import-testDate"
                  type="date"
                  required
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-frameworkParams">框架启动参数</Label>
              <Input
                id="import-frameworkParams"
                value={config.frameworkParams}
                onChange={(e) => setConfig({ ...config, frameworkParams: e.target.value })}
                placeholder="例如：--max-batch-size=256 --gpu-memory-utilization=0.9"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">数据预览</h3>
              <Badge variant="secondary">{parsedRows.length} 条记录</Badge>
            </div>
            
            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 space-y-2">
                {parsedRows.map((row, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">并发数：</span>
                        <span className="font-medium ml-1">{row.metrics.concurrency}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">输入/输出：</span>
                        <span className="font-medium ml-1">
                          {row.metrics.inputLength}/{row.metrics.outputLength}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">TTFT：</span>
                        <span className="font-medium ml-1">{row.metrics.ttft.toFixed(2)} ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">吞吐量：</span>
                        <span className="font-medium ml-1">
                          {row.metrics.tokensPerSecond.toFixed(2)} tok/s
                        </span>
                      </div>
                      <div className="md:col-span-1">
                        <span className="text-muted-foreground">TPOT：</span>
                        <span className="font-medium ml-1">{row.metrics.tpot.toFixed(4)} ms</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={!isFormValid}>
          批量导入 {parsedRows.length > 0 && `(${parsedRows.length} 条)`}
        </Button>
      </div>
    </form>
  )
}
