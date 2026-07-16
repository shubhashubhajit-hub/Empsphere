import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed'
      if (detail.toLowerCase().includes('verify')) {
        navigate('/verify-otp', { state: { email } })
        return
      }
      setError(detail)
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
            <div className="text-xs text-slate-500 uppercase tracking-wide">Knowledge Assistant</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
              placeholder="you@company.com"
            />
          </div>
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-red-400 text-xs mb-3">{error}</div>}

          <button disabled={loading} className="w-full bg-gold text-ink font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50">
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 mt-4">
          Don't have an account? <Link to="/signup" className="text-teal-400">Sign up</Link>
          <br />
          <Link to="/forgot-password" className="text-teal-400">Forgot password?</Link>
        </div>
      </div>
    </div>
  )
}
