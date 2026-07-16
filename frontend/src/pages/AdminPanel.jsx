import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'

export default function AdminPanel() {
  const [logs, setLogs] = useState([])
  const [backups, setBackups] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function loadLogs() {
    client.get('/admin/logs').then((res) => setLogs(res.data))
  }
  function loadBackups() {
    client.get('/admin/backups').then((res) => setBackups(res.data))
  }

  useEffect(() => { loadLogs(); loadBackups() }, [])

  async function runBackup() {
    setBusy(true); setMessage(''); setError('')
    try {
      const res = await client.post('/admin/backup')
      setMessage(`Backup created: ${res.data.filename}`)
      loadBackups()
    } catch (err) {
      setError(err.response?.data?.detail || 'Backup failed')
    } finally {
      setBusy(false)
    }
  }

  async function restoreBackup(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!confirm('This will overwrite the current database with the uploaded backup. Continue?')) return
    setBusy(true); setMessage(''); setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      await client.post('/admin/restore', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMessage('Database restored successfully.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Restore failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-6 space-y-5">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Admin Panel</h1>

        {message && <div className="text-teal-400 text-sm">{message}</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="bg-panel border border-panelLine rounded-xl p-5">
          <div className="font-semibold text-sm mb-3">Backup & Restore</div>
          <div className="flex gap-2 mb-4">
            <button onClick={runBackup} disabled={busy} className="bg-gold text-ink text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {busy ? 'Working…' : 'Run Backup Now'}
            </button>
            <label className="border border-panelLine text-xs px-4 py-2 rounded-lg cursor-pointer">
              Restore from Backup
              <input type="file" accept=".sql" onChange={restoreBackup} className="hidden" disabled={busy} />
            </label>
          </div>
          <div className="text-xs text-slate-500 mb-2">Recent backups</div>
          {backups.length === 0 && <div className="text-xs text-slate-500">No backups yet.</div>}
          {backups.map((b) => (
            <div key={b} className="flex justify-between text-xs py-1.5 border-b border-panelLine last:border-0">
              <span className="font-mono">{b}</span>
              <a href={`/api/admin/backups/${b}/download`} target="_blank" rel="noreferrer" className="text-teal-400">Download</a>
            </div>
          ))}
        </div>

        <div className="bg-panel border border-panelLine rounded-xl p-5">
          <div className="font-semibold text-sm mb-3">System logs</div>
          <div className="max-h-96 overflow-y-auto">
            {logs.map((l) => (
              <div key={l.id} className="text-xs font-mono py-1.5 border-b border-panelLine last:border-0 text-slate-400">
                {new Date(l.created_at).toLocaleString()} — {l.user_email} — {l.action}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
