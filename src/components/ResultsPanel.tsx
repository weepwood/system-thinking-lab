import { useMemo, useState } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Activity, GitBranch, Lightbulb, TrendingUp } from 'lucide-react'

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])
import { buildInsights } from '../engine/analysis'
import { findFeedbackLoops } from '../engine/loops'
import { getTemplate } from '../models/templates'
import { useLabStore } from '../store'

export function ResultsPanel() {
  const [tab, setTab] = useState<'chart' | 'loops' | 'insights'>('chart')
  const templateId = useLabStore((state) => state.templateId)
  const nodes = useLabStore((state) => state.nodes)
  const edges = useLabStore((state) => state.edges)
  const simulation = useLabStore((state) => state.simulation)
  const template = getTemplate(templateId)
  const [seriesKey, setSeriesKey] = useState(template.series[0].key)

  const currentSeries = template.series.find((series) => series.key === seriesKey) ?? template.series[0]
  const loops = useMemo(() => findFeedbackLoops(nodes, edges), [nodes, edges])
  const insights = useMemo(() => buildInsights(template, simulation, loops), [template, simulation, loops])
  const last = simulation.at(-1)

  const chartOption = useMemo(() => ({
    animationDuration: 450,
    grid: { left: 58, right: 24, top: 28, bottom: 44 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => `${Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} ${currentSeries.unit}`,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      name: '时间',
      data: simulation.map((point) => point.time),
      axisLabel: { color: '#8993ad', formatter: (value: string, index: number) => index % Math.max(1, Math.floor(simulation.length / 8)) === 0 ? value : '' },
      axisLine: { lineStyle: { color: '#303a56' } },
    },
    yAxis: {
      type: 'value',
      name: currentSeries.unit,
      nameTextStyle: { color: '#8993ad' },
      axisLabel: { color: '#8993ad' },
      splitLine: { lineStyle: { color: 'rgba(137,147,173,.12)' } },
    },
    series: [{
      name: currentSeries.label,
      type: 'line',
      smooth: 0.25,
      showSymbol: false,
      sampling: 'lttb',
      lineStyle: { width: 3, color: '#7c9cff' },
      areaStyle: { color: 'rgba(124,156,255,.12)' },
      data: simulation.map((point) => point[currentSeries.key]),
    }],
  }), [currentSeries, simulation])

  return (
    <section className="results-panel">
      <div className="results-tabs">
        <button type="button" className={tab === 'chart' ? 'is-active' : ''} onClick={() => setTab('chart')}><TrendingUp size={15} /> 时间曲线</button>
        <button type="button" className={tab === 'loops' ? 'is-active' : ''} onClick={() => setTab('loops')}><GitBranch size={15} /> 回路分析 <span>{loops.length}</span></button>
        <button type="button" className={tab === 'insights' ? 'is-active' : ''} onClick={() => setTab('insights')}><Lightbulb size={15} /> 系统解释</button>
      </div>

      {tab === 'chart' && (
        <div className="chart-layout">
          <div className="metric-column">
            <label className="series-select">观察变量
              <select value={currentSeries.key} onChange={(event) => setSeriesKey(event.target.value)}>
                {template.series.map((series) => <option key={series.key} value={series.key}>{series.label}</option>)}
              </select>
            </label>
            <div className="metric-card">
              <span>最终值</span>
              <strong>{Number(last?.[currentSeries.key] ?? 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</strong>
              <small>{currentSeries.unit}</small>
            </div>
            <div className="metric-card subtle">
              <span>数据点</span>
              <strong>{simulation.length.toLocaleString('zh-CN')}</strong>
              <small>Euler 时间步</small>
            </div>
          </div>
          <div className="chart-area"><ReactEChartsCore echarts={echarts} option={chartOption} style={{ height: '270px', width: '100%' }} /></div>
        </div>
      )}

      {tab === 'loops' && (
        <div className="loop-grid">
          {loops.length === 0 && <div className="empty-state"><GitBranch size={28} /><strong>没有检测到闭合回路</strong><p>继续连接变量，构成能够返回起点的因果路径。</p></div>}
          {loops.slice(0, 12).map((loop, index) => (
            <article className={`loop-card ${loop.kind}`} key={loop.id}>
              <div><span>{loop.kind === 'reinforcing' ? `R${index + 1}` : `B${index + 1}`}</span><strong>{loop.kind === 'reinforcing' ? '增强回路' : '平衡回路'}</strong></div>
              <p>{loop.nodeIds.map((id) => nodes.find((node) => node.id === id)?.data.label ?? id).join(' → ')} → 起点</p>
              <small>{loop.negativeEdges} 条反向因果连接</small>
            </article>
          ))}
        </div>
      )}

      {tab === 'insights' && (
        <div className="insight-layout">
          <div className="question-card">
            <Activity size={20} />
            <span>建议实验问题</span>
            <strong>{template.question}</strong>
          </div>
          <ol className="insight-list">
            {insights.map((insight) => <li key={insight}>{insight}</li>)}
          </ol>
          <p className="analysis-note">说明基于当前模型结构与仿真结果生成，不代表对现实系统的因果证明。</p>
        </div>
      )}
    </section>
  )
}
