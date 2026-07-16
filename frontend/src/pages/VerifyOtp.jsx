import React, { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function VerifyOtp() {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyOtp, resendOtp } = useAuth()
  const [email, setEmail] = useState(location.state?.email || '')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('A 6-digit code was sent to your email. In local dev without SMTP configured, check the backend console/logs for the code.')
  const [loading, setLoading] = useState(false)

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyOtp(email, otp)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    try {
      const res = await resendOtp(email)
      setInfo(res.message)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not resend code')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="w-full max-w-sm bg-panel border border-panelLine rounded-2xl p-8">
        <div className="font-semibold text-lg mb-1">Verify your email</div>
        <div className="text-xs text-slate-400 mb-4">{info}</div>

        <form onSubmit={handleVerify}>
          <div className="mb-3">
            <label className="text-xs text-slate-400 mb-1 block">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold" />
          </div>
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-1 block">6-digit code</label>
            <input required value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
              className="w-full bg-ink border border-panelLine rounded-lg px-3 py-2 text-sm outline-none focus:border-gold tracking-widest text-center font-mono" placeholder="••••••" />
          </div>

          {error && <div className="text-red-400 text-xs mb-3">{error}</div>}

          <button disabled={loading} className="w-full bg-gold text-ink font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50">
            {loading ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 mt-4">
          <button onClick={handleResend} className="text-teal-400">Resend code</button>
          {' · '}
          <Link to="/login" className="text-teal-400">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
