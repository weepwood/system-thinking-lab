export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const logistic = (value: number) => 1 / (1 + Math.exp(-value))

export const round = (value: number, digits = 3) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
