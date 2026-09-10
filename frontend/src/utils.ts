/** 通用 UI 工具：渐变封面、日期格式化等。 */

const GRADS: [string, string][] = [
  ['#7D5A3C', '#5C4128'],
  ['#B08A5E', '#8B5E3C'],
  ['#A8554E', '#7E3B36'],
  ['#4A4A4A', '#2A2A2A'],
  ['#3F5E8F', '#2B426B'],
  ['#5B7C7A', '#3F5A58'],
  ['#C2855B', '#9A663E'],
  ['#8A6FA8', '#5E4A78'],
]

/** 依据 id 生成稳定的品牌渐变（封面无图时兜底）。 */
export function gradientFor(seed: number): string {
  const g = GRADS[Math.abs(seed) % GRADS.length]
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`
}

/** ISO 时间截取到 YYYY-MM-DD。 */
export function formatDate(s?: string): string {
  if (!s) return ''
  return s.slice(0, 10)
}
