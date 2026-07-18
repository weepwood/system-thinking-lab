import { describe, expect, it } from 'vitest'
import { modelTemplates } from './templates'

describe('classic model templates', () => {
  it('all templates produce finite simulation points', () => {
    for (const template of modelTemplates) {
      const parameters = Object.fromEntries(template.parameters.map((item) => [item.id, item.value]))
      const points = template.simulate(parameters, Math.min(template.duration, 20), template.dt)
      expect(points.length).toBeGreaterThan(2)
      for (const point of points) {
        for (const value of Object.values(point)) expect(Number.isFinite(value)).toBe(true)
      }
    }
  })
})
