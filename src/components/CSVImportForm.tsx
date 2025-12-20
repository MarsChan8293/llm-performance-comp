import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/s
import { parseCSV, ParsedBenchmarkRow } fro
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BenchmarkConfig, Benchmark } from '@/lib/types'
import { parseCSV, ParsedBenchmarkRow } from '@/lib/csv-parser'
import { UploadSimple, FileArrowDown, X, CheckCircle, WarningCircle } from '@phosphor-icons/react'
    chipName: '',

  const [testDate, setTestDate
  onSave: (benchmarks: Benchmark[]) => void
  const fileInputRef =
}

export function CSVImportForm({ onSave, onCancel }: CSVImportFormProps) {
  const [config, setConfig] = useState<Omit<BenchmarkConfig, 'testDate'>>({
    modelName: '',
      try {
    networkConfig: '',
      } catch (er
    framework: '',
    frameworkParams: '',
  })
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0])
  const [parsedRows, setParsedRows] = useState<ParsedBenchmarkRow[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')
  }


      toast.error('请先上传并解析 CSV 文件')
    }

      config: {
        testDate
      metrics: row.me

    onSave(benchmarks)

    parsedR
    config.serverName && 
    config.chipName && 
    testDate
  return (
      <div className="space-y-4">
          <p className="te
          </p>
       
     
    reader.readAsText(file)
   

                <Card className="p
                   
    setParsedRows([])
    setError('')
                    </div>
                </Card>
    }
   

                      <p className="text-sm font
                      

                              已解析 
                          </>
            
     

                    </div>
                  <Button
      config: {
                  
                 
        
              </Card>

    }))

    onSave(benchmarks)
   

        <>
          
    config.modelName && 
              以下配置将应用于所有 
    config.networkConfig && 
              <div clas
    config.framework && 
            

          
              <div className="space-y-2">
                <Input
        <div>
                  onChange={(e) => setConfig({ ...config, se
                />
          </p>
                <Input
                  
                  onChange={(e) 
                />
              <div classNam
                <Input
                  required
                  onChange={(
            />
            {!fileName ? (
                <Input
                  required
                  onChange={(e) => setConfig({ ...config, framework: e.target.va
                />
              <div classN
                <Input
                  type="date"
                  value={testDate}
                />
            </div>
              <Label htm
                id="imp
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
        <Button type="b
          
        <Button type="submit" disable
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

                value={config.frameworkParams}
                onChange={(e) => setConfig({ ...config, frameworkParams: e.target.value })}
                placeholder="例如：--max-batch-size=256 --gpu-memory-utilization=0.9"

            </div>


          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">数据预览</h3>
              <Badge variant="secondary">{parsedRows.length} 条记录</Badge>

            

              <div className="p-4 space-y-2">

                  <Card key={idx} className="p-3">

                      <div>
                        <span className="text-muted-foreground">并发数：</span>
                        <span className="font-medium ml-1">{row.metrics.concurrency}</span>

                      <div>
                        <span className="text-muted-foreground">输入/输出：</span>
                        <span className="font-medium ml-1">
                          {row.metrics.inputLength}/{row.metrics.outputLength}
                        </span>

                      <div>

                        <span className="font-medium ml-1">{row.metrics.ttft.toFixed(2)} ms</span>

                      <div>
                        <span className="text-muted-foreground">吞吐量：</span>
                        <span className="font-medium ml-1">
                          {row.metrics.tokensPerSecond.toFixed(2)} tok/s
                        </span>


                        <span className="text-muted-foreground">TPOT：</span>
                        <span className="font-medium ml-1">{row.metrics.tpot.toFixed(4)} ms</span>

                    </div>

                ))}

            </ScrollArea>

        </>


      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>


        <Button type="submit" disabled={!isFormValid}>
          批量导入 {parsedRows.length > 0 && `(${parsedRows.length} 条)`}
        </Button>
      </div>

  )

