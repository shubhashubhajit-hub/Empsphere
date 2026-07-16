import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('employee')
  const [department, setDepartment] = useState('')
  const [secretCode, setSecretCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(name, email, password, role, secretCode,department)
      navigate('/verify-otp', { state: { email } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="w-full max-w-sm bg-panel border border-panelLine rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-gold to-yellow-700 flex items-center justify-center font-bold text-ink">S</div>
          <div>
            <div className="font-semibold text-lg">Stacks</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Create account</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-xs text-slate-400 mb-1 block">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" placeholder="Your name" />
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-400 mb-1 block">Work email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" placeholder="you@company.com" />
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" placeholder="At least 6 characters" />
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-400 mb-1 block">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold">
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-400 mb-1 block">Department / Team</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" placeholder="e.g. HR, IT, Sales" />
          </div>
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-1 block">Secret code</label>
            <input required value={secretCode} onChange={(e) => setSecretCode(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" placeholder="Provided by your organization" />
          </div>

          {error && <div className="text-red-400 text-xs mb-3">{error}</div>}

          <button disabled={loading} className="w-full bg-gold text-ink font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 mt-4">
          Already have an account? <Link to="/login" className="text-teal-400">Log in</Link>
        </div>
      </div>
    </div>
  )
}