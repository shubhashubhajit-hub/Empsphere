import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activity, setActivity] = useState([])

  useEffect(() => {
    client.get('/users/me/activity').then((res) => setActivity(res.data))
  }, [])

  async function saveName(e) {
    e.preventDefault()
    setMessage(''); setError('')
    try {
     await client.put('/users/me', { name, department })
      const updated = { ...user, name, department } 
      localStorage.setItem('user', JSON.stringify(updated))
      setUser(updated)
      setMessage('Profile updated.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed')
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      await client.put('/users/me/password', { current_password: currentPassword, new_password: newPassword })
      setMessage('Password changed successfully.')
      setCurrentPassword(''); setNewPassword('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Password change failed')
    }
  }

  async function uploadAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      await client.put('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMessage('Profile picture updated.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    }
  }

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-6 space-y-5">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Georgia, serif' }}>Profile</h1>

        {message && <div className="text-teal-400 text-sm">{message}</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="bg-panel border border-panelLine rounded-xl p-5 max-w-md">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-panelLine flex items-center justify-center font-semibold">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <label className="text-xs border border-panelLine rounded-lg px-3 py-2 cursor-pointer hover:border-gold">
              Change photo
              <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </label>
          </div>

          <form onSubmit={saveName} className="mb-5">
            <label className="text-xs text-slate-400 mb-1 block">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-gold" />
              <label className="text-xs text-slate-400 mb-1 block">Department / Team</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. HR, IT, Sales"
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-gold" />
            <button className="text-xs bg-gold text-ink font-semibold rounded-lg px-4 py-2">Save Name</button>
          </form>

          <form onSubmit={changePassword}>
            <label className="text-xs text-slate-400 mb-1 block">Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-gold" />
            <label className="text-xs text-slate-400 mb-1 block">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-gold" />
            <button className="text-xs bg-gold text-ink font-semibold rounded-lg px-4 py-2">Change Password</button>
          </form>
        </div>

        <div className="bg-panel border border-panelLine rounded-xl p-5 max-w-md">
          <div className="font-semibold text-sm mb-3">Activity history</div>
          {activity.length === 0 && <div className="text-sm text-slate-500">No activity yet.</div>}
          {activity.map((a) => (
            <div key={a.id} className="flex justify-between text-xs py-2 border-b border-panelLine last:border-0">
              <span className="capitalize">{a.action.replaceAll('_', ' ')}</span>
              <span className="text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
