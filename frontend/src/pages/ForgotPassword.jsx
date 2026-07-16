import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('request') // 'request' | 'reset'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRequest(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      setMessage(res.message)
      setStep('reset')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email, otp, newPassword)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="w-full max-w-sm bg-panel border border-panelLine rounded-2xl p-8">
        <div className="font-semibold text-lg mb-1">Reset your password</div>
        {message && <div className="text-xs text-teal-400 mb-4">{message}</div>}

        {step === 'request' ? (
          <form onSubmit={handleRequest}>
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1 block">Registered email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" placeholder="you@company.com" />
            </div>
            {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
            <button disabled={loading} className="w-full bg-gold text-ink font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50">
              {loading ? 'Sending…' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="mb-3">
              <label className="text-xs text-slate-400 mb-1 block">6-digit code</label>
              <input required value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
                className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold tracking-widest text-center font-mono" placeholder="••••••" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1 block">New password</label>
              <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
            </div>
            {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
            <button disabled={loading} className="w-full bg-gold text-ink font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 mt-4">
          <Link to="/login" className="text-teal-400">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
