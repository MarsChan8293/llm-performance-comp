import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Label, LabelList } from 'recharts'
import { PerformanceMetrics } from '@/lib/types'

interface PerformanceTrendChartsProps {
  metrics1: Map<string, PerformanceMetrics>
  metrics2: Map<string, PerformanceMetrics>
  selectedCombo: string
  modelName1: string
  modelName2: string
  gpuCount1: number
  gpuCount2: number
}

export function PerformanceTrendCharts({
  metrics1,
  metrics2,
  selectedCombo,
  modelName1,
  modelName2,
  gpuCount1,
  gpuCount2,
}: PerformanceTrendChartsProps) {
  // Filter metrics by selected context length and sort by concurrency
  const filteredData = useMemo(() => {
    const keys = Array.from(new Set([...metrics1.keys(), ...metrics2.keys()]))
      .filter(key => {
        const [, i, o] = key.split('-')
        return `${i} / ${o}` === selectedCombo
      })
      .sort((a, b) => {
        const [c1] = a.split('-').map(Number)
        const [c2] = b.split('-').map(Number)
        return c1 - c2
      })

    return keys.map(key => {
      const m1 = metrics1.get(key)
      const m2 = metrics2.get(key)
      const [c] = key.split('-').map(Number)
      
      const tpsPerGpu1 = m1 ? m1.tokensPerSecond / gpuCount1 : undefined
      const tpsPerGpu2 = m2 ? m2.tokensPerSecond / gpuCount2 : undefined

      // Calculate percentage differences (B vs A)
      const ttftPercentage = m1 && m2 ? ((m2.ttft - m1.ttft) / m1.ttft) * 100 : undefined
      const tpotPercentage = m1 && m2 ? ((m2.tpot - m1.tpot) / m1.tpot) * 100 : undefined
      const tpsPercentage = m1 && m2 ? ((m2.tokensPerSecond - m1.tokensPerSecond) / m1.tokensPerSecond) * 100 : undefined
      const tpsPerGpuPercentage = tpsPerGpu1 && tpsPerGpu2 ? ((tpsPerGpu2 - tpsPerGpu1) / tpsPerGpu1) * 100 : undefined

      // Calculate ratios (A / B)
      const ttftRatio = m1 && m2 ? m1.ttft / m2.ttft : undefined
      const tpotRatio = m1 && m2 ? m1.tpot / m2.tpot : undefined
      const tpsRatio = m1 && m2 ? m1.tokensPerSecond / m2.tokensPerSecond : undefined
      const tpsPerGpuRatio = tpsPerGpu1 && tpsPerGpu2 ? tpsPerGpu1 / tpsPerGpu2 : undefined

      return {
        concurrency: c,
        // Percentage data
        ttftPercentage,
        tpotPercentage,
        tpsPercentage,
        tpsPerGpuPercentage,
        // Ratio data
        ttftRatio,
        tpotRatio,
        tpsRatio,
        tpsPerGpuRatio,
        // Performance values
        ttft1: m1?.ttft,
        ttft2: m2?.ttft,
        tpot1: m1?.tpot,
        tpot2: m2?.tpot,
        tps1: m1?.tokensPerSecond,
        tps2: m2?.tokensPerSecond,
        tpsPerGpu1,
        tpsPerGpu2,
      }
    })
  }, [metrics1, metrics2, selectedCombo, gpuCount1, gpuCount2])

  const chartConfig = {
    percentage: {
      label: "对比百分比",
      color: "hsl(var(--chart-1))",
    },
    ratio: {
      label: "对比比值",
      color: "hsl(var(--chart-2))",
    },
    benchmark1: {
      label: modelName1,
      color: "hsl(220, 50%, 65%)", // Softer blue
    },
    benchmark2: {
      label: modelName2,
      color: "hsl(280, 50%, 65%)", // Softer purple
    },
  }

  // Custom label formatter for bar charts
  const renderBarLabel = (props: any) => {
    const { x, y, width, height, value } = props
    if (value === undefined || value === null) return null
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#666" 
        textAnchor="middle" 
        fontSize={10}
        fontWeight="bold"
      >
        {typeof value === 'number' ? value.toFixed(1) : value}
      </text>
    )
  }

  // Custom label formatter for line charts
  const renderLineLabel = (props: any) => {
    const { x, y, value } = props
    if (value === undefined || value === null) return null
    
    return (
      <text 
        x={x} 
        y={y - 10} 
        fill="#666" 
        textAnchor="middle" 
        fontSize={10}
        fontWeight="bold"
      >
        {typeof value === 'number' ? value.toFixed(1) : value}
      </text>
    )
  }

  const renderPercentageChart = (dataKey: string, title: string) => (
    <Card key={`percentage-${dataKey}`} className="p-6">
      <h4 className="font-semibold mb-4 text-center">{title}</h4>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="concurrency" 
            type="category"
            label={{ value: '并发数', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: '百分比 (%)', angle: -90, position: 'insideLeft' }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={chartConfig.percentage.color}
            name="对比百分比 (%)"
            strokeWidth={2}
            dot={{ r: 4 }}
          >
            <LabelList content={renderLineLabel} />
          </Line>
        </LineChart>
      </ChartContainer>
    </Card>
  )

  const renderRatioChart = (dataKey: string, title: string) => (
    <Card key={`ratio-${dataKey}`} className="p-6">
      <h4 className="font-semibold mb-4 text-center">{title}</h4>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="concurrency"
            type="category"
            label={{ value: '并发数', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: '基准测试A / 基准测试B', angle: -90, position: 'insideLeft' }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={chartConfig.ratio.color}
            name="对比比值"
            strokeWidth={2}
            dot={{ r: 4 }}
          >
            <LabelList content={renderLineLabel} />
          </Line>
        </LineChart>
      </ChartContainer>
    </Card>
  )

  const renderBarChart = (dataKey1: string, dataKey2: string, title: string, yAxisLabel: string) => (
    <Card key={`bar-${dataKey1}`} className="p-6">
      <h4 className="font-semibold mb-4 text-center">{title}</h4>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={filteredData} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="concurrency"
            type="category"
            label={{ value: '并发数', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar 
            dataKey={dataKey1} 
            fill={chartConfig.benchmark1.color}
            name={modelName1}
          >
            <LabelList content={renderBarLabel} />
          </Bar>
          <Bar 
            dataKey={dataKey2} 
            fill={chartConfig.benchmark2.color}
            name={modelName2}
          >
            <LabelList content={renderBarLabel} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </Card>
  )

  if (filteredData.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          没有可用的数据来显示所选上下文长度的趋势图。
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">性能趋势图</h3>
        <p className="text-sm text-muted-foreground">
          上下文长度: {selectedCombo}
        </p>
      </div>

      {/* Percentage comparison charts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">对比百分比趋势图</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderPercentageChart('ttftPercentage', `${modelName1} TTFT对比百分比趋势图`)}
          {renderPercentageChart('tpotPercentage', `${modelName1} TPOT对比百分比趋势图`)}
          {renderPercentageChart('tpsPercentage', `${modelName1} TPS对比百分比趋势图`)}
          {renderPercentageChart('tpsPerGpuPercentage', `${modelName1} 每卡TPS对比百分比趋势图`)}
        </div>
      </div>

      {/* Ratio comparison charts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">对比比值趋势图</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderRatioChart('ttftRatio', `${modelName1} TTFT对比比值趋势图`)}
          {renderRatioChart('tpotRatio', `${modelName1} TPOT对比比值趋势图`)}
          {renderRatioChart('tpsRatio', `${modelName1} TPS对比比值趋势图`)}
          {renderRatioChart('tpsPerGpuRatio', `${modelName1} 每卡TPS对比比值趋势图`)}
        </div>
      </div>

      {/* Performance bar charts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">性能柱状图</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderBarChart('ttft1', 'ttft2', `${modelName1} TTFT性能柱状图`, 'TTFT (ms)')}
          {renderBarChart('tpot1', 'tpot2', `${modelName1} TPOT性能柱状图`, 'TPOT (ms)')}
          {renderBarChart('tps1', 'tps2', `${modelName1} TPS性能柱状图`, 'TPS (tokens/s)')}
          {renderBarChart('tpsPerGpu1', 'tpsPerGpu2', `${modelName1} 每卡TPS性能柱状图`, '每卡TPS')}
        </div>
      </div>
    </div>
  )
}
