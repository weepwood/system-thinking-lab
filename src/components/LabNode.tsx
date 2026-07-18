import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Boxes, CircleGauge, Database, SlidersHorizontal } from 'lucide-react'
import type { LabNode } from '../types/model'

const icons = {
  stock: Database,
  flow: CircleGauge,
  auxiliary: Boxes,
  parameter: SlidersHorizontal,
}

const labels = {
  stock: '库存',
  flow: '流量',
  auxiliary: '辅助变量',
  parameter: '参数',
}

export function LabNodeView({ data, selected }: NodeProps<LabNode>) {
  const Icon = icons[data.kind]
  return (
    <div className={`lab-node lab-node--${data.kind}${selected ? ' is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="lab-node__icon"><Icon size={15} /></div>
      <div className="lab-node__content">
        <strong>{data.label}</strong>
        <span>{labels[data.kind]}{data.unit ? ` · ${data.unit}` : ''}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
