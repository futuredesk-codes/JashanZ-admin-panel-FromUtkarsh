import { useState, useEffect, useRef, useMemo } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { ApiError } from '../../api/client'
import { getPolicies, updatePolicy } from '../../api/policy'

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, 4, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
}

function formatUpdatedAt(iso) {
  if (!iso) return 'Never edited — showing original content'
  const d = new Date(iso)
  return `Last updated ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
}

export default function PolicyEditorPage() {
  const [policies, setPolicies] = useState([])
  const [activeSlug, setActiveSlug] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  // Draft content per slug, separate from the last-saved `policies` list, so
  // switching tabs doesn't lose unsaved edits and "unsaved changes" can be
  // detected by comparing draft vs. saved.
  const [drafts, setDrafts] = useState({})

  useEffect(() => {
    let cancelled = false
    getPolicies()
      .then((data) => {
        if (cancelled) return
        const items = data?.policies || []
        setPolicies(items)
        setDrafts(Object.fromEntries(items.map((p) => [p.slug, p.content])))
        if (items.length > 0) setActiveSlug(items[0].slug)
      })
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : 'Could not load policies.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  const activePolicy = useMemo(() => policies.find((p) => p.slug === activeSlug), [policies, activeSlug])
  const draftContent = drafts[activeSlug] ?? ''
  const isDirty = activePolicy && draftContent !== activePolicy.content

  const handleEditorChange = (html) => {
    setDrafts((d) => ({ ...d, [activeSlug]: html }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!activeSlug || saving) return
    setSaving(true)
    setSaveError('')
    try {
      const result = await updatePolicy(activeSlug, draftContent)
      setPolicies((prev) =>
        prev.map((p) => (p.slug === activeSlug ? { ...p, content: result.content, updatedAt: result.updatedAt } : p)),
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save this policy.')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    if (!activePolicy) return
    setDrafts((d) => ({ ...d, [activeSlug]: activePolicy.content }))
    setSaveError('')
  }

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-slate-800">Policies</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Edit the Terms, Privacy Policy, and every other published policy shown to users on the website
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-400">
          Loading policies…
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-sm text-danger font-semibold">
          {error}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start">
          {/* Tab list */}
          <div className="w-full lg:w-64 lg:shrink-0 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-row lg:flex-col overflow-x-auto">
            {policies.map((p) => {
              const dirty = drafts[p.slug] !== undefined && drafts[p.slug] !== p.content
              return (
                <button
                  key={p.slug}
                  onClick={() => setActiveSlug(p.slug)}
                  className={`
                    flex-1 lg:flex-none flex items-center justify-between gap-2
                    px-3.5 lg:px-4 py-3 lg:py-3.5 text-sm font-bold whitespace-nowrap text-left transition-colors
                    border-b-2 lg:border-b lg:border-l-2 border-r lg:border-r-0 last:border-r-0 lg:last:border-b-0
                    ${activeSlug === p.slug
                      ? 'border-brand lg:border-slate-100 lg:border-l-brand bg-brand/8 text-brand'
                      : 'border-transparent lg:border-slate-100 lg:border-l-transparent text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <span className="truncate">{p.label}</span>
                  {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />}
                </button>
              )
            })}
          </div>

          {/* Editor */}
          <div className="flex-1 min-w-0 w-full bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 space-y-4">
            {activePolicy && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm">{activePolicy.label}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{formatUpdatedAt(activePolicy.updatedAt)}</p>
                  </div>
                  {isDirty && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                      Unsaved changes
                    </span>
                  )}
                </div>

                <div className="quill-wrap rounded-xl border border-slate-200 overflow-hidden">
                  <ReactQuill
                    key={activeSlug}
                    theme="snow"
                    value={draftContent}
                    onChange={handleEditorChange}
                    modules={QUILL_MODULES}
                  />
                </div>

                {saveError && <p className="text-sm text-danger font-semibold">{saveError}</p>}

                <div className="flex items-center justify-end gap-2.5">
                  {isDirty && (
                    <button
                      onClick={handleDiscard}
                      disabled={saving}
                      className="text-sm font-bold text-slate-500 hover:text-slate-700 px-4 py-2.5 disabled:opacity-40"
                    >
                      Discard changes
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className="bg-brand text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-brand/90 disabled:opacity-40"
                  >
                    {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
