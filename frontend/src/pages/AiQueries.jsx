import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'

export default function AiQueries() {
  const [queries, setQueries] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/reports/ai-queries')
      .then((res) => setQueries(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load AI queries'))
  }, [])

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-5" style={{ fontFamily: 'Georgia, serif' }}>AI Queries</h1>
        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        <div className="bg-panel border border-panelLine rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-panelLine">
                <th className="p-3">Question</th>
                <th className="p-3">Asked by</th>
                <th className="p-3">When</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q) => (
                <tr key={q.id} className="border-b border-panelLine last:border-0 align-top">
                  <td className="p-3 max-w-xl">{q.question}</td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">
                    <div>{q.asked_by}</div>
                    <div className="text-xs text-slate-500">{q.asked_by_email}</div>
                  </td>
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{new Date(q.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {queries.length === 0 && (
                <tr><td colSpan="3" className="p-6 text-center text-slate-500">No AI questions asked yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}