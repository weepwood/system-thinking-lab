import type { Edge, Node } from '@xyflow/react'

export type NodeKind = 'stock' | 'flow' | 'auxiliary' | 'parameter'
export type Polarity = 'positive' | 'negative'

export interface LabNodeData extends Record<string, unknown> {
  label: string
  kind: NodeKind
  value?: number
  unit?: string
  description?: string
}

export interface LabEdgeData extends Record<string, unknown> {
  polarity: Polarity
  delay?: boolean
  description?: string
}

export type LabNode = Node<LabNodeData>
export type LabEdge = Edge<LabEdgeData>

export interface ParameterDefinition {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  description: string
}

export interface SimulationPoint {
  time: number
  [key: string]: number
}

export interface ModelTemplate {
  id: string
  name: string
  category: string
  summary: string
  question: string
  nodes: LabNode[]
  edges: LabEdge[]
  parameters: ParameterDefinition[]
  series: Array<{ key: string; label: string; unit: string }>
  duration: number
  dt: number
  simulate: (parameters: Record<string, number>, duration: number, dt: number) => SimulationPoint[]
}

export interface LoopInfo {
  id: string
  nodeIds: string[]
  edgeIds: string[]
  kind: 'reinforcing' | 'balancing'
  negativeEdges: number
}

export interface SavedWorkspace {
  formatVersion: '1.0'
  templateId: string
  title: string
  nodes: LabNode[]
  edges: LabEdge[]
  parameters: ParameterDefinition[]
  duration: number
  dt: number
  updatedAt: string
}
