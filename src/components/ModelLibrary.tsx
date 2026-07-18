import { BookOpen, Box, CircleGauge, Database, Network, SlidersHorizontal } from 'lucide-react'
import { modelTemplates } from '../models/templates'
import { useLabStore } from '../store'
import type { NodeKind } from '../types/model'

const nodeTools: Array<{ kind: NodeKind; label: string; icon: typeof Database }> = [
  { kind: 'stock', label: '库存', icon: Database },
  { kind: 'flow', label: '流量', icon: CircleGauge },
  { kind: 'auxiliary', label: '辅助变量', icon: Box },
  { kind: 'parameter', label: '参数', icon: SlidersHorizontal },
]

export function ModelLibrary() {
  const templateId = useLabStore((state) => state.templateId)
  const loadTemplate = useLabStore((state) => state.loadTemplate)
  const addNode = useLabStore((state) => state.addNode)

  return (
    <aside className="left-panel">
      <section className="panel-section">
        <div className="section-title"><Network size={16} /> 建模工具</div>
        <div className="node-tool-grid">
          {nodeTools.map(({ kind, label, icon: Icon }) => (
            <button key={kind} className="node-tool" type="button" onClick={() => addNode(kind)}>
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p className="helper-text">添加节点后，从节点右侧拖动到另一节点建立因果连接。</p>
      </section>

      <section className="panel-section model-list-section">
        <div className="section-title"><BookOpen size={16} /> 经典模型</div>
        <div className="model-list">
          {modelTemplates.map((template) => (
            <button
              type="button"
              key={template.id}
              className={`model-card${template.id === templateId ? ' is-active' : ''}`}
              onClick={() => loadTemplate(template.id)}
            >
              <span className="model-card__category">{template.category}</span>
              <strong>{template.name}</strong>
              <small>{template.summary}</small>
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
