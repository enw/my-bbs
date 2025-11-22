const net = require('net')
const Database = require('better-sqlite3')
const path = require('path')

// ANSI escape sequences
const ANSI = {
  RESET: '\x1b[0m',
  CLEAR: '\x1b[2J',
  HOME: '\x1b[H',
  BOLD: '\x1b[1m',
  // Colors
  BLACK: '\x1b[30m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  // Bright colors
  BRIGHT_BLACK: '\x1b[90m',
  BRIGHT_RED: '\x1b[91m',
  BRIGHT_GREEN: '\x1b[92m',
  BRIGHT_YELLOW: '\x1b[93m',
  BRIGHT_BLUE: '\x1b[94m',
  BRIGHT_MAGENTA: '\x1b[95m',
  BRIGHT_CYAN: '\x1b[96m',
  BRIGHT_WHITE: '\x1b[97m',
}

class TelnetSession {
  constructor(socket, db) {
    this.socket = socket
    this.db = db
    this.userId = null
    this.handle = null
    this.currentScreen = 'splash'
    this.inputBuffer = ''
    this.remoteAddress = socket.remoteAddress
    
    // Setup socket handlers
    socket.setEncoding('utf8')
    socket.on('data', (data) => this.handleInput(data))
    socket.on('close', () => this.handleDisconnect())
    socket.on('error', (err) => console.error('Socket error:', err))
    
    // Send initial connection
    this.sendSplashScreen()
  }
  
  write(data) {
    if (this.socket && !this.socket.destroyed) {
      this.socket.write(data)
    }
  }
  
  sendSplashScreen() {
    const splash = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.BRIGHT_CYAN}
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║  ${ANSI.BRIGHT_YELLOW}██████╗ ███████╗████████╗██████╗  ██████╗     ██████╗ ██████╗ ███████╗${ANSI.BRIGHT_CYAN}  ║
║  ${ANSI.BRIGHT_YELLOW}██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗    ██╔══██╗██╔══██╗██╔════╝${ANSI.BRIGHT_CYAN}  ║
║  ${ANSI.BRIGHT_YELLOW}██████╔╝█████╗     ██║   ██████╔╝██║   ██║    ██████╔╝██████╔╝███████╗${ANSI.BRIGHT_CYAN}  ║
║  ${ANSI.BRIGHT_YELLOW}██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║    ██╔══██╗██╔══██╗╚════██║${ANSI.BRIGHT_CYAN}  ║
║  ${ANSI.BRIGHT_YELLOW}██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝    ██████╔╝██████╔╝███████║${ANSI.BRIGHT_CYAN}  ║
║  ${ANSI.BRIGHT_YELLOW}╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝     ╚═════╝ ╚═════╝ ╚══════╝${ANSI.BRIGHT_CYAN}  ║
║                                                                           ║
║                       ${ANSI.BRIGHT_WHITE}Welcome to the RETRO BBS!${ANSI.BRIGHT_CYAN}                            ║
║                                                                           ║
║                    ${ANSI.CYAN}A Nostalgic Trip Back to 1993${ANSI.BRIGHT_CYAN}                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

${ANSI.BRIGHT_GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              BOARD RULES - READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${ANSI.BRIGHT_RED}1. NO HACKING${ANSI.WHITE} - Discussion of illegal computer intrusion is strictly prohibited.

${ANSI.BRIGHT_RED}2. NO WAREZ${ANSI.WHITE} - No pirated software, cracks, or serial numbers allowed.

${ANSI.BRIGHT_RED}3. NO NUKING OTHER USERS${ANSI.WHITE} - Harassment and attacks on other users will result
   in immediate ban.

${ANSI.WHITE}4. Be respectful in message boards and private mail.

5. Upload legitimate shareware and freeware only.

6. Maintain your upload/download ratio.

${ANSI.BRIGHT_YELLOW}Violation of these rules will result in account suspension or termination
at SysOp discretion.${ANSI.RESET}

${ANSI.BRIGHT_GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Press ${ANSI.BRIGHT_CYAN}[N]${ANSI.BRIGHT_WHITE} for New User or ${ANSI.BRIGHT_CYAN}[L]${ANSI.BRIGHT_WHITE} to Login:${ANSI.RESET} `
    
    this.write(splash)
    this.currentScreen = 'splash'
  }
  
  handleInput(data) {
    // Handle telnet control sequences
    let cleanData = data
    
    // Remove telnet IAC (Interpret As Command) sequences
    cleanData = cleanData.replace(/\xff[\xfb\xfc\xfd\xfe]./g, '')
    
    // Handle backspace (client handles display, we just update buffer)
    if (cleanData === '\x7f' || cleanData === '\x08') {
      if (this.inputBuffer.length > 0) {
        this.inputBuffer = this.inputBuffer.slice(0, -1)
      }
      return
    }
    
    // Handle Enter/Return
    if (cleanData === '\r' || cleanData === '\n' || cleanData === '\r\n') {
      this.processCommand(this.inputBuffer.trim())
      this.inputBuffer = ''
      this.write('\r\n')
      return
    }
    
    // Handle single-key commands on splash screen
    if (this.currentScreen === 'splash') {
      const key = cleanData.toLowerCase().trim()
      if (key === 'n' || key === 'l') {
        this.processCommand(key)
        return
      }
    }
    
    // Add to input buffer (don't echo - let client handle it)
    if (cleanData.length > 0 && cleanData.charCodeAt(0) >= 32) {
      this.inputBuffer += cleanData
    }
  }
  
  processCommand(cmd) {
    if (this.currentScreen === 'splash') {
      if (cmd === 'n') {
        this.showNewUserForm()
      } else if (cmd === 'l') {
        this.showLoginForm()
      }
    } else if (this.currentScreen === 'newuser') {
      if (cmd) {
        this.newUserHandle = cmd
        this.write(`\r\n${ANSI.BRIGHT_GREEN}Thank you! Your handle "${cmd}" has been registered.${ANSI.RESET}\r\n`)
        this.write(`${ANSI.BRIGHT_WHITE}Press Enter to continue...${ANSI.RESET}\r\n`)
        this.currentScreen = 'newuser-confirm'
      }
    } else if (this.currentScreen === 'newuser-confirm') {
      this.showMainMenu(this.newUserHandle || 'NewUser')
      this.newUserHandle = null
    } else if (this.currentScreen === 'login') {
      if (cmd) {
        this.handleLogin(cmd)
      }
    } else if (this.currentScreen === 'login-password') {
      this.handlePassword(cmd)
    } else if (this.currentScreen === 'main') {
      this.handleMainMenuCommand(cmd.toLowerCase())
    }
  }
  
  showNewUserForm() {
    const form = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            NEW USER APPLICATION
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Please enter the following information:${ANSI.RESET}

${ANSI.BRIGHT_YELLOW}(Note: This is a retro BBS. We ask for nostalgic info like real BBSs did!)${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Handle (username):${ANSI.RESET} `
    this.write(form)
    this.currentScreen = 'newuser'
  }
  
  showLoginForm() {
    this.write(`\r\n${ANSI.BRIGHT_WHITE}Handle:${ANSI.RESET} `)
    this.currentScreen = 'login'
    this.loginHandle = null
  }
  
  handleLogin(handle) {
    this.loginHandle = handle
    this.write(`\r\n${ANSI.BRIGHT_WHITE}Password:${ANSI.RESET} `)
    this.currentScreen = 'login-password'
    // In real telnet, we'd want to disable echo for password
  }
  
  handlePassword(password) {
    const user = this.db.prepare('SELECT * FROM users WHERE handle = ?').get(this.loginHandle)
    
    if (!user || user.password_hash !== password) {
      this.write(`\r\n${ANSI.BRIGHT_RED}Invalid credentials.${ANSI.RESET}\r\n`)
      this.sendSplashScreen()
      return
    }
    
    // Update last call
    this.db.prepare('UPDATE users SET last_call = datetime(\'now\'), total_calls = total_calls + 1 WHERE id = ?')
      .run(user.id)
    
    this.userId = user.id
    this.handle = user.handle
    this.showMainMenu(user.handle)
  }
  
  showMainMenu(handle) {
    const menu = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════

${ANSI.BRIGHT_YELLOW}                            MAIN MENU${ANSI.BRIGHT_CYAN}

═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Welcome back, ${ANSI.BRIGHT_GREEN}${handle}${ANSI.BRIGHT_WHITE}!${ANSI.RESET}

${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}M${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} essage Boards
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}F${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} ile Areas
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}P${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} rivate Mail
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}U${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} ser List
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}Y${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} our Statistics
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}L${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} ogoff

${ANSI.BRIGHT_YELLOW}Time Left: 60 minutes${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Command:${ANSI.RESET} `
    this.write(menu)
    this.currentScreen = 'main'
  }
  
  handleMainMenuCommand(cmd) {
    switch(cmd) {
      case 'm':
        this.showMessageBoards()
        break
      case 'f':
        this.showFileAreas()
        break
      case 'p':
        this.showPrivateMail()
        break
      case 'u':
        this.showUserList()
        break
      case 'y':
        this.showStats()
        break
      case 'l':
        this.logoff()
        break
      default:
        this.write(`\r\n${ANSI.BRIGHT_RED}Invalid command. Please try again.${ANSI.RESET}\r\n`)
    }
  }
  
  showMessageBoards() {
    const boards = this.db.prepare(`
      SELECT b.*, COUNT(m.id) as message_count
      FROM boards b
      LEFT JOIN messages m ON b.id = m.board_id
      GROUP BY b.id
      ORDER BY b.id
    `).all()
    
    let output = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            MESSAGE BOARDS
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_YELLOW} #  Board Name                    Messages    Last Post${ANSI.RESET}
${ANSI.BRIGHT_CYAN}───────────────────────────────────────────────────────────────────────────${ANSI.RESET}
`
    boards.forEach((board, idx) => {
      output += ` ${ANSI.BRIGHT_WHITE}${idx + 1}${ANSI.WHITE}  ${board.name.padEnd(30)} ${String(board.message_count).padStart(6)}      Today 14:23\r\n`
    })
    
    output += `\r\n${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}1-${boards.length}${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} Select board  ${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}Q${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} uit to main menu\r\n\r\n${ANSI.BRIGHT_WHITE}Command:${ANSI.RESET} `
    this.write(output)
  }
  
  showFileAreas() {
    const categories = this.db.prepare(`
      SELECT c.*, COUNT(f.id) as file_count, COALESCE(SUM(f.size), 0) as total_size
      FROM file_categories c
      LEFT JOIN files f ON c.id = f.category_id
      GROUP BY c.id
      ORDER BY c.id
    `).all()
    
    let output = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            FILE AREAS
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_YELLOW} #  Category                       Files    Total Size${ANSI.RESET}
${ANSI.BRIGHT_CYAN}───────────────────────────────────────────────────────────────────────────${ANSI.RESET}
`
    categories.forEach((cat, idx) => {
      const sizeMB = (cat.total_size / 1024 / 1024).toFixed(1)
      output += ` ${ANSI.BRIGHT_WHITE}${idx + 1}${ANSI.WHITE}  ${cat.name.padEnd(30)} ${String(cat.file_count).padStart(6)}     ${sizeMB.padStart(6)} MB\r\n`
    })
    
    output += `\r\n${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}1-${categories.length}${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} Select category  ${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}Q${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} uit to main menu\r\n\r\n${ANSI.BRIGHT_WHITE}Command:${ANSI.RESET} `
    this.write(output)
  }
  
  showPrivateMail() {
    this.write(`${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            PRIVATE MAIL
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_GREEN}You have 2 new messages!${ANSI.RESET}

${ANSI.BRIGHT_YELLOW} #  From            Subject                      Date${ANSI.RESET}
${ANSI.BRIGHT_CYAN}───────────────────────────────────────────────────────────────────────────${ANSI.RESET}
 ${ANSI.BRIGHT_WHITE}1${ANSI.WHITE}  ${ANSI.BRIGHT_GREEN}*${ANSI.WHITE} SysOp         Welcome to the BBS!          Today
 ${ANSI.BRIGHT_WHITE}2${ANSI.WHITE}  ${ANSI.BRIGHT_GREEN}*${ANSI.WHITE} BlackKnight   Check out my new MODs        Yesterday

${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}R${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} ead  ${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}S${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} end new message  ${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}Q${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} uit to main menu

${ANSI.BRIGHT_WHITE}Command:${ANSI.RESET} `)
  }
  
  showUserList() {
    const users = this.db.prepare(`
      SELECT handle, location, last_call, total_calls
      FROM users
      ORDER BY total_calls DESC
      LIMIT 20
    `).all()
    
    let output = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            USER LIST
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_YELLOW}Handle          Location           Last Call        Total Calls${ANSI.RESET}
${ANSI.BRIGHT_CYAN}───────────────────────────────────────────────────────────────────────────${ANSI.RESET}
`
    users.forEach(user => {
      output += `${ANSI.BRIGHT_WHITE}${user.handle.padEnd(15)}${ANSI.WHITE} ${(user.location || '').padEnd(18)} ${(user.last_call || 'Never').padEnd(18)} ${String(user.total_calls).padStart(11)}\r\n`
    })
    
    output += `\r\n${ANSI.BRIGHT_WHITE}Press any key to return to main menu...${ANSI.RESET}`
    this.write(output)
  }
  
  showStats() {
    if (!this.userId) {
      this.sendSplashScreen()
      return
    }
    
    const user = this.db.prepare(`
      SELECT handle, real_name, location, first_call, last_call, total_calls,
             bytes_uploaded, bytes_downloaded, messages_posted
      FROM users WHERE id = ?
    `).get(this.userId)
    
    const ratio = user.bytes_uploaded > 0 
      ? `1:${(user.bytes_downloaded / user.bytes_uploaded).toFixed(1)}`
      : '1:∞'
    
    const output = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            YOUR STATISTICS
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_YELLOW}Handle:${ANSI.BRIGHT_WHITE}              ${user.handle}${ANSI.RESET}
${ANSI.BRIGHT_YELLOW}Real Name:${ANSI.WHITE}           ${user.real_name || 'N/A'}
${ANSI.BRIGHT_YELLOW}Location:${ANSI.WHITE}            ${user.location || 'N/A'}
${ANSI.BRIGHT_YELLOW}First Call:${ANSI.WHITE}           ${user.first_call || 'N/A'}
${ANSI.BRIGHT_YELLOW}Last Call:${ANSI.WHITE}           ${user.last_call || 'N/A'}
${ANSI.BRIGHT_YELLOW}Total Calls:${ANSI.BRIGHT_WHITE}          ${user.total_calls}${ANSI.RESET}
${ANSI.BRIGHT_YELLOW}Messages Posted:${ANSI.BRIGHT_WHITE}     ${user.messages_posted}${ANSI.RESET}
${ANSI.BRIGHT_YELLOW}Files Uploaded:${ANSI.BRIGHT_WHITE}      ${Math.floor(user.bytes_uploaded / 1024 / 1024)} ${ANSI.WHITE}(${(user.bytes_uploaded / 1024 / 1024).toFixed(1)} MB)
${ANSI.BRIGHT_YELLOW}Files Downloaded:${ANSI.BRIGHT_WHITE}    ${Math.floor(user.bytes_downloaded / 1024 / 1024)} ${ANSI.WHITE}(${(user.bytes_downloaded / 1024 / 1024).toFixed(1)} MB)
${ANSI.BRIGHT_YELLOW}Upload/Download:${ANSI.BRIGHT_GREEN}     ${ratio} ratio${ANSI.RESET}
${ANSI.BRIGHT_YELLOW}Time Remaining:${ANSI.BRIGHT_WHITE}      ${60} minutes${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Press any key to return to main menu...${ANSI.RESET}`
    this.write(output)
  }
  
  logoff() {
    const goodbye = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}

${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_YELLOW}              Thanks for calling RETRO BBS!${ANSI.RESET}

${ANSI.BRIGHT_WHITE}              Please call again soon!${ANSI.RESET}

${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}


${ANSI.BRIGHT_GREEN}NO CARRIER${ANSI.RESET}
`
    this.write(goodbye)
    setTimeout(() => {
      if (this.socket && !this.socket.destroyed) {
        this.socket.end()
      }
    }, 2000)
  }
  
  handleDisconnect() {
    console.log(`Telnet client disconnected: ${this.remoteAddress}`)
  }
}

function createTelnetServer(dbPath, port = 2323) {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  
  const server = net.createServer((socket) => {
    console.log(`New telnet connection from ${socket.remoteAddress}`)
    const session = new TelnetSession(socket, db)
  })
  
  server.listen(port, () => {
    console.log(`Telnet BBS server listening on port ${port}`)
    console.log(`Connect with: telnet localhost ${port}`)
    console.log(`Or use netcat: nc localhost ${port}`)
  })
  
  server.on('error', (err) => {
    console.error('Telnet server error:', err)
  })
  
  return server
}

module.exports = { createTelnetServer, TelnetSession }

