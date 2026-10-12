import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import { apiRequest } from '../api'
import type { Cv } from '../types'

interface CvPreviewModalProps {
  cv: Cv
  onClose: () => void
  onDeleted: (id: number) => void
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

function CvPreviewModal({ cv, onClose, onDeleted }: CvPreviewModalProps) {
  const [deleting, setDeleting] = useState(false)
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
      onDeleted(cv.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete CV')
      setDeleting(false)
    }
  }

  return (
    <Modal title={cv.fileName} onClose={onClose} size="xl">
      {cv.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? (
        <DocxPreview cvId={cv.id} />
      ) : (
        <iframe
          src={fileUrl}
          title={`Preview of ${cv.fileName}`}
          className="h-[65vh] w-full rounded-lg border border-slate-200"
        />
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
    </Modal>
  )
}

export default CvPreviewModal
