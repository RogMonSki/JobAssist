import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { apiRequest } from '../api'
import CvPreviewModal from './CvPreviewModal'
import type { Cv } from '../types'

const MAX_CV_BYTES = 5 * 1024 * 1024
const MAX_CVS = 10

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function CvBar() {
  const [cvs, setCvs] = useState<Cv[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selected, setSelected] = useState<Cv | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiRequest<Cv[]>('/api/cvs')
      .then(setCvs)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load CVs')
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    setError(null)
    setNotice(null)
    if (file.size > MAX_CV_BYTES) {
      setError(`That file is too large. The limit is ${MAX_CV_BYTES / (1024 * 1024)} MB`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const cv = await apiRequest<Cv>('/api/cvs', { method: 'POST', body: formData })
      setCvs((current) => [...current, cv])
      if (cv.textExtractionStatus === 'failed') {
        setNotice(
          `"${cv.fileName}" was saved, but no text could be read from it. It may be a scanned image, so it can't be used for skill-gap analysis.`
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload CV')
    } finally {
      setUploading(false)
    }
  }

  function handleDeleted(id: number) {
    setCvs((current) => current.filter((cv) => cv.id !== id))
    setSelected(null)
  }

  const atLimit = cvs.length >= MAX_CVS

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 font-semibold text-slate-900">Your CVs</h2>

        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
          {loading ? (
            <p className="text-sm text-slate-500">Loading CVs...</p>
          ) : cvs.length === 0 ? (
            <p className="text-sm text-slate-500">No CVs uploaded yet.</p>
          ) : (
            cvs.map((cv) => (
              <button
                key={cv.id}
                type="button"
                onClick={() => setSelected(cv)}
                title={cv.fileName}
                className="shrink-0 rounded-lg border border-teal-600/30 bg-white px-3 py-1.5 text-left shadow-sm hover:border-teal-600"
              >
                <span className="flex items-center gap-1 text-sm font-medium text-slate-900">
                  <span className="max-w-48 truncate">{cv.fileName}</span>
                  {cv.textExtractionStatus === 'failed' && (
                    <span role="img" aria-label="Text could not be read" className="text-amber-600">
                      ⚠
                    </span>
                  )}
                </span>
                <span className="block text-xs text-slate-500">{formatDate(cv.uploadedAt)}</span>
              </button>
            ))
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || atLimit}
          title={atLimit ? `You can store up to ${MAX_CVS} CVs` : undefined}
          className="shrink-0 rounded-lg border border-teal-600 px-4 py-2 font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-60"
        >
          {uploading ? 'Uploading...' : 'Upload CV'}
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}

      {selected && (
        <CvPreviewModal cv={selected} onClose={() => setSelected(null)} onDeleted={handleDeleted} />
      )}
    </div>
  )
}

export default CvBar
