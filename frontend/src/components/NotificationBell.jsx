import React, { useEffect, useRef, useState } from 'react'
import client from '../api/client.js'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  function load() {
    client.get('/notifications/').then((res) => setNotifications(res.data)).catch(() => {})
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function markRead(id) {
    await client.put(`/notifications/${id}/read`)
    load()
  }

  async function handleBellClick() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen && notifications.some((n) => !n.is_read)) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      try {
        await client.put('/notifications/mark-all-read')
      } catch {
        load()
      }
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleBellClick} className="relative text-slate-400 hover:text-white text-sm">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-400 rounded-full text-[9px] flex items-center justify-center text-ink font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-8 w-60 max-w-[85vw] bg-panel border border-panelLine rounded-xl p-2 shadow-xl z-50 max-h-72 overflow-y-auto overflow-x-hidden">
          {notifications.length === 0 && <div className="text-xs text-slate-500 p-3">No notifications yet.</div>}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className={`p-2.5 rounded-lg cursor-pointer hover:bg-ink ${!n.is_read ? '' : 'opacity-60'}`}
            >
              <div className="text-xs font-semibold">{n.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{n.message}</div>
              <div className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}