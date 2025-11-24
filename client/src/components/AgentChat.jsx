import React, { useState, useEffect, useRef } from 'react'
import { ANSIParser } from '../lib/ansiParser'
import '../styles/Terminal.css'

const AgentChat = ({ onBack }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [terminalWidth, setTerminalWidth] = useState(80)
  const terminalRef = useRef(null)
  const inputRef = useRef(null)
  const parser = useRef(new ANSIParser())

  useEffect(() => {
    loadConversations()
    loadTerminalWidth()
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const loadTerminalWidth = async () => {
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const width = data.terminal_width?.width || 80
        setTerminalWidth(width)
      }
    } catch (error) {
      console.error('Error loading terminal width:', error)
    }
  }

  useEffect(() => {
    // Scroll to bottom to keep input visible
    if (terminalRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
      })
    }
    // Refocus input after messages update (including after response)
    if (inputRef.current && !isLoading) {
      inputRef.current.focus()
    }
  }, [messages, isLoading, input])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/agent/conversations', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message to display
    const userMsg = `\x1b[1;37mYou:\x1b[0m ${userMessage}`
    const parsedUser = parser.current.parseANSI(userMsg)
    setMessages(prev => [...prev, ...parsedUser])

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConversationId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to get response`)
      }

      const data = await response.json()
      
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId)
        loadConversations()
      }

      // Add assistant response
      const assistantMsg = `\x1b[1;36mDrIP:\x1b[0m ${data.response}`
      const parsedAssistant = parser.current.parseANSI(assistantMsg)
      setMessages(prev => [...prev, ...parsedAssistant])
    } catch (error) {
      const errorMsg = `\x1b[1;31mError:\x1b[0m ${error.message || 'Failed to connect to agent'}`
      const parsedError = parser.current.parseANSI(errorMsg)
      setMessages(prev => [...prev, ...parsedError])
    } finally {
      setIsLoading(false)
      // Refocus input after response
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    } else if (e.key === 'Escape') {
      onBack()
    }
  }

  const showChatInterface = () => {
    const header = `\x1b[1;36m
═══════════════════════════════════════════════════════════════════════════

                         PAGE THE SYSOP

═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;33mSend messages to DrIP's pager. He'll respond as soon as he can.\x1b[0m
\x1b[1;31mResponses may take longer during school hours.\x1b[0m

\x1b[1;37mType your message and press Enter. Press ESC to return to main menu.\x1b[0m

───────────────────────────────────────────────────────────────────────────

`
    const parsed = parser.current.parseANSI(header)
    setMessages(parsed)
  }

  useEffect(() => {
    showChatInterface()
  }, [])

  const handleTerminalClick = (e) => {
    // Only focus input if clicking on empty area (not on text)
    if (e.target === terminalRef.current || e.target.classList.contains('terminal')) {
      inputRef.current?.focus()
    }
  }

  return (
    <div className="terminal" ref={terminalRef} onClick={handleTerminalClick}>
      <div className="terminal-screen" style={{ width: `${terminalWidth}ch`, maxWidth: `${terminalWidth}ch` }}>
        {messages.map((line, lineIdx) => (
          <div key={lineIdx} className="terminal-line" style={{ maxWidth: `${terminalWidth}ch` }}>
            {line.map((char, charIdx) => (
              <span
                key={charIdx}
                className={char.blink ? 'blink' : ''}
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
        {isLoading && (
          <div className="terminal-line">
            <span style={{ color: '#00ffff' }}>Paging DrIP...</span>
          </div>
        )}
        <div className="terminal-line terminal-input-line">
          <span style={{ color: '#aaa' }}>{input}</span>
          <span className={`cursor ${!isLoading ? 'visible' : ''}`}>_</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="text"
        className="terminal-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => e.target.focus()}
        maxLength={500}
        autoFocus
        disabled={isLoading}
        placeholder=""
      />
    </div>
  )
}

export default AgentChat

