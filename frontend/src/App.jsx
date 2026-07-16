import React from 'react'
import AllChats from './pages/AllChats.jsx'
import ActivityLog from './pages/ActivityLog.jsx'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import VerifyOtp from './pages/VerifyOtp.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Documents from './pages/Documents.jsx'
import Chat from './pages/Chat.jsx'
import Users from './pages/Users.jsx'
import Reports from './pages/Reports.jsx'
import AiQueries from './pages/AiQueries.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/all-chats" element={<ProtectedRoute adminOnly><AllChats /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['admin', 'manager']}><Users /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
      <Route path="/activity-log" element={<ProtectedRoute adminOnly><ActivityLog /></ProtectedRoute>} />
      <Route path="/ai-queries" element={<ProtectedRoute adminOnly><AiQueries /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
    </Routes>
  )
}