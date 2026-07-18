import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Users() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  function load() {
    client.get('/users/').then((res) => setUsers(res.data)).catch((err) => setError(err.response?.data?.detail || 'Failed to load users'))
  }

  useEffect(() => { load() }, [])

  async function changeRole(u, newRole) {
    if (newRole === u.role) return
    await client.put(`/users/${u.id}/role`, { role: newRole })
    load()
  }

  async function changeDepartment(u, newDept) {
    await client.put(`/users/${u.id}/department`, { department: newDept || null })
    load()
  }

  async function toggleBlock(u) {
    await client.put(`/users/${u.id}/block`)
    load()
  }

  async function removeUser(u) {
    if (!confirm(`Delete ${u.name}?`)) return
    try {
      await client.delete(`/users/${u.id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete this user')
    }
  }

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-5" style={{ fontFamily: 'Georgia, serif' }}>User Management</h1>
        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

        <div className="bg-panel border border-panelLine rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-panelLine">
                <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Department</th><th className="p-3">Role</th><th className="p-3">Status</th>{isAdmin && <th className="p-3"></th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-panelLine last:border-0">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3 text-slate-400">
                    {isAdmin ? (
                      <DepartmentEditor value={u.department} onSave={(val) => changeDepartment(u, val)} />
                    ) : (
                      u.department || '—'
                    )}
                  </td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">
                    <span className={u.is_blocked ? 'text-red-400' : 'text-teal-400'}>{u.is_blocked ? 'Blocked' : 'Active'}</span>
                  </td>
                  {isAdmin && (
                    <td className="p-3 space-x-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        className="bg-ink border border-panelLine rounded-lg px-2 py-1 text-xs outline-none focus:border-gold"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="employee">Employee</option>
                      </select>
                      <button onClick={() => toggleBlock(u)} className="text-xs text-slate-400 hover:text-white">
                        {u.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button onClick={() => removeUser(u)} className="text-xs text-slate-400 hover:text-red-400">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function DepartmentEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')

  if (!editing) {
    return (
      <button onClick={() => { setDraft(value || ''); setEditing(true) }} className="hover:text-gold hover:underline">
        {value || '— set —'}
      </button>
    )
  }

  function save() {
    setEditing(false)
    onSave(draft.trim())
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
      placeholder="e.g. HR, IT, Sales"
      className="bg-ink border border-panelLine rounded px-2 py-1 text-xs outline-none focus:border-gold w-32"
    />
  )
}