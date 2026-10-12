const ID_PATTERN = /^[1-9]\d*$/

export function parseId(raw: string): number | null {
  return ID_PATTERN.test(raw) ? Number(raw) : null
}
