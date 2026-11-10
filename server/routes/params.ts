const ID_PATTERN = /^[1-9]\d*$/

export function parseId(raw: string): number | null {
  return ID_PATTERN.test(raw) ? Number(raw) : null
}

export function parseIdValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return parseId(String(value))
  }
  return typeof value === 'string' ? parseId(value) : null
}
