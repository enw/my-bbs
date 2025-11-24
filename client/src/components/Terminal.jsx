import React, { useState, useEffect, useRef } from 'react'
import { ANSIParser } from '../lib/ansiParser'
import AgentChat from './AgentChat'
import Settings from './Settings'
import '../styles/Terminal.css'

const Terminal = () => {
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [currentScreen, setCurrentScreen] = useState('splash')
  const [showAgentChat, setShowAgentChat] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentHandle, setCurrentHandle] = useState(null)
  const [terminalWidth, setTerminalWidth] = useState(80)
  const terminalRef = useRef(null)
  const inputRef = useRef(null)
  const parser = useRef(new ANSIParser())

  useEffect(() => {
    // Load terminal width setting
    loadTerminalWidth()

    // Show splash screen
    showSplashScreen()

    // Cursor blink
    const interval = setInterval(() => {
      setCursorVisible(v => !v)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Scroll to bottom to keep input visible
    if (terminalRef.current) {
      // Use requestAnimationFrame with a small delay to ensure DOM is fully updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
          }
        }, 50)
      })
    }
  }, [lines, input, currentScreen])

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
    // Auto-focus input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Keep input focused at all times
  const handleTerminalClick = (e) => {
    // Only focus input if clicking on empty area (not on text)
    // Allow text selection to work normally
    if (e.target === terminalRef.current || e.target.classList.contains('terminal')) {
      inputRef.current?.focus()
    }
  }

  const showSplashScreen = () => {
    const splash = `\x1b[1;36m
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║  \x1b[1;33m██████╗ ███████╗████████╗██████╗  ██████╗     ██████╗ ██████╗ ███████╗\x1b[1;36m  ║
║  \x1b[1;33m██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗    ██╔══██╗██╔══██╗██╔════╝\x1b[1;36m  ║
║  \x1b[1;33m██████╔╝█████╗     ██║   ██████╔╝██║   ██║    ██████╔╝██████╔╝███████╗\x1b[1;36m  ║
║  \x1b[1;33m██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║    ██╔══██╗██╔══██╗╚════██║\x1b[1;36m  ║
║  \x1b[1;33m██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝    ██████╔╝██████╔╝███████║\x1b[1;36m  ║
║  \x1b[1;33m╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝     ╚═════╝ ╚═════╝ ╚══════╝\x1b[1;36m  ║
║                                                                           ║
║                       \x1b[1;37mWelcome to DRiPz \/RLD!\x1b[1;36m                            ║
║                                                                           ║
║                    \x1b[0;36mA Nostalgic Trip Back to 1993\x1b[1;36m                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

\x1b[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              BOARD RULES - READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\x1b[1;31m1. NO HACKING\x1b[0;37m - Discussion of illegal computer intrusion is strictly prohibited.

\x1b[1;31m2. NO WAREZ\x1b[0;37m - No pirated software, cracks, or serial numbers allowed.

\x1b[1;31m3. NO NUKING OTHER USERS\x1b[0;37m - Harassment and attacks on other users will result
   in immediate ban.

\x1b[0;37m4. Be respectful in message boards and private mail.

5. Upload legitimate shareware and freeware only.

6. Maintain your upload/download ratio.

\x1b[1;33mViolation of these rules will result in account suspension or termination
at SysOp discretion.\x1b[0m

\x1b[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m

\x1b[1;37mPress \x1b[1;36m[L]\x1b[1;37m to Login:\x1b[0m `

    const parsed = parser.current.parseANSI(splash)
    setLines(parsed)
    setCurrentScreen('splash')
  }

  const showMainMenu = (handle) => {
    setCurrentHandle(handle)
    const menu = `\x1b[0;37m
\x1b[1;36m═══════════════════════════════════════════════════════════════════════════

\x1b[1;33m                            MAIN MENU\x1b[1;36m

═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;37mWelcome back, \x1b[1;32m${handle}\x1b[1;37m!\x1b[0m

\x1b[1;36m[\x1b[1;37mB\x1b[1;36m]\x1b[0;37m oards
\x1b[1;36m[\x1b[1;37mF\x1b[1;36m]\x1b[0;37m ile Areas
\x1b[1;36m[\x1b[1;37mM\x1b[1;36m]\x1b[0;37m ail
\x1b[1;36m[\x1b[1;37mU\x1b[1;36m]\x1b[0;37m ser List
\x1b[1;36m[\x1b[1;37mY\x1b[1;36m]\x1b[0;37m our Statistics
\x1b[1;36m[\x1b[1;37mP\x1b[1;36m]\x1b[0;37m age the SysOp
\x1b[1;36m[\x1b[1;37mC\x1b[1;36m]\x1b[0;37m onfig
\x1b[1;36m[\x1b[1;37mL\x1b[1;36m]\x1b[0;37m ogoff

\x1b[1;33mTime Left: 60 minutes\x1b[0m

\x1b[1;37mCommand:\x1b[0m `

    const parsed = parser.current.parseANSI(menu)
    setLines(parsed)
    setCurrentScreen('main')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommand(input.toLowerCase())
      setInput('')
    }
  }

  const handleCommand = (cmd) => {
    if (currentScreen === 'splash') {
      // New user registration temporarily disabled
      // if (cmd === 'n') {
      //   showNewUserForm()
      // } else 
      if (cmd === 'l') {
        showLoginForm()
      }
    } else if (currentScreen === 'main') {
      switch(cmd) {
        case 'b':
          showMessageBoards()
          break
        case 'f':
          showFileAreas()
          break
        case 'm':
          showPrivateMail()
          break
        case 'u':
          showUserList()
          break
        case 'y':
          showStats()
          break
        case 'p':
          setShowAgentChat(true)
          break
        case 'c':
          setShowSettings(true)
          break
        case 'l':
          logoff()
          break
        default:
          addLine('\x1b[1;31mInvalid command. Please try again.\x1b[0m')
      }
    }
  }

  const showNewUserForm = () => {
    const form = `\x1b[0;37m
\x1b[1;36m═══════════════════════════════════════════════════════════════════════════
                            NEW USER APPLICATION
═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;37mPlease enter the following information:\x1b[0m

\x1b[1;33m(Note: This is a retro BBS. We ask for nostalgic info like real BBSs did!)\x1b[0m

\x1b[1;37mHandle (username):\x1b[0m `
    const parsed = parser.current.parseANSI(form)
    setLines(parsed)
    setCurrentScreen('newuser')
  }

  const showLoginForm = () => {
    // For demo, go straight to main menu
    showMainMenu('SysOp')
  }

  const showMessageBoards = () => {
    const boards = `\x1b[0;37m
\x1b[1;36m═══════════════════════════════════════════════════════════════════════════
                            MESSAGE BOARDS
═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;33m #  Board Name                    Messages    Last Post\x1b[0m
\x1b[1;36m───────────────────────────────────────────────────────────────────────────\x1b[0m
 \x1b[1;37m1\x1b[0;37m  General Discussion                42      Today 14:23
 \x1b[1;37m2\x1b[0;37m  Computer Talk                      38      Today 12:15
 \x1b[1;37m3\x1b[0;37m  Programming                        15      Yesterday
 \x1b[1;37m4\x1b[0;37m  Hardware/Software Help             22      Today 09:45
 \x1b[1;37m5\x1b[0;37m  Music & Entertainment              31      Today 16:30
 \x1b[1;37m6\x1b[0;37m  Jokes & Humor                      89      Today 18:12
 \x1b[1;37m7\x1b[0;37m  For Sale/Trade                      7      2 days ago
 \x1b[1;37m8\x1b[0;37m  SysOp Announcements                 3      Last week

\x1b[1;36m[\x1b[1;37m1-8\x1b[1;36m]\x1b[0;37m Select board  \x1b[1;36m[\x1b[1;37mQ\x1b[1;36m]\x1b[0;37m uit to main menu

\x1b[1;37mCommand:\x1b[0m `
    const parsed = parser.current.parseANSI(boards)
    setLines(parsed)
  }

  const showFileAreas = () => {
    const files = `\x1b[0;37m
\x1b[1;36m═══════════════════════════════════════════════════════════════════════════
                            FILE AREAS
═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;33m #  Category                       Files    Total Size\x1b[0m
\x1b[1;36m───────────────────────────────────────────────────────────────────────────\x1b[0m
 \x1b[1;37m1\x1b[0;37m  Shareware & Demos                 127      15.2 MB
 \x1b[1;37m2\x1b[0;37m  ANSI Art & Graphics                89       2.4 MB
 \x1b[1;37m3\x1b[0;37m  Music & Sound (MODs)              234      42.8 MB
 \x1b[1;37m4\x1b[0;37m  Utilities                          156       8.9 MB
 \x1b[1;37m5\x1b[0;37m  Drivers                            78       4.2 MB
 \x1b[1;37m6\x1b[0;37m  Text Files & Info                 312       1.8 MB
 \x1b[1;37m7\x1b[0;37m  Jokes & Entertainment             423       3.1 MB

\x1b[1;33mYour Ratio: 1:5 (Upload 1MB to download 5MB)\x1b[0m
\x1b[1;32mDownload Credit: 12.5 MB remaining\x1b[0m

\x1b[1;36m[\x1b[1;37m1-7\x1b[1;36m]\x1b[0;37m Select category  \x1b[1;36m[\x1b[1;37mQ\x1b[1;36m]\x1b[0;37m uit to main menu

\x1b[1;37mCommand:\x1b[0m `
    const parsed = parser.current.parseANSI(files)
    setLines(parsed)
  }

  const showPrivateMail = () => {
    const mail = `\x1b[0;37m
\x1b[1;36m═══════════════════════════════════════════════════════════════════════════
                            PRIVATE MAIL
═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;32mYou have 2 new messages!\x1b[0m

\x1b[1;33m #  From            Subject                      Date\x1b[0m
\x1b[1;36m───────────────────────────────────────────────────────────────────────────\x1b[0m
 \x1b[1;37m1\x1b[0;37m  \x1b[1;32m*\x1b[0;37m SysOp         Welcome to the BBS!          Today
 \x1b[1;37m2\x1b[0;37m  \x1b[1;32m*\x1b[0;37m BlackKnight   Check out my new MODs        Yesterday

\x1b[1;36m[\x1b[1;37mR\x1b[1;36m]\x1b[0;37m ead  \x1b[1;36m[\x1b[1;37mS\x1b[1;36m]\x1b[0;37m end new message  \x1b[1;36m[\x1b[1;37mQ\x1b[1;36m]\x1b[0;37m uit to main menu

\x1b[1;37mCommand:\x1b[0m `
    const parsed = parser.current.parseANSI(mail)
    setLines(parsed)
  }

  const showUserList = () => {
    const users = `\x1b[0;37m
\x1b[1;36m═══════════════════════════════════════════════════════════════════════════
                            USER LIST
═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;33mHandle          Location           Last Call        Total Calls\x1b[0m
\x1b[1;36m───────────────────────────────────────────────────────────────────────────\x1b[0m
\x1b[1;37mSysOp           NYC, NY            Today 19:45             1547\x1b[0m
\x1b[0;37mBlackKnight     LA, CA             Today 18:32              892
Shadowhawk      Chicago, IL        Today 15:20              654
PhantomLord     Seattle, WA        Yesterday                234
CyberNinja      Miami, FL          2 days ago               178

\x1b[1;37mPress any key to return to main menu...\x1b[0m`
    const parsed = parser.current.parseANSI(users)
    setLines(parsed)
  }

  const showStats = () => {
    const stats = `\x1b[0;37m
\x1b[1;36m═══════════════════════════════════════════════════════════════════════════
                            YOUR STATISTICS
═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;33mHandle:\x1b[1;37m              SysOp\x1b[0m
\x1b[1;33mReal Name:\x1b[0;37m           The System Operator
\x1b[1;33mLocation:\x1b[0;37m            New York, NY
\x1b[1;33mFirst Call:\x1b[0;37m          1993-01-15
\x1b[1;33mLast Call:\x1b[0;37m           Today 19:45
\x1b[1;33mTotal Calls:\x1b[1;37m         1547\x1b[0m
\x1b[1;33mMessages Posted:\x1b[1;37m    234\x1b[0m
\x1b[1;33mFiles Uploaded:\x1b[1;37m     89 \x1b[0;37m(12.4 MB)
\x1b[1;33mFiles Downloaded:\x1b[1;37m   423 \x1b[0;37m(62.1 MB)
\x1b[1;33mUpload/Download:\x1b[1;32m    1:5 ratio\x1b[0m
\x1b[1;33mTime Remaining:\x1b[1;37m     58 minutes\x1b[0m

\x1b[1;37mPress any key to return to main menu...\x1b[0m`
    const parsed = parser.current.parseANSI(stats)
    setLines(parsed)
  }

  const logoff = () => {
    const goodbye = `\x1b[0;37m

\x1b[1;36m═══════════════════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;33m              Thanks for calling DRiPz \/RLD!\x1b[0m

\x1b[1;37m              Please call again soon!\x1b[0m

\x1b[1;36m═══════════════════════════════════════════════════════════════════════════\x1b[0m


\x1b[1;32mNO CARRIER\x1b[0m
`
    const parsed = parser.current.parseANSI(goodbye)
    setLines(parsed)
    setTimeout(() => {
      window.location.reload()
    }, 3000)
  }

  const addLine = (text) => {
    const parsed = parser.current.parseANSI(text)
    setLines(prev => [...prev, ...parsed])
  }

  const handleBackToMain = () => {
    setShowAgentChat(false)
    setShowSettings(false)
    if (currentHandle) {
      showMainMenu(currentHandle)
    }
  }

  // Render AgentChat or Settings if active
  if (showAgentChat) {
    return <AgentChat onBack={handleBackToMain} />
  }

  if (showSettings) {
    return <Settings onBack={handleBackToMain} />
  }

  return (
    <div className="terminal" ref={terminalRef} onClick={handleTerminalClick}>
      <div className="terminal-screen" style={{ width: `${terminalWidth}ch`, maxWidth: `${terminalWidth}ch` }}>
        {lines.map((line, lineIdx) => (
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
        <div className="terminal-line terminal-input-line">
          <span style={{ color: '#aaa' }}>{input}</span>
          <span className={`cursor ${cursorVisible ? 'visible' : ''}`}>_</span>
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
        maxLength={80}
        autoFocus
      />
    </div>
  )
}

export default Terminal
