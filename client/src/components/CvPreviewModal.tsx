import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import { apiRequest } from '../api'
import type { Cv } from '../types'

interface CvPreviewModalProps {
  cv: Cv
  onClose: () => void
  onUpdated: (cv: Cv) => void
  onDeleted: () => void
}

function DocxPreview({ cvId }: { cvId: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const container = containerRef.current
    let cancelled = false

    async function render() {
      try {
        const res = await fetch(`/api/cvs/${cvId}/file`, { credentials: 'include' })
        if (!res.ok) {
          throw new Error('Could not load CV')
        }
        const blob = await res.blob()
        const { renderAsync } = await import('docx-preview')
        if (cancelled || !container) {
          return
        }
        await renderAsync(blob, container)
        if (!cancelled) {
          setStatus('ready')
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
        }
      }
    }
    render()

    return () => {
      cancelled = true
      if (container) {
        container.replaceChildren()
      }
    }
  }, [cvId])

  return (
    <>
      {status === 'loading' && <p className="text-sm text-slate-500">Loading preview...</p>}
      {status === 'error' && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not preview this document. You can still download it.
        </p>
      )}
      <div ref={containerRef} className="max-h-[65vh] overflow-auto rounded-lg bg-slate-100" />
    </>
  )
}

function CvPreviewModal({ cv, onClose, onUpdated, onDeleted }: CvPreviewModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [settingPrimary, setSettingPrimary] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileUrl = `/api/cvs/${cv.id}/file`

  async function handleDelete() {
    if (!window.confirm(`Delete "${cv.fileName}"?`)) {
      return
    }
    setDeleting(true)
    setError(null)
    try {
      await apiRequest(`/api/cvs/${cv.id}`, { method: 'DELETE' })
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete CV')
      setDeleting(false)
    }
  }

  async function handleSetPrimary() {
    setSettingPrimary(true)
    setError(null)
    try {
      onUpdated(await apiRequest<Cv>(`/api/cvs/${cv.id}/primary`, { method: 'PUT' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set primary CV')
    } finally {
      setSettingPrimary(false)
    }
  }

  async function handleExtractSkills() {
    setExtracting(true)
    setError(null)
    try {
      onUpdated(await apiRequest<Cv>(`/api/cvs/${cv.id}/extract-skills`, { method: 'POST' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not extract skills')
    } finally {
      setExtracting(false)
    }
  }

  const title = (
    <>
      <span className="truncate">{cv.fileName}</span>
      <button
        type="button"
        onClick={handleSetPrimary}
        disabled={cv.isPrimary || settingPrimary}
        aria-pressed={cv.isPrimary}
        aria-label={cv.isPrimary ? 'Primary CV' : 'Set as primary CV'}
        title={cv.isPrimary ? 'Primary CV' : 'Set as primary CV'}
        className="shrink-0 text-amber-500 enabled:hover:text-amber-600 disabled:cursor-default"
      >
        {cv.isPrimary ? '★' : '☆'}
      </button>
    </>
  )

  return (
    <Modal title={title} onClose={onClose} size="xl">
      {cv.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
        <DocxPreview cvId={cv.id} />
      ) : (
        <iframe
          src={fileUrl}
          title={`Preview of ${cv.fileName}`}
          className="h-[65vh] w-full rounded-lg border border-slate-200"
        />
      )}

      {cv.textExtractionStatus === 'success' && (
        <p className="mt-4 text-sm text-slate-600">
          {cv.skillsExtractionStatus === 'success' ? (
            'Skills extracted.'
          ) : (
            <>
              {cv.skillsExtractionStatus === 'failed'
                ? 'Could not extract skills. '
                : 'Skills have not been extracted yet. '}
              <button
                type="button"
                onClick={handleExtractSkills}
                disabled={extracting}
                className="font-medium text-teal-700 underline disabled:opacity-60"
              >
                {extracting ? 'Extracting…' : cv.skillsExtractionStatus === 'failed' ? 'Retry' : 'Extract skills'}
              </button>
            </>
          )}
        </p>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex gap-3">
        <a
          href={`${fileUrl}?download=1`}
          className="rounded-lg bg-linear-to-br from-cyan-500 to-teal-600 px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          Download
        </a>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold text-slate-900">Debug: extracted JSON</h3>
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
          {JSON.stringify(cv.skillsExtraction, null, 2)}
        </pre>
      </div>
    </Modal>
  )
}

export default CvPreviewModal
