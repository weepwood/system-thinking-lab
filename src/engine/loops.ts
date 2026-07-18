import type { LabEdge, LabNode, LoopInfo } from '../types/model'

export function findFeedbackLoops(nodes: LabNode[], edges: LabEdge[]): LoopInfo[] {
  const adjacency = new Map<string, LabEdge[]>()
  nodes.forEach((node) => adjacency.set(node.id, []))
  edges.forEach((edge) => adjacency.get(edge.source)?.push(edge))

  const found = new Map<string, LoopInfo>()
  const maxDepth = Math.min(9, nodes.length)

  const walk = (
    start: string,
    current: string,
    visited: string[],
    pathEdges: LabEdge[],
  ) => {
    if (visited.length > maxDepth) return
    for (const edge of adjacency.get(current) ?? []) {
      if (edge.target === start && visited.length >= 2) {
        const cycleNodes = [...visited]
        const canonical = canonicalizeCycle(cycleNodes)
        if (!found.has(canonical)) {
          const allEdges = [...pathEdges, edge]
          const negativeEdges = allEdges.filter(
            (item) => item.data?.polarity === 'negative',
          ).length
          found.set(canonical, {
            id: canonical,
            nodeIds: cycleNodes,
            edgeIds: allEdges.map((item) => item.id),
            kind: negativeEdges % 2 === 0 ? 'reinforcing' : 'balancing',
            negativeEdges,
          })
        }
        continue
      }
      if (!visited.includes(edge.target)) {
        walk(start, edge.target, [...visited, edge.target], [...pathEdges, edge])
      }
    }
  }

  nodes.forEach((node) => walk(node.id, node.id, [node.id], []))
  return [...found.values()].sort((a, b) => a.nodeIds.length - b.nodeIds.length)
}

function canonicalizeCycle(ids: string[]) {
  const rotations = ids.map((_, index) => [...ids.slice(index), ...ids.slice(0, index)].join('>'))
  return rotations.sort()[0]
}
