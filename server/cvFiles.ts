import { extractText } from 'unpdf'
import mammoth from 'mammoth'

export const MAX_CV_BYTES = 5 * 1024 * 1024

export const CV_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const
export type CvMimeType = (typeof CV_MIME_TYPES)[number]

const EXTENSION_BY_TYPE: Record<CvMimeType, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
}

const PDF_SIGNATURE = Buffer.from('%PDF-')
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04])

export class CvParseError extends Error {}

function hasExtension(fileName: string, extension: string): boolean {
  return fileName.toLowerCase().endsWith(`.${extension}`)
}

function isUtf8Text(buffer: Buffer): boolean {
  if (buffer.includes(0)) {
    return false
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    return true
  } catch {
    return false
  }
}

export function detectCvType(buffer: Buffer, fileName: string): CvMimeType | null {
  if (buffer.length === 0) {
    return null
  }
  if (buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE) && hasExtension(fileName, 'pdf')) {
    return 'application/pdf'
  }
  if (buffer.subarray(0, ZIP_SIGNATURE.length).equals(ZIP_SIGNATURE) && hasExtension(fileName, 'docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (hasExtension(fileName, 'txt') && isUtf8Text(buffer)) {
    return 'text/plain'
  }
  return null
}

function normaliseText(raw: string): string {
  return raw
    .replace(/\0/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function extractCvText(buffer: Buffer, type: CvMimeType): Promise<string> {
  try {
    switch (type) {
      case 'application/pdf': {
        // Uint8Array.from copies: pdf.js may take ownership of the memory it is given.
        const { text } = await extractText(Uint8Array.from(buffer), { mergePages: true })
        return normaliseText(text)
      }
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const { value } = await mammoth.extractRawText({ buffer })
        return normaliseText(value)
      }
      case 'text/plain':
        return normaliseText(buffer.toString('utf-8'))
    }
  } catch (err) {
    throw new CvParseError(err instanceof Error ? err.message : 'Could not read the file')
  }
}

const MAX_FILE_NAME_LENGTH = 150

export function sanitiseFileName(rawName: string, type: CvMimeType): string {
  const extension = EXTENSION_BY_TYPE[type]
  const base = rawName
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
  if (base === '' || base === `.${extension}`) {
    return `cv.${extension}`
  }
  if (base.length <= MAX_FILE_NAME_LENGTH) {
    return base
  }
  const suffix = hasExtension(base, extension) ? `.${extension}` : ''
  return base.slice(0, MAX_FILE_NAME_LENGTH - suffix.length) + suffix
}
