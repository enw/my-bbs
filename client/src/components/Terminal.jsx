import React, { useState, useEffect, useRef } from 'react'
import { ANSIParser } from '../lib/ansiParser'
import { initConnection, createBBSEngine, getBBSEngine } from '../lib/connectionManager'
import '../styles/Terminal.css'

const Terminal = () => {
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const terminalRef = useRef(null)
  const inputRef = useRef(null)
  const parser = useRef(new ANSIParser())
  const bbsEngineRef = useRef(null)

  // Initialize connection and BBS engine
  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        // Initialize connection (detects server or browser mode)
        const connection = await initConnection()
        
        if (!mounted) return

        // Create BBS engine with output callback
        const handleOutput = (data) => {
          if (!mounted) return
          const parsed = parser.current.parseANSI(data)
          setLines(parsed)
        }

        const handleLogoff = () => {
          if (!mounted) return
          setTimeout(() => {
            window.location.reload()
          }, 3000)
        }

        const engine = createBBSEngine(handleOutput, handleLogoff)
        bbsEngineRef.current = engine
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize BBS:', error)
        // Show error message
        const errorMsg = `\x1b[1;31mFailed to initialize BBS. Please refresh the page.\x1b[0m`
        const parsed = parser.current.parseANSI(errorMsg)
        setLines(parsed)
      }
    }

    initialize()

    // Cursor blink
    const interval = setInterval(() => {
      setCursorVisible(v => !v)
    }, 500)

    // Focus input immediately and keep it focused
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
    
    // Global keyboard handler - ensures input gets focus and receives keypresses
    const handleGlobalKeyDown = (e) => {
      // If input isn't focused, focus it
      if (document.activeElement !== inputRef.current && inputRef.current) {
        inputRef.current.focus()
      }
    }
    
    // Focus on mount
    focusInput()
    
    // Focus on any click or keypress
    window.addEventListener('click', focusInput)
    window.addEventListener('keydown', focusInput)
    document.addEventListener('keydown', handleGlobalKeyDown, true)

    return () => {
      mounted = false
      clearInterval(interval)
      window.removeEventListener('click', focusInput)
      window.removeEventListener('keydown', focusInput)
      document.removeEventListener('keydown', handleGlobalKeyDown, true)
    }
  }, [])

  // Keep input focused at all times
  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (!isInitialized || !bbsEngineRef.current) {
      return
    }

    const engine = bbsEngineRef.current
    
    // Handle single-key commands (N, L, etc.) immediately on splash screen
    if (engine.currentScreen === 'splash') {
      const key = e.key.toLowerCase()
      if (key === 'n' || key === 'l') {
        e.preventDefault()
        engine.processCommand(key)
        setInput('')
        return
      }
    }
    
    // Handle Enter key for text input
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmedInput = input.trim()
      
      // Allow empty input on confirmation screens
      if (trimmedInput || engine.currentScreen === 'newuser-confirm') {
        engine.processCommand(trimmedInput || '')
        setInput('')
      }
    }
  }

  return (
    <div className="terminal" ref={terminalRef} onClick={handleTerminalClick}>
      <div className="terminal-screen">
        {lines.map((line, lineIdx) => (
          <div key={lineIdx} className="terminal-line">
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
        {/* Display current input value on screen */}
        {input && (
          <div className="terminal-line">
            <span style={{ color: '#aaa' }}>{input}</span>
          </div>
        )}
        <span className={`cursor ${cursorVisible ? 'visible' : ''}`}>_</span>
      </div>
      <input
        ref={inputRef}
        type="text"
        className="terminal-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          // Keep input focused at all times
          setTimeout(() => e.target.focus(), 0)
        }}
        onFocus={(e) => {
          // Don't select all text on focus - let user see their typing
        }}
        maxLength={80}
        autoFocus
        tabIndex={0}
        disabled={!isInitialized}
      />
    </div>
  )
}

export default Terminal
