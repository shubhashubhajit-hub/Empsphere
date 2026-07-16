import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import NotificationBell from './NotificationBell.jsx'

const linkClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium mb-1 ${
    isActive ? 'bg-panel text-gold' : 'text-slate-400 hover:bg-panel hover:text-white'
  }`

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="w-56 shrink-0 bg-ink2 border-r border-panelLine flex flex-col p-4 h-screen">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-gold to-yellow-700 flex items-center justify-center font-bold text-ink">S</div>
          <div className="font-semibold text-lg">Stacks</div>
        </div>
        <NotificationBell />
      </div>

      <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
      <NavLink to="/documents" className={linkClass}>Documents</NavLink>
      <NavLink to="/chat" className={linkClass}>AI Chat</NavLink>

      {(user?.role === 'admin' || user?.role === 'manager') && (
  <>
    <div className="text-xs uppercase text-slate-500 mt-4 mb-1 px-1 tracking-wide">
      {user?.role === 'admin' ? 'Admin' : 'Management'}
    </div>
    <NavLink to="/users" className={linkClass}>User Management</NavLink>
    {user?.role === 'admin' && (
      <>
        <NavLink to="/ai-queries" className={linkClass}>AI Queries</NavLink>
        <NavLink to="/reports" className={linkClass}>Reports</NavLink>
        <NavLink to="/activity-log" className={linkClass}>Activity Log</NavLink>
        <NavLink to="/all-chats" className={linkClass}>All Chats</NavLink>
        <NavLink to="/admin" className={linkClass}>Admin Panel</NavLink>
      </>
    )}
  </>
)}

      <div className="text-xs uppercase text-slate-500 mt-4 mb-1 px-1 tracking-wide">Account</div>
      <NavLink to="/profile" className={linkClass}>Profile</NavLink>
      <NavLink to="/settings" className={linkClass}>Settings</NavLink>

      <div className="mt-auto pt-3 border-t border-panelLine flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-panelLine flex items-center justify-center text-xs font-semibold">
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="text-xs">
          <div className="font-semibold">{user?.name}</div>
          <div className="text-slate-500 capitalize">{user?.role}</div>
        </div>
        <button onClick={handleLogout} className="ml-auto text-xs text-slate-500 hover:text-white">
          Logout
        </button>
      </div>
    </div>
  )
}