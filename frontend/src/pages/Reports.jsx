import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'

const COLORS = ['#D6A34C', '#59C9BA', '#8B7FD1', '#E08B79', '#6FA8DC', '#B08BC9']

export default function Reports() {
  const [mostViewed, setMostViewed] = useState([])
  const [byCategory, setByCategory] = useState([])
  const [byMonth, setByMonth] = useState([])
  const [byDepartment, setByDepartment] = useState([])
  const [queriesByDay, setQueriesByDay] = useState([])

  useEffect(() => {
    client.get('/reports/most-viewed-documents').then((res) => setMostViewed(res.data))
    client.get('/reports/documents-by-category').then((res) => setByCategory(res.data))
    client.get('/reports/uploads-by-month').then((res) => setByMonth(res.data))
    client.get('/reports/users-by-department').then((res) => setByDepartment(res.data))
    client.get('/reports/queries-by-day').then((res) => setQueriesByDay(res.data))
  }, [])

  const maxViews = Math.max(1, ...mostViewed.map((d) => d.views))

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-5" style={{ fontFamily: 'Georgia, serif' }}>Reports & Analytics</h1>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <ChartCard title="Documents uploaded per month">
            {byMonth.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2C3352" />
                  <XAxis dataKey="month" stroke="#7c8399" fontSize={11} />
                  <YAxis stroke="#7c8399" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1C2238', border: '1px solid #2C3352', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#D6A34C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Documents by category">
            {byCategory.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byCategory} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d) => d.name}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1C2238', border: '1px solid #2C3352', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="AI queries over time">
            {queriesByDay.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={queriesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2C3352" />
                  <XAxis dataKey="date" stroke="#7c8399" fontSize={11} />
                  <YAxis stroke="#7c8399" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1C2238', border: '1px solid #2C3352', fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#59C9BA" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Users by department">
            {byDepartment.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byDepartment} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d) => d.name}>
                    {byDepartment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1C2238', border: '1px solid #2C3352', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="bg-panel border border-panelLine rounded-xl p-5 max-w-2xl">
          <div className="font-semibold text-sm mb-4">Most viewed documents</div>
          {mostViewed.length === 0 && <div className="text-sm text-slate-500">No views recorded yet.</div>}
          {mostViewed.map((d) => (
            <div key={d.id} className="flex items-center gap-3 mb-3">
              <div className="w-36 text-xs text-slate-400 truncate">{d.title}</div>
              <div className="flex-1 bg-ink rounded h-2 overflow-hidden">
                <div className="bg-gold h-full rounded" style={{ width: `${(d.views / maxViews) * 100}%` }} />
              </div>
              <div className="w-8 text-right text-xs font-mono text-slate-500">{d.views}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-panel border border-panelLine rounded-xl p-5">
      <div className="font-semibold text-sm mb-3">{title}</div>
      {children}
    </div>
  )
}

function EmptyState() {
  return <div className="text-sm text-slate-500 h-[240px] flex items-center justify-center">Not enough data yet.</div>
}