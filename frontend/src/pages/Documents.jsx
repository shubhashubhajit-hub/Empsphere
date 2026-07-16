import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [files, setFiles] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [resultModal, setResultModal] = useState(null)
  const [busyDocId, setBusyDocId] = useState(null)
  const [expiringDocs, setExpiringDocs] = useState([])
  const [replacingDocId, setReplacingDocId] = useState(null)
  const [versionsModal, setVersionsModal] = useState(null)

  function loadDocs(catId = activeCategory, query = searchQuery) {
    const params = {}
    if (catId) params.category_id = catId
    if (query) params.q = query
    client.get('/documents/', { params }).then((res) => setDocs(res.data))
  }

  function loadExpiring() {
    client.get('/documents/expiring', { params: { days: 14 } }).then((res) => setExpiringDocs(res.data)).catch(() => {})
  }

  useEffect(() => {
    client.get('/documents/categories').then((res) => setCategories(res.data))
    loadDocs()
    loadExpiring()
  }, [])

  useEffect(() => {
    loadDocs(activeCategory)
  }, [activeCategory])

  useEffect(() => {
    const timer = setTimeout(() => loadDocs(activeCategory, searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  async function handleUpload(e) {
    e.preventDefault()
    if (files.length === 0) return
    setUploading(true)
    setMessage('')

    const formData = new FormData()
    for (const f of files) formData.append('files', f)
    if (categoryId) formData.append('category_id', categoryId)
    if (tags) formData.append('tags', tags)

    try {
      const res = await client.post('/documents/upload-bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (expiryDate && res.data.length > 0) {
        await Promise.all(
          res.data.map((d) => client.put(`/documents/${d.id}`, { expiry_date: new Date(expiryDate).toISOString() }))
        )
      }
      setMessage(`${res.data.length} document(s) uploaded and indexed successfully.`)
      setShowModal(false)
      setFiles([])
      setExpiryDate('')
      loadDocs()
      loadExpiring()
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleView(doc) {
    setBusyDocId(doc.id)
    try {
      const res = await client.get(`/documents/${doc.id}/file`, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(res.data)
      window.open(blobUrl, '_blank')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
      loadDocs()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not open this document')
    } finally {
      setBusyDocId(null)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this document?')) return
    await client.delete(`/documents/${id}`)
    loadDocs()
  }

  async function handleSummarize(doc) {
    setBusyDocId(doc.id)
    try {
      const res = await client.post(`/documents/${doc.id}/summarize`)
      setResultModal({ type: 'summary', title: doc.title, data: res.data.summary })
    } catch (err) {
      setResultModal({ type: 'error', title: doc.title, data: err.response?.data?.detail || 'Could not summarize this document' })
    } finally {
      setBusyDocId(null)
    }
  }

  async function handleQuiz(doc) {
    setBusyDocId(doc.id)
    try {
      const res = await client.post(`/documents/${doc.id}/generate-quiz?num_questions=5`)
      setResultModal({ type: 'quiz', title: doc.title, data: res.data.questions })
    } catch (err) {
      setResultModal({ type: 'error', title: doc.title, data: err.response?.data?.detail || 'Could not generate a quiz for this document' })
    } finally {
      setBusyDocId(null)
    }
  }

  function triggerReplace(docId) {
    setReplacingDocId(docId)
    document.getElementById(`replace-input-${docId}`).click()
  }

  async function handleReplaceFile(doc, e) {
    const newFile = e.target.files[0]
    e.target.value = ''
    if (!newFile) return
    setBusyDocId(doc.id)
    try {
      const formData = new FormData()
      formData.append('file', newFile)
      await client.put(`/documents/${doc.id}/replace`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessage(`"${doc.title}" replaced with a new version.`)
      loadDocs()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not replace this file')
    } finally {
      setBusyDocId(null)
      setReplacingDocId(null)
    }
  }

  async function openVersions(doc) {
    try {
      const res = await client.get(`/documents/${doc.id}/versions`)
      setVersionsModal({ doc, versions: res.data })
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not load version history')
    }
  }

  async function downloadVersion(doc, version) {
    const res = await client.get(`/documents/${doc.id}/versions/${version.id}/file`, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `v${version.version_number}_${doc.title}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  }

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-6">
        {expiringDocs.length > 0 && (
          <div className="bg-gold/10 border border-gold/40 text-gold rounded-lg px-4 py-3 mb-5 text-sm">
            <span className="font-semibold">{expiringDocs.length} document(s) due for review soon:</span>{' '}
            {expiringDocs.map((d) => d.title).join(', ')}
          </div>
        )}

        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            <Chip active={!activeCategory} onClick={() => setActiveCategory(null)}>All</Chip>
            {categories.map((c) => (
              <Chip key={c.id} active={activeCategory === c.id} onClick={() => setActiveCategory(c.id)}>{c.name}</Chip>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by name or content…"
              className="bg-panel border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold w-64"
            />
            <button onClick={() => setShowModal(true)} className="bg-gold text-ink text-sm font-semibold px-4 py-2 rounded-lg shrink-0">
              + Upload Document
            </button>
          </div>
        </div>

        {message && <div className="text-sm text-teal-400 mb-3">{message}</div>}

        <div className="bg-panel border border-panelLine rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-panelLine">
                <th className="p-3">Name</th><th className="p-3">Type</th><th className="p-3">Tags</th><th className="p-3">Views</th><th className="p-3">Expiry</th><th className="p-3">Uploaded</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-panelLine last:border-0">
                  <td className="p-3">{d.title}</td>
                  <td className="p-3 uppercase text-xs text-slate-400">{d.file_type}</td>
                  <td className="p-3 text-xs text-slate-400">{d.tags}</td>
                  <td className="p-3">{d.view_count}</td>
                  <td className="p-3 text-xs text-slate-500">{d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : '—'}</td>
                  <td className="p-3 text-xs text-slate-500">{new Date(d.created_at).toLocaleDateString()}</td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    <button onClick={() => handleView(d)} disabled={busyDocId === d.id} className="text-gold hover:text-yellow-400 text-xs font-medium disabled:opacity-40">View</button>
                    <button onClick={() => handleSummarize(d)} disabled={busyDocId === d.id} className="text-slate-400 hover:text-white text-xs disabled:opacity-40">Summarize</button>
                    <button onClick={() => handleQuiz(d)} disabled={busyDocId === d.id} className="text-slate-400 hover:text-white text-xs disabled:opacity-40">Quiz</button>
                    <button onClick={() => triggerReplace(d.id)} disabled={busyDocId === d.id} className="text-slate-400 hover:text-white text-xs disabled:opacity-40">Replace</button>
                    <input
                      id={`replace-input-${d.id}`}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={(e) => handleReplaceFile(d, e)}
                    />
                    <button onClick={() => openVersions(d)} className="text-slate-400 hover:text-white text-xs">History</button>
                    <button onClick={() => handleDelete(d.id)} className="text-slate-400 hover:text-red-400 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td colSpan="7" className="p-6 text-center text-slate-500">No documents yet — upload one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-panel border border-panelLine rounded-2xl p-6 w-96">
            <h3 className="font-semibold text-lg mb-4">Upload Document(s)</h3>
            <form onSubmit={handleUpload}>
              <input type="file" accept=".pdf,.docx,.txt" multiple onChange={(e) => setFiles(Array.from(e.target.files))}
                className="w-full text-sm mb-1 file:bg-ink file:border-0 file:text-white file:rounded-md file:px-3 file:py-1.5 file:mr-3" />
              {files.length > 1 && <div className="text-xs text-slate-400 mb-3">{files.length} files selected</div>}
              {files.length <= 1 && <div className="mb-3" />}
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm mb-3">
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma separated"
                className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm mb-3" />
              <label className="text-xs text-slate-400 mb-1 block">Review / expiry date (optional)</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm mb-4" />

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="border border-panelLine rounded-lg px-4 py-2 text-sm">Cancel</button>
                <button disabled={uploading || files.length === 0} className="bg-gold text-ink font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-50">
                  {uploading ? 'Uploading…' : `Upload ${files.length > 1 ? `(${files.length})` : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {versionsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-panel border border-panelLine rounded-2xl p-6 w-[420px] max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">
                Version History
                <div className="text-xs text-slate-400 font-normal mt-0.5">{versionsModal.doc.title}</div>
              </h3>
              <button onClick={() => setVersionsModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            {versionsModal.versions.length === 0 && (
              <div className="text-sm text-slate-500">No earlier versions — this is the only version so far.</div>
            )}
            <div className="space-y-2">
              {versionsModal.versions.map((v) => (
                <div key={v.id} className="flex justify-between items-center text-sm bg-ink border border-panelLine rounded-lg px-3 py-2">
                  <div>
                    <div className="font-medium">Version {v.version_number}</div>
                    <div className="text-xs text-slate-500">{new Date(v.created_at).toLocaleString()}</div>
                  </div>
                  <button onClick={() => downloadVersion(versionsModal.doc, v)} className="text-xs text-gold hover:underline">⬇ Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {resultModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-panel border border-panelLine rounded-2xl p-6 w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">
                {resultModal.type === 'summary' && 'Summary'}
                {resultModal.type === 'quiz' && 'Quiz'}
                {resultModal.type === 'error' && 'Couldn\'t complete that'}
                <div className="text-xs text-slate-400 font-normal mt-0.5">{resultModal.title}</div>
              </h3>
              <button onClick={() => setResultModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {resultModal.type === 'summary' && (
              <p className="text-sm leading-relaxed">{resultModal.data}</p>
            )}

            {resultModal.type === 'error' && (
              <p className="text-sm text-red-400">{resultModal.data}</p>
            )}

            {resultModal.type === 'quiz' && (
              <div className="space-y-4">
                {resultModal.data.map((q, i) => (
                  <div key={i} className="text-sm">
                    <div className="font-medium mb-1.5">{i + 1}. {q.question}</div>
                    <div className="space-y-1">
                      {q.options.map((opt, j) => (
                        <div key={j} className={`text-xs px-3 py-1.5 rounded-lg border ${opt === q.correct_answer ? 'border-teal text-teal-400' : 'border-panelLine text-slate-400'}`}>
                          {opt} {opt === q.correct_answer && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border ${active ? 'border-gold text-gold bg-gold/10' : 'border-panelLine text-slate-400'}`}>
      {children}
    </button>
  )
}