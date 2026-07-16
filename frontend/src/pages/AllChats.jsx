import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'

export default function AllChats() {
  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/chat/admin/sessions')
      .then((res) => setSessions(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load chat history'))
  }, [])

  async function openSession(s) {
    setActiveId(s.id)
    try {
      const res = await client.get(`/chat/admin/sessions/${s.id}/messages`)
      setMessages(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load this conversation')
    }
  }

  const filtered = filter
    ? sessions.filter(
        (s) =>
          s.user_email.toLowerCase().includes(filter.toLowerCase()) ||
          (s.title || '').toLowerCase().includes(filter.toLowerCase())
      )
    : sessions

  return (
    <div className="flex">
      <Navbar />

      <div className="w-72 shrink-0 bg-ink2 border-r border-panelLine flex flex-col h-screen p-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by user or title…"
          className="bg-panel border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold mb-3 shrink-0"
        />
        <div className="flex-1 overflow-y-auto space-y-1">
          {filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => openSession(s)}
              className={`px-2.5 py-2 rounded-lg cursor-pointer text-xs ${
                s.id === activeId ? 'bg-panel text-gold' : 'text-slate-400 hover:bg-panel hover:text-white'
              }`}
            >
              <div className="truncate font-medium">{s.title || 'Untitled chat'}</div>
              <div className="text-[10px] text-slate-500 truncate">{s.user_name} · {s.user_email}</div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-xs text-slate-500 px-1">No chats found.</div>}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col h-screen">
        <h1 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'Georgia, serif' }}>All Chats</h1>
        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        {!activeId && <div className="text-sm text-slate-500">Select a conversation on the left to view it.</div>}

        <div className="flex-1 overflow-y-auto space-y-4 max-w-3xl">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : ''}`}>
              {m.sender === 'user' ? (
                <div className="bg-panel border border-panelLine rounded-2xl rounded-br-sm px-4 py-2 text-sm max-w-[75%]">{m.message}</div>
              ) : (
                <div className="max-w-[90%] text-sm leading-relaxed whitespace-pre-wrap">{m.message}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}