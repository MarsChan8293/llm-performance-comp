import { useRef, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { parseCSV } from '@/lib/csv-parser'
import { BenchmarkMetricsEntry, BenchmarkConfig } from '@/lib/types'
import { UploadSimple, X, CheckCircle, Info } from '@phosphor-icons/react'

interface CSVImportFormProps {
  onSave: (config: BenchmarkConfig, file: File) => void
  onCancel: () => void
}

export function CSVImportForm({ onSave, onCancel }: CSVImportFormProps) {
  const [config, setConfig] = useState<Omit<BenchmarkConfig, 'testDate'>>({
    modelName: '',
    serverName: '',
    shardingConfig: '',
    chipName: '',
    framework: '',
    submitter: '',
    operatorAcceleration: '',
    frameworkParams: '',
    notes: '',
  })
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0])
  const [parsedMetrics, setParsedMetrics] = useState<BenchmarkMetricsEntry[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse sharding config to show card count hint
  const cardCountHint = useMemo(() => {
    if (!config.shardingConfig) return null
    const matches = config.shardingConfig.match(/\d+/g)
    if (!matches) return null
    const total = matches.reduce((acc, val) => acc * parseInt(val), 1)
    return `预计使用 ${total} 块卡`
  }, [config.shardingConfig])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setFileName(file.name)
    setError('')
    setParsedMetrics([])

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = (event.target?.result as string) || ''
        const metrics = parseCSV(text)
        setParsedMetrics(metrics)
      } catch (err) {
        setError(err instanceof Error ? err.message : '解析 CSV 文件时发生错误')
        setParsedMetrics([])
      }
    }

    reader.readAsText(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFileName('')
    setParsedMetrics([])
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !selectedFile) return

    onSave(
      {
        ...config,
        testDate,
      },
      selectedFile
    )
  }


  const isFormValid =
    parsedMetrics.length > 0 &&
    config.modelName &&
    config.serverName &&
    config.shardingConfig &&
    config.chipName &&
    config.framework &&
    config.submitter &&
    testDate

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="csv-upload">上传 CSV 文件 *</Label>
        <p className="text-sm text-muted-foreground">
          需要包含列：Process Num, Input Length, Output Length, TTFT (ms), TPS (with prefill)，可选列：Total Time (ms)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          id="csv-upload"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          className="w-full h-32 border-2 border-dashed hover:border-primary hover:bg-accent/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <UploadSimple size={32} className="text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">点击上传 CSV 文件</p>
              <p className="text-sm text-muted-foreground">支持 .csv 格式</p>
            </div>
          </div>
        </Button>

        {fileName && (
          <div className="flex items-center gap-3 text-sm bg-muted/60 px-3 py-2 rounded-md">
            <CheckCircle size={16} className="text-green-600" />
            <span className="font-medium truncate">{fileName}</span>
            <Badge variant="secondary">{parsedMetrics.length} 条记录</Badge>
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={handleRemoveFile}>
              <X size={16} />
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>解析失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">配置信息</h3>
          <p className="text-sm text-muted-foreground">以下配置将应用于所有导入的记录</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modelName">模型名称 *</Label>
            <Input
              id="modelName"
              required
              value={config.modelName}
              onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
              placeholder="例如：Qwen3-32B-FP8"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serverName">服务器名称 *</Label>
            <Input
              id="serverName"
              required
              value={config.serverName}
              onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
              placeholder="例如：服务器-A1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shardingConfig">切分参数 *</Label>
            <Input
              id="shardingConfig"
              required
              value={config.shardingConfig}
              onChange={(e) => setConfig({ ...config, shardingConfig: e.target.value })}
              placeholder="例如：TP4, TP16, 2P2D, DP2TP4"
            />
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Info size={12} />
              <span>支持解析卡数，如：TP4, TP16, 2P2D, DP2TP4</span>
              {cardCountHint && (
                <Badge variant="outline" className="ml-auto text-[10px] py-0 h-4 bg-primary/5 text-primary border-primary/20">
                  {cardCountHint}
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chipName">AI 芯片 *</Label>
            <Input
              id="chipName"
              required
              value={config.chipName}
              onChange={(e) => setConfig({ ...config, chipName: e.target.value })}
              placeholder="例如：A100, H100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="framework">推理框架 *</Label>
            <Input
              id="framework"
              required
              value={config.framework}
              onChange={(e) => setConfig({ ...config, framework: e.target.value })}
              placeholder="例如：vLLM, TensorRT-LLM"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="submitter">提交人 *</Label>
            <Input
              id="submitter"
              required
              value={config.submitter}
              onChange={(e) => setConfig({ ...config, submitter: e.target.value })}
              placeholder="例如：张三"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="testDate">测试日期 *</Label>
            <Input
              id="testDate"
              type="date"
              required
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="operatorAcceleration">算子加速</Label>
          <Input
            id="operatorAcceleration"
            value={config.operatorAcceleration}
            onChange={(e) => setConfig({ ...config, operatorAcceleration: e.target.value })}
            placeholder="例如：FlashAttention、TensorRT-LLM plugins"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frameworkParams">框架启动参数</Label>
          <Input
            id="frameworkParams"
            value={config.frameworkParams}
            onChange={(e) => setConfig({ ...config, frameworkParams: e.target.value })}
            placeholder="例如：--max-batch-size=256 --gpu-memory-utilization=0.9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">备注</Label>
          <Input
            id="notes"
            value={config.notes}
            onChange={(e) => setConfig({ ...config, notes: e.target.value })}
            placeholder="例如：使用特定优化补丁，或测试环境说明"
          />
        </div>
      </div>

      {parsedMetrics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">预览数据</h3>
            <Badge variant="secondary">{parsedMetrics.length} 条</Badge>
          </div>
          <ScrollArea className="h-64 border rounded-md p-4 bg-muted/40">
            <div className="space-y-3">
              {parsedMetrics.map((metrics, idx) => (
                <div
                  key={`row-${idx}`}
                  className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm p-3 bg-background rounded-md shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">并发数 (Process Num)</p>
                    <p className="font-mono font-medium">{metrics.concurrency}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">输入/输出 (tokens)</p>
                    <p className="font-mono font-medium">{metrics.inputLength} / {metrics.outputLength}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">TTFT (ms)</p>
                    <p className="font-mono font-medium">{metrics.ttft.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">TPOT (ms)</p>
                    <p className="font-mono font-medium">{metrics.tpot.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">TPS (tokens/s)</p>
                    <p className="font-mono font-medium">{metrics.tokensPerSecond.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={!isFormValid}>
          导入并保存
        </Button>
      </div>
    </form>
  )
}
