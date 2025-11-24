import React, { useState, useEffect, useRef } from 'react'
import { ANSIParser } from '../lib/ansiParser'
import '../styles/Terminal.css'

const Settings = ({ onBack }) => {
  const [settings, setSettings] = useState({
    llmProvider: 'openai',
    openaiApiKey: '',
    ollamaUrl: 'http://localhost:11434',
    mcpUrl: 'http://localhost:3001',
    llmModel: 'gpt-4'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageLines, setMessageLines] = useState([])
  const [ollamaModels, setOllamaModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const parser = useRef(new ANSIParser())
  const [lines, setLines] = useState([])

  useEffect(() => {
    loadSettings()
    showSettingsMenu()
  }, [])

  useEffect(() => {
    // Fetch Ollama models when Ollama is selected
    if (settings.llmProvider === 'ollama') {
      fetchOllamaModels()
    } else {
      setOllamaModels([])
    }
  }, [settings.llmProvider, settings.ollamaUrl])

  const showSettingsMenu = () => {
    const menu = `\x1b[1;36m
═══════════════════════════════════════════════════════════════════════════

                            CONFIGURATION

═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;37mConfigure your agent chat settings:\x1b[0m

`
    const parsed = parser.current.parseANSI(menu)
    setLines(parsed)
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({
          ...prev,
          ...data,
          openaiApiKey: data.openai_api_key?.apiKey ? '••••••••' : '',
          ollamaUrl: data.ollama_config?.url || prev.ollamaUrl,
          mcpUrl: data.mcp_url?.url || prev.mcpUrl,
          llmProvider: data.llm_provider?.provider || prev.llmProvider,
          llmModel: data.llm_provider?.model || prev.llmModel
        }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    setMessage('')
    setMessageLines([])
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const msg = '\x1b[1;32mSettings saved successfully!\x1b[0m'
        setMessage(msg)
        const parsed = parser.current.parseANSI(msg)
        setMessageLines(parsed)
      } else {
        const msg = '\x1b[1;31mFailed to save settings\x1b[0m'
        setMessage(msg)
        const parsed = parser.current.parseANSI(msg)
        setMessageLines(parsed)
      }
    } catch (error) {
      const msg = `\x1b[1;31mError: ${error.message}\x1b[0m`
      setMessage(msg)
      const parsed = parser.current.parseANSI(msg)
      setMessageLines(parsed)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setMessage('')
    setMessageLines([])
    try {
      const response = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: settings.llmProvider,
          config: {
            openaiApiKey: settings.openaiApiKey,
            ollamaUrl: settings.ollamaUrl
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        const msg = `\x1b[1;32m${data.message}\x1b[0m`
        setMessage(msg)
        const parsed = parser.current.parseANSI(msg)
        setMessageLines(parsed)
      } else {
        const msg = `\x1b[1;31m${data.message}\x1b[0m`
        setMessage(msg)
        const parsed = parser.current.parseANSI(msg)
        setMessageLines(parsed)
      }
    } catch (error) {
      const msg = `\x1b[1;31mError: ${error.message}\x1b[0m`
      setMessage(msg)
      const parsed = parser.current.parseANSI(msg)
      setMessageLines(parsed)
    } finally {
      setLoading(false)
    }
  }

  const fetchOllamaModels = async () => {
    setLoadingModels(true)
    try {
      const response = await fetch(`/api/settings/ollama-models?ollamaUrl=${encodeURIComponent(settings.ollamaUrl)}`, {
        credentials: 'include'
      })
      
      const data = await response.json()
      if (data.success && data.models) {
        setOllamaModels(data.models)
        // If current model is not in the list, set to first model or empty
        if (data.models.length > 0 && !data.models.includes(settings.llmModel)) {
          setSettings(prev => ({ ...prev, llmModel: data.models[0] }))
        }
      } else {
        setOllamaModels([])
      }
    } catch (error) {
      console.error('Error fetching Ollama models:', error)
      setOllamaModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  const connectGoogle = () => {
    window.location.href = '/api/settings/auth/google'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onBack()
    }
  }

  return (
    <div className="settings" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="terminal-screen">
        {lines.map((line, lineIdx) => (
          <div key={lineIdx} className="terminal-line">
            {line.map((char, charIdx) => (
              <span
                key={charIdx}
                style={{
                  color: char.fg,
                  backgroundColor: char.bg,
                  fontWeight: char.bold ? 'bold' : 'normal'
                }}
              >
                {char.char}
              </span>
            ))}
          </div>
        ))}
        <div className="settings-form">
          <div className="setting-item">
            <label className="setting-label">LLM Provider:</label>
            <select
              value={settings.llmProvider}
              onChange={(e) => setSettings({ ...settings, llmProvider: e.target.value })}
            >
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          {settings.llmProvider === 'openai' && (
            <div className="setting-item">
              <label className="setting-label">OpenAI API Key:</label>
              <input
                type="password"
                value={settings.openaiApiKey}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>
          )}

          {settings.llmProvider === 'ollama' && (
            <div className="setting-item">
              <label className="setting-label">Ollama URL:</label>
              <input
                type="text"
                value={settings.ollamaUrl}
                onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
              />
            </div>
          )}

          <div className="setting-item">
            <label className="setting-label">MCP Server URL:</label>
            <input
              type="text"
              value={settings.mcpUrl}
              onChange={(e) => setSettings({ ...settings, mcpUrl: e.target.value })}
            />
          </div>

          <div className="setting-item">
            <label className="setting-label">Model:</label>
            {settings.llmProvider === 'ollama' ? (
              <select
                value={settings.llmModel}
                onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
                disabled={loadingModels || ollamaModels.length === 0}
              >
                {loadingModels ? (
                  <option value="">Loading models...</option>
                ) : ollamaModels.length === 0 ? (
                  <option value="">No models available</option>
                ) : (
                  ollamaModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))
                )}
              </select>
            ) : (
              <input
                type="text"
                value={settings.llmModel}
                onChange={(e) => setSettings({ ...settings, llmModel: e.target.value })}
              />
            )}
          </div>

          <div className="setting-actions">
            <button onClick={saveSettings} disabled={loading}>
              Save Settings
            </button>
            <button onClick={testConnection} disabled={loading}>
              Test Connection
            </button>
            <button onClick={connectGoogle}>
              Connect Google (OAuth)
            </button>
            <button onClick={onBack}>
              Back to Main Menu
            </button>
          </div>

          {messageLines.length > 0 && (
            <div className="settings-message">
              {messageLines.map((line, lineIdx) => (
                <div key={lineIdx} className="terminal-line">
                  {line.map((char, charIdx) => (
                    <span
                      key={charIdx}
                      style={{
                        color: char.fg,
                        backgroundColor: char.bg,
                        fontWeight: char.bold ? 'bold' : 'normal'
                      }}
                    >
                      {char.char}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings

