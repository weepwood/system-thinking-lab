import { describe, expect, it } from 'vitest'
import { findFeedbackLoops } from './loops'
import type { LabEdge, LabNode } from '../types/model'

const nodes: LabNode[] = ['a', 'b', 'c'].map((id, index) => ({
  id,
  type: 'lab',
  position: { x: index * 100, y: 0 },
  data: { label: id, kind: 'auxiliary' },
}))

const edges: LabEdge[] = [
  { id: 'ab', source: 'a', target: 'b', data: { polarity: 'positive' } },
  { id: 'bc', source: 'b', target: 'c', data: { polarity: 'negative' } },
  { id: 'ca', source: 'c', target: 'a', data: { polarity: 'positive' } },
]

describe('findFeedbackLoops', () => {
  it('classifies a loop with one negative edge as balancing', () => {
    const loops = findFeedbackLoops(nodes, edges)
    expect(loops).toHaveLength(1)
    expect(loops[0].kind).toBe('balancing')
    expect(loops[0].negativeEdges).toBe(1)
  })
})
