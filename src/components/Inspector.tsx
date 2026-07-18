import { Clock3, Link2, Settings2, Trash2 } from 'lucide-react'
import { useLabStore } from '../store'

export function Inspector() {
  const nodes = useLabStore((state) => state.nodes)
  const edges = useLabStore((state) => state.edges)
  const selectedNodeId = useLabStore((state) => state.selectedNodeId)
  const selectedEdgeId = useLabStore((state) => state.selectedEdgeId)
  const updateNode = useLabStore((state) => state.updateNode)
  const updateEdge = useLabStore((state) => state.updateEdge)
  const deleteSelection = useLabStore((state) => state.deleteSelection)

  const selectedNode = nodes.find((node) => node.id === selectedNodeId)
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId)

  return (
    <aside className="right-panel">
      <div className="section-title"><Settings2 size={16} /> 属性检查器</div>
      {!selectedNode && !selectedEdge && (
        <div className="empty-inspector">
          <Link2 size={28} />
          <strong>选择一个模型元素</strong>
          <p>点击节点或连线，可编辑名称、类型、极性和时间延迟。</p>
        </div>
      )}

      {selectedNode && (
        <div className="form-stack">
          <div className="inspector-badge">节点 · {selectedNode.data.kind}</div>
          <label>
            名称
            <input value={selectedNode.data.label} onChange={(event) => updateNode(selectedNode.id, { label: event.target.value })} />
          </label>
          <label>
            类型
            <select value={selectedNode.data.kind} onChange={(event) => updateNode(selectedNode.id, { kind: event.target.value as typeof selectedNode.data.kind })}>
              <option value="stock">库存 Stock</option>
              <option value="flow">流量 Flow</option>
              <option value="auxiliary">辅助变量 Auxiliary</option>
              <option value="parameter">参数 Parameter</option>
            </select>
          </label>
          <label>
            单位
            <input value={selectedNode.data.unit ?? ''} placeholder="例如：人/天" onChange={(event) => updateNode(selectedNode.id, { unit: event.target.value })} />
          </label>
          <label>
            初始值
            <input type="number" value={selectedNode.data.value ?? 0} onChange={(event) => updateNode(selectedNode.id, { value: Number(event.target.value) })} />
          </label>
          <label>
            说明
            <textarea rows={5} value={selectedNode.data.description ?? ''} onChange={(event) => updateNode(selectedNode.id, { description: event.target.value })} />
          </label>
        </div>
      )}

      {selectedEdge && (
        <div className="form-stack">
          <div className="inspector-badge">因果连接</div>
          <label>
            关系极性
            <select
              value={selectedEdge.data?.polarity ?? 'positive'}
              onChange={(event) => updateEdge(selectedEdge.id, { polarity: event.target.value as 'positive' | 'negative' })}
            >
              <option value="positive">正向（同方向）</option>
              <option value="negative">反向（反方向）</option>
            </select>
          </label>
          <label className="switch-row">
            <span><Clock3 size={15} /> 时间延迟</span>
            <input
              type="checkbox"
              checked={Boolean(selectedEdge.data?.delay)}
              onChange={(event) => updateEdge(selectedEdge.id, { delay: event.target.checked })}
            />
          </label>
          <label>
            关系说明
            <textarea rows={5} value={selectedEdge.data?.description ?? ''} onChange={(event) => updateEdge(selectedEdge.id, { description: event.target.value })} />
          </label>
          <div className="relationship-preview">
            <strong>{nodes.find((node) => node.id === selectedEdge.source)?.data.label}</strong>
            <span>{selectedEdge.data?.polarity === 'negative' ? '−' : '+'}{selectedEdge.data?.delay ? '（延迟）' : ''}</span>
            <strong>{nodes.find((node) => node.id === selectedEdge.target)?.data.label}</strong>
          </div>
        </div>
      )}

      {(selectedNode || selectedEdge) && (
        <button type="button" className="danger-button" onClick={deleteSelection}><Trash2 size={15} /> 删除选中元素</button>
      )}
    </aside>
  )
}
