import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'

const ACTION_LABELS = {
  signup: 'Signed up',
  login: 'Logged in',
  password_reset: 'Reset password',
  document_uploaded: 'Uploaded a document',
  document_viewed: 'Viewed a document',
  document_deleted: 'Deleted a document',
  document_summarized: 'Summarized a document',
  quiz_generated: 'Generated a quiz',
  admin_added_user: 'Added a user (admin)',
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    client.get('/admin/logs', { params: { limit: 200 } })
      .then((res) => setLogs(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load activity log'))
  }, [])

  const filtered = filter
    ? logs.filter((l) => l.user_email.toLowerCase().includes(filter.toLowerCase()) || l.action.toLowerCase().includes(filter.toLowerCase()))
    : logs

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Activity Log</h1>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by user or action…"
            className="bg-panel border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold w-64"
          />
        </div>
        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        <div className="bg-panel border border-panelLine rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-panelLine">
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-panelLine last:border-0">
                  <td className="p-3 text-slate-400">{l.user_email}</td>
                  <td className="p-3">{ACTION_LABELS[l.action] || l.action}</td>
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="3" className="p-6 text-center text-slate-500">No activity recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}