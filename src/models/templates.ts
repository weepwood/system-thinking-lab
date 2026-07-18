import { MarkerType } from '@xyflow/react'
import { clamp, round } from '../engine/math'
import type {
  LabEdge,
  LabNode,
  ModelTemplate,
  ParameterDefinition,
  SimulationPoint,
} from '../types/model'

const node = (
  id: string,
  label: string,
  kind: LabNode['data']['kind'],
  x: number,
  y: number,
  unit = '',
  description = '',
): LabNode => ({
  id,
  type: 'lab',
  position: { x, y },
  data: { label, kind, unit, description },
})

const edge = (
  id: string,
  source: string,
  target: string,
  polarity: 'positive' | 'negative',
  delay = false,
  description = '',
): LabEdge => ({
  id,
  source,
  target,
  type: 'smoothstep',
  animated: delay,
  label: delay ? `${polarity === 'positive' ? '+' : '−'} · 延迟` : polarity === 'positive' ? '+' : '−',
  markerEnd: { type: MarkerType.ArrowClosed },
  data: { polarity, delay, description },
})

const parameter = (
  id: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  unit: string,
  description: string,
): ParameterDefinition => ({ id, label, value, min, max, step, unit, description })

const pushPoint = (points: SimulationPoint[], time: number, values: Record<string, number>) => {
  points.push({ time: round(time, 4), ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, round(value, 4)])) })
}

const platformGrowth: ModelTemplate = {
  id: 'platform-growth',
  name: '平台增长与容量',
  category: '产品与技术',
  summary: '观察网络效应、服务器拥堵、满意度和用户流失之间的竞争。',
  question: '提前扩容是否比持续获客更能提高长期用户规模？',
  duration: 180,
  dt: 0.25,
  parameters: [
    parameter('growthRate', '自然增长率', 0.035, 0.005, 0.08, 0.001, '/天', '网络效应驱动的新用户增长。'),
    parameter('capacity', '初始服务器容量', 150000, 50000, 400000, 10000, '请求/天', '系统能够稳定处理的每日请求。'),
    parameter('requestsPerUser', '人均请求量', 12, 2, 30, 1, '次/天', '每个活跃用户产生的请求。'),
    parameter('baseChurn', '基础流失率', 0.009, 0.001, 0.035, 0.001, '/天', '不考虑性能问题时的自然流失。'),
    parameter('expansionRate', '容量投资率', 0.12, 0, 0.5, 0.01, '比例', '收入中用于基础设施扩容的比例。'),
    parameter('expansionDelay', '扩容延迟', 14, 0, 45, 1, '天', '投资转化为服务器容量的延迟。'),
  ],
  series: [
    { key: 'users', label: '用户数量', unit: '人' },
    { key: 'capacityUtilization', label: '容量利用率', unit: '%' },
    { key: 'satisfaction', label: '用户满意度', unit: '%' },
    { key: 'responseTime', label: '响应时间', unit: '秒' },
  ],
  nodes: [
    node('users', '用户数量', 'stock', 50, 170, '人', '平台当前活跃用户存量。'),
    node('content', '内容数量', 'stock', 300, 40, '条'),
    node('attraction', '平台吸引力', 'auxiliary', 570, 40, '指数'),
    node('newUsers', '新用户增长', 'flow', 570, 170, '人/天'),
    node('load', '服务器负载', 'auxiliary', 300, 300, '请求/天'),
    node('response', '响应时间', 'auxiliary', 570, 300, '秒'),
    node('satisfaction', '用户满意度', 'auxiliary', 820, 300, '%'),
    node('churn', '用户流失', 'flow', 820, 170, '人/天'),
    node('revenue', '平台收入', 'flow', 50, 430, '元/天'),
    node('capacity', '服务器容量', 'stock', 570, 430, '请求/天'),
  ],
  edges: [
    edge('e1', 'users', 'content', 'positive'),
    edge('e2', 'content', 'attraction', 'positive'),
    edge('e3', 'attraction', 'newUsers', 'positive'),
    edge('e4', 'newUsers', 'users', 'positive'),
    edge('e5', 'users', 'load', 'positive'),
    edge('e6', 'load', 'response', 'positive'),
    edge('e7', 'capacity', 'response', 'negative'),
    edge('e8', 'response', 'satisfaction', 'negative'),
    edge('e9', 'satisfaction', 'churn', 'negative'),
    edge('e10', 'churn', 'users', 'negative'),
    edge('e11', 'users', 'revenue', 'positive'),
    edge('e12', 'revenue', 'capacity', 'positive', true),
  ],
  simulate: (p, duration, dt) => {
    let users = 8000
    let content = 14000
    let capacity = p.capacity
    const points: SimulationPoint[] = []
    const delaySteps = Math.max(1, Math.round(p.expansionDelay / dt))
    const expansionQueue = Array.from({ length: delaySteps }, () => 0)

    for (let time = 0; time <= duration + 1e-9; time += dt) {
      const load = users * p.requestsPerUser
      const utilization = load / Math.max(capacity, 1)
      const responseTime = 0.18 * (1 + Math.max(0, utilization) ** 3.4)
      const satisfaction = clamp(1 - (responseTime - 0.22) / 3.2, 0.05, 1)
      const attraction = Math.log1p(content) / 10 * satisfaction
      const acquisition = users * p.growthRate * attraction
      const churnRate = p.baseChurn * (1 + (1 - satisfaction) * 6)
      const churn = users * churnRate
      const revenue = users * 0.18
      const plannedExpansion = revenue * p.expansionRate * 0.65
      expansionQueue.push(plannedExpansion)
      const realizedExpansion = expansionQueue.shift() ?? 0

      pushPoint(points, time, {
        users,
        capacityUtilization: utilization * 100,
        satisfaction: satisfaction * 100,
        responseTime,
        content,
        capacity,
      })

      users = Math.max(0, users + (acquisition - churn) * dt)
      content = Math.max(0, content + (users * 0.004 - content * 0.0015) * dt)
      capacity = Math.max(1000, capacity + realizedExpansion * dt - capacity * 0.00035 * dt)
    }
    return points
  },
}

const sirModel: ModelTemplate = {
  id: 'sir-epidemic',
  name: 'SIR 传染病模型',
  category: '公共卫生',
  summary: '易感者、感染者和康复者之间的库存转移模型。',
  question: '降低接触率和提高康复率，哪项措施更能压低感染峰值？',
  duration: 160,
  dt: 0.2,
  parameters: [
    parameter('population', '总人口', 100000, 10000, 1000000, 10000, '人', '封闭系统内的总人口。'),
    parameter('initialInfected', '初始感染者', 80, 1, 3000, 10, '人', '仿真开始时的感染人数。'),
    parameter('contactRate', '有效接触率', 0.34, 0.05, 0.8, 0.01, '/天', '感染传播的综合概率。'),
    parameter('recoveryRate', '康复率', 0.11, 0.03, 0.3, 0.01, '/天', '感染者每日康复比例。'),
  ],
  series: [
    { key: 'infected', label: '感染者', unit: '人' },
    { key: 'susceptible', label: '易感者', unit: '人' },
    { key: 'recovered', label: '康复者', unit: '人' },
  ],
  nodes: [
    node('susceptible', '易感者', 'stock', 60, 180, '人'),
    node('infection', '新增感染', 'flow', 330, 180, '人/天'),
    node('infected', '感染者', 'stock', 590, 180, '人'),
    node('recovery', '康复流量', 'flow', 850, 180, '人/天'),
    node('recovered', '康复者', 'stock', 1110, 180, '人'),
    node('contactRate', '有效接触率', 'parameter', 330, 360, '/天'),
    node('recoveryRate', '康复率', 'parameter', 850, 360, '/天'),
  ],
  edges: [
    edge('s1', 'susceptible', 'infection', 'positive'),
    edge('s2', 'infected', 'infection', 'positive'),
    edge('s3', 'infection', 'susceptible', 'negative'),
    edge('s4', 'infection', 'infected', 'positive'),
    edge('s5', 'infected', 'recovery', 'positive'),
    edge('s6', 'recovery', 'infected', 'negative'),
    edge('s7', 'recovery', 'recovered', 'positive'),
    edge('s8', 'contactRate', 'infection', 'positive'),
    edge('s9', 'recoveryRate', 'recovery', 'positive'),
  ],
  simulate: (p, duration, dt) => {
    let infected = Math.min(p.initialInfected, p.population)
    let susceptible = p.population - infected
    let recovered = 0
    const points: SimulationPoint[] = []
    for (let time = 0; time <= duration + 1e-9; time += dt) {
      pushPoint(points, time, { susceptible, infected, recovered })
      const infections = p.contactRate * susceptible * infected / p.population
      const recoveries = p.recoveryRate * infected
      susceptible = Math.max(0, susceptible - infections * dt)
      infected = Math.max(0, infected + (infections - recoveries) * dt)
      recovered = Math.min(p.population, recovered + recoveries * dt)
    }
    return points
  },
}

const predatorPrey: ModelTemplate = {
  id: 'predator-prey',
  name: '捕食者—猎物',
  category: '生态系统',
  summary: 'Lotka–Volterra 型生态振荡，展示两个物种的相互制约。',
  question: '提高捕食效率会稳定生态系统，还是放大种群振荡？',
  duration: 120,
  dt: 0.04,
  parameters: [
    parameter('preyGrowth', '猎物增长率', 0.55, 0.1, 1.2, 0.01, '/月', '猎物在无捕食时的增长率。'),
    parameter('predation', '捕食效率', 0.018, 0.003, 0.04, 0.001, '系数', '相遇后转化为捕食的效率。'),
    parameter('predatorDeath', '捕食者死亡率', 0.42, 0.08, 0.9, 0.01, '/月', '没有食物时捕食者减少速度。'),
    parameter('conversion', '能量转化率', 0.012, 0.002, 0.03, 0.001, '系数', '捕食带来的捕食者增长。'),
  ],
  series: [
    { key: 'prey', label: '猎物数量', unit: '只' },
    { key: 'predators', label: '捕食者数量', unit: '只' },
  ],
  nodes: [
    node('prey', '猎物数量', 'stock', 100, 180, '只'),
    node('preyBirth', '猎物繁殖', 'flow', 100, 40, '只/月'),
    node('predation', '捕食量', 'flow', 430, 180, '只/月'),
    node('predators', '捕食者数量', 'stock', 760, 180, '只'),
    node('predatorBirth', '捕食者繁殖', 'flow', 760, 40, '只/月'),
    node('predatorDeath', '捕食者死亡', 'flow', 760, 330, '只/月'),
  ],
  edges: [
    edge('p1', 'prey', 'preyBirth', 'positive'),
    edge('p2', 'preyBirth', 'prey', 'positive'),
    edge('p3', 'prey', 'predation', 'positive'),
    edge('p4', 'predators', 'predation', 'positive'),
    edge('p5', 'predation', 'prey', 'negative'),
    edge('p6', 'predation', 'predatorBirth', 'positive'),
    edge('p7', 'predatorBirth', 'predators', 'positive'),
    edge('p8', 'predators', 'predatorDeath', 'positive'),
    edge('p9', 'predatorDeath', 'predators', 'negative'),
  ],
  simulate: (p, duration, dt) => {
    let prey = 55
    let predators = 18
    const points: SimulationPoint[] = []
    for (let time = 0; time <= duration + 1e-9; time += dt) {
      pushPoint(points, time, { prey, predators })
      const preyChange = p.preyGrowth * prey - p.predation * prey * predators
      const predatorChange = p.conversion * prey * predators - p.predatorDeath * predators
      prey = Math.max(0.001, prey + preyChange * dt)
      predators = Math.max(0.001, predators + predatorChange * dt)
    }
    return points
  },
}

const commons: ModelTemplate = {
  id: 'tragedy-commons',
  name: '公地悲剧',
  category: '社会与资源',
  summary: '个体扩大开采带来短期收益，却可能耗尽共享资源。',
  question: '配额、资源恢复或行为约束，哪一种更能避免系统崩溃？',
  duration: 100,
  dt: 0.1,
  parameters: [
    parameter('regeneration', '资源再生率', 0.09, 0.01, 0.25, 0.01, '/年', '共享资源的自然恢复能力。'),
    parameter('extraction', '人均开采率', 0.017, 0.002, 0.05, 0.001, '单位/人', '每个参与者期望开采的资源。'),
    parameter('entryRate', '参与者进入率', 0.055, 0, 0.15, 0.005, '/年', '高收益吸引新参与者的速度。'),
    parameter('governance', '治理强度', 0.15, 0, 0.8, 0.01, '比例', '配额和监督对过度开采的抑制。'),
  ],
  series: [
    { key: 'resource', label: '资源存量', unit: '单位' },
    { key: 'users', label: '参与者', unit: '人' },
    { key: 'income', label: '人均收益', unit: '指数' },
  ],
  nodes: [
    node('resource', '公共资源', 'stock', 100, 180, '单位'),
    node('regeneration', '资源再生', 'flow', 100, 40, '单位/年'),
    node('harvest', '总开采量', 'flow', 430, 180, '单位/年'),
    node('users', '参与者数量', 'stock', 760, 180, '人'),
    node('income', '人均收益', 'auxiliary', 430, 350, '指数'),
    node('entry', '新参与者', 'flow', 760, 40, '人/年'),
  ],
  edges: [
    edge('c1', 'resource', 'regeneration', 'positive'),
    edge('c2', 'regeneration', 'resource', 'positive'),
    edge('c3', 'resource', 'harvest', 'positive'),
    edge('c4', 'users', 'harvest', 'positive'),
    edge('c5', 'harvest', 'resource', 'negative'),
    edge('c6', 'resource', 'income', 'positive'),
    edge('c7', 'users', 'income', 'negative'),
    edge('c8', 'income', 'entry', 'positive'),
    edge('c9', 'entry', 'users', 'positive'),
  ],
  simulate: (p, duration, dt) => {
    let resource = 780
    const carryingCapacity = 1000
    let users = 35
    const points: SimulationPoint[] = []
    for (let time = 0; time <= duration + 1e-9; time += dt) {
      const availability = resource / carryingCapacity
      const harvest = users * p.extraction * resource * (1 - p.governance)
      const income = harvest / Math.max(users, 1)
      const regeneration = p.regeneration * resource * (1 - resource / carryingCapacity)
      const entry = users * p.entryRate * clamp(income / 8, -0.4, 1.6)
      const exit = users * clamp((0.8 - income) * 0.04, 0, 0.12)
      pushPoint(points, time, { resource, users, income, availability: availability * 100 })
      resource = clamp(resource + (regeneration - harvest) * dt, 0, carryingCapacity)
      users = Math.max(1, users + (entry - exit) * dt)
    }
    return points
  },
}

const bankRun: ModelTemplate = {
  id: 'bank-run',
  name: '银行挤兑',
  category: '金融系统',
  summary: '信心下降与集中提款相互强化，形成自我实现的危机。',
  question: '提高准备金、存款保险与信息透明，哪项政策最能阻断挤兑回路？',
  duration: 45,
  dt: 0.05,
  parameters: [
    parameter('reserveRatio', '初始准备金率', 0.22, 0.05, 0.6, 0.01, '比例', '银行可立即支付的流动资产比例。'),
    parameter('rumorShock', '谣言冲击', 0.38, 0, 1, 0.01, '强度', '初期负面消息对公众信心的冲击。'),
    parameter('insurance', '存款保险强度', 0.35, 0, 1, 0.01, '比例', '保险制度降低恐慌提款的程度。'),
    parameter('liquiditySupport', '流动性支持', 0.018, 0, 0.08, 0.001, '资金/天', '中央银行或股东提供的流动性。'),
  ],
  series: [
    { key: 'deposits', label: '剩余存款', unit: '资金' },
    { key: 'reserves', label: '流动性储备', unit: '资金' },
    { key: 'confidence', label: '公众信心', unit: '%' },
    { key: 'withdrawalRate', label: '提款率', unit: '%/天' },
  ],
  nodes: [
    node('deposits', '银行存款', 'stock', 90, 180, '资金'),
    node('withdrawals', '集中提款', 'flow', 390, 180, '资金/天'),
    node('reserves', '流动性储备', 'stock', 700, 180, '资金'),
    node('confidence', '公众信心', 'auxiliary', 390, 360, '%'),
    node('rumor', '负面消息', 'parameter', 90, 360, '强度'),
    node('insurance', '存款保险', 'parameter', 700, 360, '强度'),
  ],
  edges: [
    edge('b1', 'rumor', 'confidence', 'negative'),
    edge('b2', 'confidence', 'withdrawals', 'negative'),
    edge('b3', 'withdrawals', 'deposits', 'negative'),
    edge('b4', 'withdrawals', 'reserves', 'negative'),
    edge('b5', 'reserves', 'confidence', 'positive'),
    edge('b6', 'insurance', 'confidence', 'positive'),
    edge('b7', 'deposits', 'withdrawals', 'positive'),
  ],
  simulate: (p, duration, dt) => {
    let deposits = 100
    let reserves = deposits * p.reserveRatio
    let confidence = clamp(0.93 - p.rumorShock * 0.55 + p.insurance * 0.25, 0.05, 1)
    const points: SimulationPoint[] = []
    for (let time = 0; time <= duration + 1e-9; time += dt) {
      const liquidityRatio = reserves / Math.max(deposits, 0.001)
      const withdrawalRate = clamp(0.006 + (1 - confidence) ** 2 * 0.32 + Math.max(0, 0.18 - liquidityRatio) * 0.45, 0, 0.65)
      const withdrawals = deposits * withdrawalRate
      const support = p.liquiditySupport * 100
      const confidenceTarget = clamp(0.35 + liquidityRatio * 1.8 + p.insurance * 0.35 - p.rumorShock * Math.exp(-time / 8) * 0.4, 0.01, 1)
      pushPoint(points, time, { deposits, reserves, confidence: confidence * 100, withdrawalRate: withdrawalRate * 100 })
      deposits = Math.max(0, deposits - withdrawals * dt)
      reserves = Math.max(0, reserves + (support - withdrawals) * dt)
      confidence += (confidenceTarget - confidence) * 0.45 * dt
      if (deposits < 0.01) break
    }
    return points
  },
}

const technologyDiffusion: ModelTemplate = {
  id: 'technology-diffusion',
  name: '技术扩散',
  category: '创新与市场',
  summary: '创新者采用与口碑模仿共同推动新技术进入增长、拐点和饱和阶段。',
  question: '早期营销和产品口碑分别影响扩散曲线的哪一阶段？',
  duration: 120,
  dt: 0.1,
  parameters: [
    parameter('market', '潜在市场', 100000, 10000, 1000000, 10000, '人', '最终可能采用技术的人群规模。'),
    parameter('innovation', '创新系数', 0.012, 0.001, 0.08, 0.001, '/月', '外部宣传和自主尝试带来的采用。'),
    parameter('imitation', '模仿系数', 0.32, 0.03, 0.9, 0.01, '/月', '口碑和社交影响带来的采用。'),
    parameter('abandonment', '放弃率', 0.006, 0, 0.05, 0.001, '/月', '已采用者停止使用的速度。'),
  ],
  series: [
    { key: 'adopters', label: '采用者', unit: '人' },
    { key: 'potential', label: '潜在采用者', unit: '人' },
    { key: 'adoptionRate', label: '新增采用', unit: '人/月' },
    { key: 'penetration', label: '市场渗透率', unit: '%' },
  ],
  nodes: [
    node('potential', '潜在采用者', 'stock', 80, 180, '人'),
    node('adoption', '新增采用', 'flow', 410, 180, '人/月'),
    node('adopters', '采用者', 'stock', 740, 180, '人'),
    node('marketing', '外部营销', 'parameter', 80, 360, '强度'),
    node('wordOfMouth', '口碑传播', 'auxiliary', 410, 360, '强度'),
    node('abandonment', '用户放弃', 'flow', 740, 360, '人/月'),
  ],
  edges: [
    edge('t1', 'potential', 'adoption', 'positive'),
    edge('t2', 'marketing', 'adoption', 'positive'),
    edge('t3', 'adopters', 'wordOfMouth', 'positive'),
    edge('t4', 'wordOfMouth', 'adoption', 'positive'),
    edge('t5', 'adoption', 'potential', 'negative'),
    edge('t6', 'adoption', 'adopters', 'positive'),
    edge('t7', 'adopters', 'abandonment', 'positive'),
    edge('t8', 'abandonment', 'adopters', 'negative'),
  ],
  simulate: (p, duration, dt) => {
    let adopters = 50
    let potential = p.market - adopters
    const points: SimulationPoint[] = []
    for (let time = 0; time <= duration + 1e-9; time += dt) {
      const penetration = adopters / p.market
      const adoptionRate = (p.innovation + p.imitation * penetration) * potential
      const abandonment = adopters * p.abandonment
      pushPoint(points, time, { adopters, potential, adoptionRate, penetration: penetration * 100 })
      const net = (adoptionRate - abandonment) * dt
      adopters = clamp(adopters + net, 0, p.market)
      potential = Math.max(0, p.market - adopters)
    }
    return points
  },
}

export const modelTemplates: ModelTemplate[] = [
  platformGrowth,
  sirModel,
  predatorPrey,
  commons,
  bankRun,
  technologyDiffusion,
]

export const getTemplate = (id: string) =>
  modelTemplates.find((template) => template.id === id) ?? modelTemplates[0]
