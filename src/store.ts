import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { findFeedbackLoops } from './engine/loops'
import { getTemplate } from './models/templates'
import type {
  LabEdge,
  LabNode,
  ParameterDefinition,
  SavedWorkspace,
  SimulationPoint,
} from './types/model'

type Snapshot = Pick<LabState, 'nodes' | 'edges' | 'parameters' | 'duration' | 'dt' | 'title'>

interface LabState {
  templateId: string
  title: string
  nodes: LabNode[]
  edges: LabEdge[]
  parameters: ParameterDefinition[]
  duration: number
  dt: number
  selectedNodeId?: string
  selectedEdgeId?: string
  simulation: SimulationPoint[]
  isDirty: boolean
  past: Snapshot[]
  future: Snapshot[]
  loadTemplate: (id: string) => void
  onNodesChange: (changes: NodeChange<LabNode>[]) => void
  onEdgesChange: (changes: EdgeChange<LabEdge>[]) => void
  onConnect: (connection: Connection) => void
  selectNode: (id?: string) => void
  selectEdge: (id?: string) => void
  updateNode: (id: string, patch: Partial<LabNode['data']>) => void
  updateEdge: (id: string, patch: Partial<NonNullable<LabEdge['data']>>) => void
  addNode: (kind: LabNode['data']['kind']) => void
  deleteSelection: () => void
  updateParameter: (id: string, value: number) => void
  setDuration: (duration: number) => void
  setDt: (dt: number) => void
  runSimulation: () => void
  resetParameters: () => void
  saveLocal: () => void
  exportWorkspace: () => SavedWorkspace
  importWorkspace: (workspace: SavedWorkspace) => void
  undo: () => void
  redo: () => void
}

const initialTemplate = getTemplate('platform-growth')

const snapshot = (state: LabState): Snapshot => ({
  nodes: structuredClone(state.nodes),
  edges: structuredClone(state.edges),
  parameters: structuredClone(state.parameters),
  duration: state.duration,
  dt: state.dt,
  title: state.title,
})

const withHistory = (state: LabState) => ({
  past: [...state.past.slice(-29), snapshot(state)],
  future: [],
  isDirty: true,
})

export const useLabStore = create<LabState>((set, get) => ({
  templateId: initialTemplate.id,
  title: initialTemplate.name,
  nodes: structuredClone(initialTemplate.nodes),
  edges: structuredClone(initialTemplate.edges),
  parameters: structuredClone(initialTemplate.parameters),
  duration: initialTemplate.duration,
  dt: initialTemplate.dt,
  simulation: initialTemplate.simulate(
    Object.fromEntries(initialTemplate.parameters.map((item) => [item.id, item.value])),
    initialTemplate.duration,
    initialTemplate.dt,
  ),
  isDirty: false,
  past: [],
  future: [],

  loadTemplate: (id) => {
    const template = getTemplate(id)
    set({
      templateId: template.id,
      title: template.name,
      nodes: structuredClone(template.nodes),
      edges: structuredClone(template.edges),
      parameters: structuredClone(template.parameters),
      duration: template.duration,
      dt: template.dt,
      simulation: template.simulate(
        Object.fromEntries(template.parameters.map((item) => [item.id, item.value])),
        template.duration,
        template.dt,
      ),
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
      isDirty: false,
      past: [],
      future: [],
    })
  },

  onNodesChange: (changes) => set((state) => ({
    nodes: applyNodeChanges(changes, state.nodes),
    isDirty: changes.some((change) => change.type !== 'select') ? true : state.isDirty,
  })),

  onEdgesChange: (changes) => set((state) => ({
    edges: applyEdgeChanges(changes, state.edges),
    isDirty: changes.some((change) => change.type !== 'select') ? true : state.isDirty,
  })),

  onConnect: (connection) => set((state) => ({
    ...withHistory(state),
    edges: addEdge({
      ...connection,
      id: `edge-${crypto.randomUUID()}`,
      type: 'smoothstep',
      label: '+',
      data: { polarity: 'positive', delay: false },
    }, state.edges),
  })),

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: undefined }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: undefined }),

  updateNode: (id, patch) => set((state) => ({
    ...withHistory(state),
    nodes: state.nodes.map((item) => item.id === id ? { ...item, data: { ...item.data, ...patch } } : item),
  })),

  updateEdge: (id, patch) => set((state) => ({
    ...withHistory(state),
    edges: state.edges.map((item) => {
      if (item.id !== id) return item
      const data = { polarity: 'positive' as const, ...item.data, ...patch }
      return {
        ...item,
        animated: Boolean(data.delay),
        label: `${data.polarity === 'positive' ? '+' : '−'}${data.delay ? ' · 延迟' : ''}`,
        data,
      }
    }),
  })),

  addNode: (kind) => set((state) => {
    const id = `${kind}-${crypto.randomUUID()}`
    const labels = { stock: '新库存', flow: '新流量', auxiliary: '辅助变量', parameter: '新参数' }
    return {
      ...withHistory(state),
      nodes: [...state.nodes, {
        id,
        type: 'lab',
        position: { x: 300 + Math.random() * 200, y: 180 + Math.random() * 160 },
        data: { label: labels[kind], kind, value: 0 },
      }],
      selectedNodeId: id,
      selectedEdgeId: undefined,
    }
  }),

  deleteSelection: () => set((state) => {
    if (!state.selectedNodeId && !state.selectedEdgeId) return state
    const selectedNodeId = state.selectedNodeId
    return {
      ...withHistory(state),
      nodes: state.nodes.filter((item) => item.id !== selectedNodeId),
      edges: state.edges.filter((item) => item.id !== state.selectedEdgeId && item.source !== selectedNodeId && item.target !== selectedNodeId),
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
    }
  }),

  updateParameter: (id, value) => set((state) => ({
    ...withHistory(state),
    parameters: state.parameters.map((item) => item.id === id ? { ...item, value } : item),
  })),

  setDuration: (duration) => set((state) => ({ ...withHistory(state), duration })),
  setDt: (dt) => set((state) => ({ ...withHistory(state), dt })),

  runSimulation: () => {
    const state = get()
    const template = getTemplate(state.templateId)
    const parameterMap = Object.fromEntries(state.parameters.map((item) => [item.id, item.value]))
    set({ simulation: template.simulate(parameterMap, state.duration, state.dt) })
  },

  resetParameters: () => {
    const state = get()
    const template = getTemplate(state.templateId)
    set({
      ...withHistory(state),
      parameters: structuredClone(template.parameters),
      duration: template.duration,
      dt: template.dt,
    })
    get().runSimulation()
  },

  saveLocal: () => {
    const workspace = get().exportWorkspace()
    localStorage.setItem('stlab.workspace', JSON.stringify(workspace))
    set({ isDirty: false })
  },

  exportWorkspace: () => {
    const state = get()
    return {
      formatVersion: '1.0',
      templateId: state.templateId,
      title: state.title,
      nodes: state.nodes,
      edges: state.edges,
      parameters: state.parameters,
      duration: state.duration,
      dt: state.dt,
      updatedAt: new Date().toISOString(),
    }
  },

  importWorkspace: (workspace) => {
    if (workspace.formatVersion !== '1.0') throw new Error('不支持的模型文件版本')
    set({
      templateId: workspace.templateId,
      title: workspace.title,
      nodes: workspace.nodes,
      edges: workspace.edges,
      parameters: workspace.parameters,
      duration: workspace.duration,
      dt: workspace.dt,
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
      isDirty: true,
      past: [],
      future: [],
    })
    get().runSimulation()
  },

  undo: () => set((state) => {
    const previous = state.past.at(-1)
    if (!previous) return state
    return {
      ...previous,
      templateId: state.templateId,
      simulation: state.simulation,
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
      isDirty: true,
      past: state.past.slice(0, -1),
      future: [snapshot(state), ...state.future.slice(0, 29)],
    }
  }),

  redo: () => set((state) => {
    const next = state.future[0]
    if (!next) return state
    return {
      ...next,
      templateId: state.templateId,
      simulation: state.simulation,
      selectedNodeId: undefined,
      selectedEdgeId: undefined,
      isDirty: true,
      past: [...state.past, snapshot(state)].slice(-30),
      future: state.future.slice(1),
    }
  }),
}))

export const selectLoops = (state: LabState) => findFeedbackLoops(state.nodes, state.edges)
