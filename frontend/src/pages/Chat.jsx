import React, { useState, useRef, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [sessions, setSessions] = useState([])
  const logRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [messages, loading])

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => (prev ? prev + ' ' : '') + transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
  }, [])

  function loadSessions() {
    client.get('/chat/sessions').then((res) => setSessions(res.data)).catch(() => {})
  }

  function newChat() {
    setSessionId(null)
    setMessages([])
  }

  async function selectSession(id) {
    if (id === sessionId) return
    try {
      const res = await client.get(`/chat/sessions/${id}/messages`)
      const mapped = res.data.map((msg) => ({
        sender: msg.sender,
        message: msg.message,
        sources: msg.referenced_documents || [],
      }))
      setMessages(mapped)
      setSessionId(id)
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not load this chat')
    }
  }

  async function deleteSession(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this chat?')) return
    await client.delete(`/chat/sessions/${id}`)
    if (id === sessionId) newChat()
    loadSessions()
  }

  function toggleVoice() {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  async function send(question) {
    const q = (question ?? input).trim()
    if (!q) return
    setMessages((m) => [...m, { sender: 'user', message: q }])
    setInput('')
    setLoading(true)
    try {
      const res = await client.post('/chat/ask', { question: q, session_id: sessionId })
      const isNewSession = !sessionId
      setSessionId(res.data.session_id)
      setMessages((m) => [...m, { sender: 'ai', message: res.data.answer, sources: res.data.sources, msgId: null }])
      if (isNewSession) loadSessions()
    } catch (err) {
      setMessages((m) => [...m, { sender: 'ai', message: err.response?.data?.detail || 'Something went wrong.', sources: [] }])
    } finally {
      setLoading(false)
    }
  }

  async function sendFeedback(index, rating) {
    setMessages((m) => m.map((msg, i) => (i === index ? { ...msg, feedbackGiven: rating } : msg)))
    try {
      await client.post('/feedback/', { rating })
    } catch {
      // non-critical — feedback failures shouldn't interrupt the chat
    }
  }

  async function downloadDoc(docId, title) {
    try {
      const res = await client.get(`/documents/${docId}/file`, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = title
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not download this file')
    }
  }

  return (
    <div className="flex">
      <Navbar />

      <div className="w-56 shrink-0 bg-ink2 border-r border-panelLine flex flex-col h-screen p-3">
        <button
          onClick={newChat}
          className="w-full bg-gold text-ink text-sm font-semibold px-3 py-2 rounded-lg mb-3 shrink-0"
        >
          + New Chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.length === 0 && (
            <div className="text-xs text-slate-500 px-1">No past chats yet.</div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => selectSession(s.id)}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs ${
                s.id === sessionId ? 'bg-panel text-gold' : 'text-slate-400 hover:bg-panel hover:text-white'
              }`}
            >
              <span className="flex-1 truncate">{s.title || 'Untitled chat'}</span>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 shrink-0"
                title="Delete chat"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col h-screen">
        <h1 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'Georgia, serif' }}>AI Chat</h1>

        <div ref={logRef} className="flex-1 overflow-y-auto space-y-4 max-w-3xl">
          {messages.length === 0 && (
            <div className="text-sm text-slate-500">
              Ask a question about any uploaded document — type, or use the mic. Answers use your indexed files, so upload something in Documents first for best results.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : ''}`}>
              {m.sender === 'user' ? (
                <div className="bg-panel border border-panelLine rounded-2xl rounded-br-sm px-4 py-2 text-sm max-w-[75%]">{m.message}</div>
              ) : (
                <div className="max-w-[90%]">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</div>
                  {m.sources?.length > 0 && (
                    <div className="mt-3 bg-paper text-[#2B2618] rounded p-3 max-w-md">
                      <div className="text-[10px] font-mono text-[#7A6F52] mb-2 pb-2 border-b border-dashed border-[#D9CFB6]">Sourced from indexed documents</div>
                      {m.sources.map((s, j) => (
                        <div key={j} className="flex items-start gap-2 py-1.5 text-xs border-b border-black/5 last:border-0">
                          <div className="font-semibold flex-1">{s.title}</div>
                          <button
                            onClick={() => downloadDoc(s.document_id, s.title)}
                            className="text-[#5C7A5A] hover:underline font-mono shrink-0"
                          >
                            ⬇ Download
                          </button>
                          <div className="font-mono text-[#7A6F52] shrink-0">{s.confidence}%</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => sendFeedback(i, 1)}
                      className={`text-xs ${m.feedbackGiven === 1 ? 'text-teal-400' : 'text-slate-500 hover:text-white'}`}
                    >👍</button>
                    <button
                      onClick={() => sendFeedback(i, -1)}
                      className={`text-xs ${m.feedbackGiven === -1 ? 'text-red-400' : 'text-slate-500 hover:text-white'}`}
                    >👎</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && <div className="text-xs text-slate-500 font-mono">Searching indexed documents…</div>}
        </div>

        <div className="mt-4 max-w-3xl flex gap-2 bg-panel border border-panelLine rounded-xl p-2">
          <button
            onClick={toggleVoice}
            title="Voice input"
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${listening ? 'bg-red-400 text-ink' : 'border border-panelLine text-slate-400'}`}
          >
            {listening ? '●' : '🎤'}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder="Ask about policy, code, customers…"
            className="flex-1 bg-transparent outline-none text-sm px-2 py-2 resize-none"
          />
          <button onClick={() => send()} className="bg-gold text-ink w-9 h-9 rounded-lg flex items-center justify-center shrink-0">➤</button>
        </div>
      </div>
    </div>
  )
}