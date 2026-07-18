import { Play, RotateCcw, TimerReset } from 'lucide-react'
import { useLabStore } from '../store'

export function ParameterPanel() {
  const parameters = useLabStore((state) => state.parameters)
  const duration = useLabStore((state) => state.duration)
  const dt = useLabStore((state) => state.dt)
  const updateParameter = useLabStore((state) => state.updateParameter)
  const setDuration = useLabStore((state) => state.setDuration)
  const setDt = useLabStore((state) => state.setDt)
  const runSimulation = useLabStore((state) => state.runSimulation)
  const resetParameters = useLabStore((state) => state.resetParameters)

  return (
    <section className="parameter-panel">
      <div className="parameter-panel__head">
        <div>
          <span className="eyebrow">Scenario controls</span>
          <h2>参数实验</h2>
        </div>
        <div className="parameter-actions">
          <button className="button secondary" type="button" onClick={resetParameters}><RotateCcw size={15} /> 恢复默认</button>
          <button className="button primary" type="button" onClick={runSimulation}><Play size={15} fill="currentColor" /> 运行仿真</button>
        </div>
      </div>
      <div className="parameter-grid">
        {parameters.map((parameter) => (
          <label className="range-control" key={parameter.id} title={parameter.description}>
            <span>
              <strong>{parameter.label}</strong>
              <output>{parameter.value.toLocaleString('zh-CN')} {parameter.unit}</output>
            </span>
            <input
              type="range"
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              value={parameter.value}
              onChange={(event) => updateParameter(parameter.id, Number(event.target.value))}
            />
            <small>{parameter.min} — {parameter.max} {parameter.unit}</small>
          </label>
        ))}
      </div>
      <div className="time-settings">
        <TimerReset size={16} />
        <label>结束时间 <input type="number" min="1" max="5000" value={duration} onChange={(event) => setDuration(Math.max(1, Number(event.target.value)))} /></label>
        <label>时间步长 <input type="number" min="0.001" max="10" step="0.01" value={dt} onChange={(event) => setDt(Math.max(0.001, Number(event.target.value)))} /></label>
        <span>求解器：Euler</span>
      </div>
    </section>
  )
}
