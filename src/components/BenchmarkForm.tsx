import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Benchmark, BenchmarkConfig, BenchmarkMetricsEntry } from '@/lib/types'

interface BenchmarkFormProps {
  benchmark?: Benchmark
  onSave: (config: BenchmarkConfig, metrics: BenchmarkMetricsEntry[]) => void
  onCancel: () => void
}

export function BenchmarkForm({ benchmark, onSave, onCancel }: BenchmarkFormProps) {
  const [config, setConfig] = useState<BenchmarkConfig>(
    {
      modelName: '',
      serverName: '',
      shardingConfig: '',
      chipName: '',
      framework: '',
      frameworkVersion: '',
      frameworkParams: '',
      testDate: new Date().toISOString().split('T')[0],
      submitter: '',
      operatorAcceleration: '',
      notes: '',
      ...(benchmark?.config || {}),
    }
  )

  const [metricsList, setMetricsList] = useState<BenchmarkMetricsEntry[]>(
    benchmark?.metrics || [
      {
        inputLength: 128,
        outputLength: 128,
        concurrency: 1,
        ttft: 0,
        tpot: 0,
        tokensPerSecond: 0,
      },
    ]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(config, metricsList)
  }

  const updateMetric = (idx: number, field: keyof BenchmarkMetricsEntry, value: number) => {
    setMetricsList((current) => {
      const next = [...current]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const addMetricRow = () => {
    setMetricsList((current) => [
      ...current,
      {
        inputLength: 128,
        outputLength: 128,
        concurrency: 1,
        ttft: 0,
        tpot: 0,
        tokensPerSecond: 0,
      },
    ])
  }

  const removeMetricRow = (idx: number) => {
    setMetricsList((current) => current.filter((_, i) => i !== idx))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">配置信息</h3>
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
            <p className="text-[10px] text-muted-foreground">
              支持解析卡数，如：TP4, TP16, 2P2D, DP2TP4
            </p>
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
            <Label htmlFor="frameworkVersion">推理框架版本号 *</Label>
            <Input
              id="frameworkVersion"
              required
              value={config.frameworkVersion}
              onChange={(e) => setConfig({ ...config, frameworkVersion: e.target.value })}
              placeholder="例如：v0.6.3"
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
              value={config.testDate}
              onChange={(e) => setConfig({ ...config, testDate: e.target.value })}
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

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">性能指标（可多行）</h3>
          <Button type="button" variant="outline" onClick={addMetricRow}>
            添加一行
          </Button>
        </div>

        <div className="space-y-4">
          {metricsList.map((metric, idx) => (
            <div key={`metric-${idx}`} className="border rounded-md p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm">数据行 #{idx + 1}</h4>
                {metricsList.length > 1 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeMetricRow(idx)}>
                    删除
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`concurrency-${idx}`}>并发数（Process Num）*</Label>
                  <Input
                    id={`concurrency-${idx}`}
                    type="number"
                    min="1"
                    required
                    value={metric.concurrency}
                    onChange={(e) => updateMetric(idx, 'concurrency', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`inputLength-${idx}`}>输入长度（tokens）*</Label>
                  <Input
                    id={`inputLength-${idx}`}
                    type="number"
                    min="0"
                    required
                    value={metric.inputLength}
                    onChange={(e) => updateMetric(idx, 'inputLength', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`outputLength-${idx}`}>输出长度（tokens）*</Label>
                  <Input
                    id={`outputLength-${idx}`}
                    type="number"
                    min="0"
                    required
                    value={metric.outputLength}
                    onChange={(e) => updateMetric(idx, 'outputLength', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`ttft-${idx}`}>首 Token 延迟 TTFT (ms)*</Label>
                  <Input
                    id={`ttft-${idx}`}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={metric.ttft}
                    onChange={(e) => updateMetric(idx, 'ttft', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tpot-${idx}`}>每 Token 延迟 TPOT (ms)*</Label>
                  <Input
                    id={`tpot-${idx}`}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={metric.tpot}
                    onChange={(e) => updateMetric(idx, 'tpot', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`tokensPerSecond-${idx}`}>吞吐量 TPS (tokens/s)*</Label>
                  <Input
                    id={`tokensPerSecond-${idx}`}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={metric.tokensPerSecond}
                    onChange={(e) => updateMetric(idx, 'tokensPerSecond', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">
          {benchmark ? '更新' : '保存'}
        </Button>
      </div>
    </form>
  )
}
