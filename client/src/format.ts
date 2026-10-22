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

export function evidenceLabel(tier: EvidenceTier, applicationCount: number): string {
  if (tier === 'none') {
    return 'General review'
  }
  const applications = applicationCount === 1 ? '1 application' : `${applicationCount} applications`
  return `Based on ${applications}`
}
