import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Benchmark, BenchmarkConfig, PerformanceMetrics } from '@/lib/types'

interface BenchmarkFormProps {
  benchmark?: Benchmark
  onSave: (config: BenchmarkConfig, metrics: PerformanceMetrics) => void
  onCancel: () => void
}

export function BenchmarkForm({ benchmark, onSave, onCancel }: BenchmarkFormProps) {
  const [config, setConfig] = useState<BenchmarkConfig>(
    benchmark?.config || {
      modelName: '',
      serverName: '',
      networkConfig: '',
      chipName: '',
      framework: '',
      frameworkParams: '',
      testDate: new Date().toISOString().split('T')[0],
    }
  )

  const [metrics, setMetrics] = useState<PerformanceMetrics>(
    benchmark?.metrics || {
      inputLength: 0,
      outputLength: 0,
      concurrency: 1,
      ttft: 0,
      tpot: 0,
      tokensPerSecond: 0,
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(config, metrics)
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
              placeholder="例如：GPT-4, Llama-2-70B"
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
            <Label htmlFor="networkConfig">组网配置 *</Label>
            <Input
              id="networkConfig"
              required
              value={config.networkConfig}
              onChange={(e) => setConfig({ ...config, networkConfig: e.target.value })}
              placeholder="例如：8xA100-NVLink"
            />
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
          <Label htmlFor="frameworkParams">框架启动参数</Label>
          <Input
            id="frameworkParams"
            value={config.frameworkParams}
            onChange={(e) => setConfig({ ...config, frameworkParams: e.target.value })}
            placeholder="例如：--max-batch-size=256 --gpu-memory-utilization=0.9"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">性能指标</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inputLength">输入长度（tokens）*</Label>
            <Input
              id="inputLength"
              type="number"
              min="0"
              required
              value={metrics.inputLength}
              onChange={(e) => setMetrics({ ...metrics, inputLength: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outputLength">输出长度（tokens）*</Label>
            <Input
              id="outputLength"
              type="number"
              min="0"
              required
              value={metrics.outputLength}
              onChange={(e) => setMetrics({ ...metrics, outputLength: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="concurrency">并发数 *</Label>
            <Input
              id="concurrency"
              type="number"
              min="1"
              required
              value={metrics.concurrency}
              onChange={(e) => setMetrics({ ...metrics, concurrency: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ttft">首 Token 延迟（ms）*</Label>
            <Input
              id="ttft"
              type="number"
              min="0"
              step="0.01"
              required
              value={metrics.ttft}
              onChange={(e) => setMetrics({ ...metrics, ttft: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpot">每 Token 延迟（ms）*</Label>
            <Input
              id="tpot"
              type="number"
              min="0"
              step="0.01"
              required
              value={metrics.tpot}
              onChange={(e) => setMetrics({ ...metrics, tpot: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tokensPerSecond">吞吐量（tokens/秒）*</Label>
            <Input
              id="tokensPerSecond"
              type="number"
              min="0"
              step="0.01"
              required
              value={metrics.tokensPerSecond}
              onChange={(e) => setMetrics({ ...metrics, tokensPerSecond: Number(e.target.value) })}
            />
          </div>
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
