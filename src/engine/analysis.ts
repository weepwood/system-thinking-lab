import type { LoopInfo, ModelTemplate, SimulationPoint } from '../types/model'

export function buildInsights(
  template: ModelTemplate,
  data: SimulationPoint[],
  loops: LoopInfo[],
) {
  if (!data.length) return ['尚未产生仿真结果。']
  const first = data[0]
  const last = data[data.length - 1]
  const insights: string[] = []

  const reinforcing = loops.filter((loop) => loop.kind === 'reinforcing').length
  const balancing = loops.length - reinforcing
  insights.push(`模型识别到 ${loops.length} 个反馈回路：${reinforcing} 个增强回路，${balancing} 个平衡回路。`)

  const primary = template.series[0]
  const start = Number(first[primary.key] ?? 0)
  const end = Number(last[primary.key] ?? 0)
  const change = start === 0 ? end : ((end - start) / Math.abs(start)) * 100
  insights.push(`${primary.label}从 ${format(start)} 变化到 ${format(end)}，相对变化 ${format(change)}%。`)

  let peakPoint = data[0]
  for (const point of data) {
    if ((point[primary.key] ?? -Infinity) > (peakPoint[primary.key] ?? -Infinity)) peakPoint = point
  }
  if (peakPoint.time !== last.time) {
    insights.push(`${primary.label}在 t=${format(peakPoint.time)} 达到峰值 ${format(peakPoint[primary.key])}，随后回落，说明限制性反馈开始占主导。`)
  }

  const volatile = template.series.some(({ key }) => {
    const values = data.map((point) => point[key] ?? 0)
    let turns = 0
    let previousDirection = 0
    for (let index = 1; index < values.length; index += 1) {
      const direction = Math.sign(values[index] - values[index - 1])
      if (direction && previousDirection && direction !== previousDirection) turns += 1
      if (direction) previousDirection = direction
    }
    return turns >= 3
  })
  if (volatile) insights.push('曲线存在多次方向反转，模型表现出振荡或策略响应滞后的特征。')

  insights.push(`建议优先对“${template.question}”进行情景对比，而不是仅优化单个时点指标。`)
  return insights
}

function format(value: number) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value)
}
