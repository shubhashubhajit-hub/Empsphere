import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import client from '../api/client.js'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [language, setLanguage] = useState('en')
  const [aiModel, setAiModel] = useState('auto')
  const [message, setMessage] = useState('')

  useEffect(() => {
    client.get('/settings/').then((res) => {
      setLanguage(res.data.language)
      setAiModel(res.data.ai_model_pref)
    })
  }, [])

  async function save(partial) {
    const res = await client.put('/settings/', partial)
    setMessage('Saved.')
    setTimeout(() => setMessage(''), 1500)
    return res.data
  }

  async function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    await save({ theme: next })
  }

  async function handleLanguageChange(e) {
    const val = e.target.value
    setLanguage(val)
    await save({ language: val })
  }

  async function handleModelChange(e) {
    const val = e.target.value
    setAiModel(val)
    await save({ ai_model_pref: val })
  }

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-5" style={{ fontFamily: 'Georgia, serif' }}>Settings</h1>
        {message && <div className="text-teal-400 text-xs mb-3">{message}</div>}

        <div className="bg-panel border border-panelLine rounded-xl p-5 max-w-md divide-y divide-panelLine">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium">Theme</div>
              <div className="text-xs text-slate-400">Switch between dark and light mode</div>
            </div>
            <button onClick={handleThemeToggle}
              className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-teal' : 'bg-panelLine'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-ink transition-all ${theme === 'dark' ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium">Language</div>
              <div className="text-xs text-slate-400">Interface language</div>
            </div>
            <select value={language} onChange={handleLanguageChange}
              className="bg-ink border border-panelLine rounded-lg px-3 py-1.5 text-xs">
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium">AI model</div>
              <div className="text-xs text-slate-400">Which model answers your questions</div>
            </div>
            <select value={aiModel} onChange={handleModelChange}
              className="bg-ink border border-panelLine rounded-lg px-3 py-1.5 text-xs">
              <option value="auto">Auto (best available)</option>
              <option value="openai">OpenAI GPT</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 mt-3 max-w-md">
          If no API key is configured on the server for the selected provider, chat falls back to showing the best-matching document excerpt instead of a generated answer.
        </div>
      </div>
    </div>
  )
}
