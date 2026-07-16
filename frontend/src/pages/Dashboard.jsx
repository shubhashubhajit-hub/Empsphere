import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const canViewUsers = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    client.get('/reports/dashboard-summary')
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Could not load dashboard'))
  }, [])

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Georgia, serif' }}>Dashboard</h1>

        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

        {summary && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard
                label="Total documents"
                value={summary.total_documents}
                onClick={() => navigate('/documents')}
                hint="View all documents"
              />
              <StatCard
                label="Total users"
                value={summary.total_users}
                onClick={() => canViewUsers && navigate('/users')}
                hint={canViewUsers ? 'View all users' : 'Admin/Manager only'}
                disabled={!canViewUsers}
              />
              <StatCard
                label="AI queries"
                value={summary.total_ai_queries}
                onClick={() => isAdmin && navigate('/ai-queries')}
                hint={isAdmin ? 'View all AI queries' : 'Admin only'}
                disabled={!isAdmin}
              />
            </div>

            <div className="bg-panel border border-panelLine rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-sm">Recent uploads</div>
                <button onClick={() => navigate('/documents')} className="text-xs text-gold hover:underline">
                  View all documents
                </button>
              </div>
              {summary.recent_uploads.length === 0 && (
                <div className="text-sm text-slate-500">No documents uploaded yet — head to the Documents tab.</div>
              )}
              {summary.recent_uploads.map((d) => (
                <div key={d.id} className="flex justify-between items-center text-sm py-2 border-b border-panelLine last:border-0">
                  <span>{d.title}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs">{new Date(d.created_at).toLocaleString()}</span>
                    <button onClick={() => navigate('/documents')} className="text-xs text-gold hover:underline">
                      View
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, onClick, hint, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={`text-left bg-panel border border-panelLine rounded-xl p-4 transition ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-gold cursor-pointer'
      }`}
    >
      <div className="text-2xl font-mono font-semibold">{value ?? '—'}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
      {hint && <div className="text-[11px] text-gold/70 mt-1">{hint}</div>}
    </button>
  )
}