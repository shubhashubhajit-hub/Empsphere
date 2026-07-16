import React, { createContext, useContext, useState } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  function persistSession(data) {
    const { access_token, role, name, email } = data
    localStorage.setItem('token', access_token)
    const u = { role, name, email }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  }

  async function login(email, password) {
    const res = await client.post('/auth/login', { email, password })
    return persistSession(res.data)
  }

  // Signup no longer logs the user in directly — it sends an OTP.
  // Returns the server message; caller should route to the verify-OTP screen.
 async function signup(name, email, password, role, secretCode, department) {
    const res = await client.post('/auth/signup', { name, email, password, role, secret_code: secretCode, department })
    return res.data
  }

  async function verifyOtp(email, otp) {
    const res = await client.post('/auth/verify-otp', { email, otp })
    return persistSession(res.data)
  }

  async function resendOtp(email) {
    const res = await client.post('/auth/resend-otp', { email })
    return res.data
  }

  async function forgotPassword(email) {
    const res = await client.post('/auth/forgot-password', { email })
    return res.data
  }

  async function resetPassword(email, otp, newPassword) {
    const res = await client.post('/auth/reset-password', { email, otp, new_password: newPassword })
    return res.data
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, verifyOtp, resendOtp, forgotPassword, resetPassword, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
