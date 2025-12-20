import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badg
import { Separator } from '@/components/ui/se
import { parseCSV, ParsedBenchmarkRow } from '@/lib/csv-
import { UploadSimple, FileArrowDown, X, CheckCircle,
interface CSVImportFormProps {
  onCancel: () => void

  const [config, setConfig] = useState<Omit<BenchmarkConfig, 'testDate'>>({

    chipName: '',
    frameworkParams: '',
  const [testDate, set
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
        const text = event.target?.result as string
        const rows = parseCSV(text)
        setParsedRows(rows)
      } catch (err) {
        setError(err instanceof Error ? err.message : '解析 CSV 文件时发生错误')
        setParsedRows([])
      }
    i
    config.modelName &&
  }

  const handleRemoveFile = () => {
    setFileName('')
        <div>
          <p cla
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
     
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (parsedRows.length === 0) {
      return
    }

    const benchmarks: Benchmark[] = parsedRows.map((row) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
               
        ...config,
        testDate,
      },
      metrics: row.metrics,
      createdAt: new Date().toISOString(),
       

                      
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
        <>
          <Label htmlFor="csv-upload">上传 CSV 文件 *</Label>
          <p className="text-sm text-muted-foreground mb-3">
            请上传包含性能数据的 CSV 文件（格式：Process Num, Input Length, Output Length, TTFT (ms), TPS (with prefill), Total Time (ms)）
              

          <input
            ref={fileInputRef}
            type="file"
            id="csv-upload"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div>
                  placehol
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
                 
                />
              <div className="space-y-2">
                <Input
                  type="date"
                  value={testDate}
                />
            </div>
              <Label htmlFor="import-frameworkPara
                id="import-f
                onChange={(e) => setConfig({ ...config, frameworkParams: e.target.value })}
              />
          </div>
          <Separator />
          <div className="spa
              <h3 className="text-lg 
            </div>
            <ScrollArea className="h-64 border rounded-md">
                {parsedRows.map((row, idx) => (
                    <div clas
                        <span cla
                      </div>
                        <s
                        
                      </d
                        <span cla
                      </div>
                        <span c
                          {row.metrics.tokensP
                      </div>
                   
                      </div>
                  </Card>
              </div>
          </div>
      )}

          取消
              <Alert variant="destructive" className="mt-3">
        </Button>
    </form>
}







          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">配置信息</h3>
              <p className="text-sm text-muted-foreground">
                以下配置将应用于所有 {parsedRows.length} 条导入的数据
              </p>
            </div>


































































                id="import-frameworkParams"



              />

          </div>







            </div>

            <ScrollArea className="h-64 border rounded-md">

                {parsedRows.map((row, idx) => (

                    <div className="flex flex-wrap gap-4 text-sm">



                      </div>





                      </div>

                        <span className="text-muted-foreground">TTFT：</span>

                      </div>





                      </div>
                      <div>


                      </div>

                  </Card>

              </div>

          </div>

      )}



          取消
        </Button>




    </form>

}
