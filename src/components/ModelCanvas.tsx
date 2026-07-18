import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMemo } from 'react'
import { useLabStore } from '../store'
import type { LabEdge } from '../types/model'
import { LabNodeView } from './LabNode'

const nodeTypes = { lab: LabNodeView }

export function ModelCanvas() {
  const nodes = useLabStore((state) => state.nodes)
  const edges = useLabStore((state) => state.edges)
  const onNodesChange = useLabStore((state) => state.onNodesChange)
  const onEdgesChange = useLabStore((state) => state.onEdgesChange)
  const onConnect = useLabStore((state) => state.onConnect)
  const selectNode = useLabStore((state) => state.selectNode)
  const selectEdge = useLabStore((state) => state.selectEdge)

  const styledEdges = useMemo(() => edges.map((item): LabEdge => ({
    ...item,
    className: item.data?.polarity === 'negative' ? 'edge-negative' : 'edge-positive',
    labelStyle: { fontSize: 13, fontWeight: 700 },
    labelBgPadding: [5, 4],
    labelBgBorderRadius: 5,
  })), [edges])

  return (
    <div className="canvas-shell">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onEdgeClick={(_, edge) => selectEdge(edge.id)}
        onPaneClick={() => { selectNode(undefined); selectEdge(undefined) }}
        fitView
        minZoom={0.25}
        maxZoom={1.8}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(item) => {
            const kind = item.data?.kind
            if (kind === 'stock') return '#7c9cff'
            if (kind === 'flow') return '#4fd1a1'
            if (kind === 'parameter') return '#f2b36d'
            return '#a690ec'
          }}
        />
      </ReactFlow>
      <div className="canvas-legend" aria-label="图例">
        <span><i className="legend-dot stock" />库存</span>
        <span><i className="legend-dot flow" />流量</span>
        <span><i className="legend-dot auxiliary" />辅助变量</span>
        <span><i className="legend-dot parameter" />参数</span>
        <span><b>+</b> 同向</span>
        <span><b>−</b> 反向</span>
      </div>
    </div>
  )
}
