import type { EvidenceTier } from './types'

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function pluralise(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function formatYears(years: number): string {
  return Number.isInteger(years) ? String(years) : years.toFixed(1)
}

export function formatWeek(weekStart: string): string {
  return new Date(`${weekStart}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function formatPercent(part: number, whole: number): string {
  return whole === 0 ? '—' : `${Math.round((part / whole) * 100)}%`
}

export function formatDays(days: number): string {
  if (days < 1) {
    return 'Under a day'
  }
  const rounded = Math.round(days * 10) / 10
  return `${rounded} ${rounded === 1 ? 'day' : 'days'}`
}

export function evidenceLabel(tier: EvidenceTier, applicationCount: number): string {
  if (tier === 'none') {
    return 'General review'
  }
  const applications = applicationCount === 1 ? '1 application' : `${applicationCount} applications`
  return `Based on ${applications}`
}
