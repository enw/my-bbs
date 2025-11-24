const net = require('net')

// ANSI escape sequences
const ANSI = {
  RESET: '\x1b[0m',
  CLEAR: '\x1b[2J',
  HOME: '\x1b[H',
  BOLD: '\x1b[1m',
  BLACK: '\x1b[30m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
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
  constructor(socket, useCases, repositories) {
    this.socket = socket
    this.useCases = useCases
    this.repositories = repositories
    this.userId = null
    this.handle = null
    this.currentScreen = 'splash'
    this.inputBuffer = ''
    this.remoteAddress = socket.remoteAddress
    this.maxInputBufferSize = 1000
    this.connectionTimeout = null
    this.timeoutDuration = 5 * 60 * 1000 // 5 minutes
    this.registrationData = {}
    this.registrationStep = 0
    
    // Setup socket handlers
    socket.setEncoding('utf8')
    socket.on('data', (data) => this.handleInput(data))
    socket.on('close', () => this.handleDisconnect('normal'))
    socket.on('error', (err) => this.handleError(err))
    
    this.resetTimeout()
    this.sendSplashScreen()
  }
  
  resetTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
    }
    this.connectionTimeout = setTimeout(() => {
      this.write(`\r\n${ANSI.BRIGHT_YELLOW}Connection timeout due to inactivity.${ANSI.RESET}\r\n`)
      this.disconnect('timeout')
    }, this.timeoutDuration)
  }
  
  handleError(err) {
    console.error(`Socket error for ${this.remoteAddress}:`, err)
    try {
      this.write(`\r\n${ANSI.BRIGHT_RED}An error occurred. Disconnecting...${ANSI.RESET}\r\n`)
    } catch (writeErr) {
      // Ignore write errors during error handling
    }
    this.disconnect('error')
  }
  
  disconnect(reason) {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
    }
    if (this.socket && !this.socket.destroyed) {
      this.socket.destroy()
    }
    this.handleDisconnect(reason)
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

${ANSI.BRIGHT_WHITE}Press ${ANSI.BRIGHT_CYAN}[L]${ANSI.BRIGHT_WHITE} to Login:${ANSI.RESET} `
    
    this.write(splash)
    this.currentScreen = 'splash'
  }
  
  handleInput(data) {
    // Handle telnet control sequences
    let cleanData = data
    cleanData = cleanData.replace(/\xff[\xfb\xfc\xfd\xfe]./g, '')
    
    // Handle backspace
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
      // New user registration temporarily disabled
      // if (key === 'n' || key === 'l') {
      if (key === 'l') {
        this.processCommand(key)
        return
      }
    }
    
    // Add to input buffer
    if (cleanData.length > 0 && cleanData.charCodeAt(0) >= 32) {
      if (this.inputBuffer.length >= this.maxInputBufferSize) {
        this.write(`\r\n${ANSI.BRIGHT_RED}Input buffer overflow. Please use shorter input.${ANSI.RESET}\r\n`)
        this.inputBuffer = ''
        return
      }
      this.inputBuffer += cleanData
      this.resetTimeout()
    }
  }
  
  async processCommand(cmd) {
    if (this.currentScreen === 'splash') {
      // New user registration temporarily disabled
      // if (cmd === 'n') {
      //   this.showNewUserForm()
      // } else 
      if (cmd === 'l') {
        this.showLoginForm()
      }
    } else if (this.currentScreen.startsWith('newuser-')) {
      if (this.currentScreen === 'newuser-confirm') {
        if (this.handle) {
          this.showMainMenu(this.handle)
        } else {
          this.sendSplashScreen()
        }
      } else {
        await this.handleRegistrationInput(cmd)
      }
    } else if (this.currentScreen === 'login') {
      if (cmd) {
        this.handleLogin(cmd)
      }
    } else if (this.currentScreen === 'login-password') {
      await this.handlePassword(cmd)
    } else if (this.currentScreen === 'waiting') {
      // Return to main menu from waiting screen
      if (this.handle) {
        this.showMainMenu(this.handle)
      } else {
        this.sendSplashScreen()
      }
    } else if (this.currentScreen === 'main') {
      this.handleMainMenuCommand(cmd.toLowerCase())
    }
  }
  
  showNewUserForm() {
    this.registrationData = {}
    this.registrationStep = 0
    this.showRegistrationStep()
  }
  
  showRegistrationStep() {
    const steps = this.getRegistrationSteps()
    
    if (this.registrationStep === 0) {
      const header = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}┌────────────────────────────────────────────────────────────┐
│                   NEW USER REGISTRATION                     │
│                (Please answer all questions)                │
└────────────────────────────────────────────────────────────┘${ANSI.RESET}

`
      this.write(header)
    }
    
    if (this.registrationStep >= steps.length) {
      this.completeRegistration()
      return
    }
    
    const step = steps[this.registrationStep]
    this.currentScreen = `newuser-step${this.registrationStep}`
    
    this.write(`${step.prompt} `)
  }
  
  getRegistrationSteps() {
    return [
      { field: 'handle', prompt: 'Choose a HANDLE (Alias):', validator: (v) => v.length >= 3 && v.length <= 20, checkUnique: true },
      { field: 'password', prompt: 'Choose a PASSWORD:', validator: (v) => v.length >= 4 },
      { field: 'realName', prompt: 'Enter your REAL name:', validator: (v) => v.length > 0 },
      { field: 'location', prompt: 'Enter your location:', validator: (v) => v.length > 0 },
      { field: 'phone', prompt: 'Enter your phone number:', validator: (v) => v.length > 0 }
    ]
  }
  
  async handleRegistrationInput(cmd) {
    const steps = this.getRegistrationSteps()
    
    if (this.registrationStep >= steps.length) {
      return
    }
    
    const step = steps[this.registrationStep]
    const value = cmd.trim()
    
    // Validate input
    if (!step.validator(value)) {
      if (step.checkUnique) {
        try {
          const existing = await this.repositories.userRepository.getByHandle(value)
          if (existing) {
            this.write(`\r\n${ANSI.BRIGHT_RED}Handle already taken. Please choose another.${ANSI.RESET}\r\n`)
            this.write(`${step.prompt} `)
            return
          }
        } catch (error) {
          console.error(`Database error checking handle:`, error)
        }
      } else {
        this.write(`\r\n${ANSI.BRIGHT_RED}Invalid input. Please try again.${ANSI.RESET}\r\n`)
      }
      this.write(`${step.prompt} `)
      return
    }
    
    // Store value
    this.registrationData[step.field] = value
    
    // Move to next step
    this.registrationStep++
    this.write('\r\n')
    this.showRegistrationStep()
  }
  
  async completeRegistration() {
    try {
      const user = await this.useCases.registerUser.execute({
        handle: this.registrationData.handle,
        password: this.registrationData.password,
        realName: this.registrationData.realName,
        location: this.registrationData.location,
        phone: this.registrationData.phone
      })
      
      const summary = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}──────────────────────────────────────────────────────────────${ANSI.RESET}

${ANSI.BRIGHT_GREEN}Registration complete!${ANSI.RESET}

${ANSI.BRIGHT_YELLOW}SysOp will now review your account.
You may have LIMITED access until approved.${ANSI.RESET}

${ANSI.BRIGHT_CYAN}──────────────────────────────────────────────────────────────${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Press ENTER to continue...${ANSI.RESET}`
      
      this.write(summary)
      this.currentScreen = 'newuser-confirm'
      this.userId = user.id
      this.handle = user.handle
    } catch (error) {
      console.error(`Registration error for ${this.remoteAddress}:`, error)
      this.write(`\r\n${ANSI.BRIGHT_RED}${error.message || 'Error saving registration. Please try again later.'}${ANSI.RESET}\r\n`)
      this.sendSplashScreen()
    }
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
  }
  
  async handlePassword(password) {
    try {
      const user = await this.useCases.loginUser.execute({
        handle: this.loginHandle,
        password: password
      })
      
      this.userId = user.id
      this.handle = user.handle
      this.showMainMenu(user.handle)
    } catch (error) {
      this.write(`\r\n${ANSI.BRIGHT_RED}${error.message || 'Invalid credentials.'}${ANSI.RESET}\r\n`)
      this.sendSplashScreen()
    }
  }
  
  showMainMenu(handle) {
    const menu = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════

${ANSI.BRIGHT_YELLOW}                            MAIN MENU${ANSI.BRIGHT_CYAN}

═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Welcome back, ${ANSI.BRIGHT_GREEN}${handle}${ANSI.BRIGHT_WHITE}!${ANSI.RESET}

${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}B${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} oards
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}F${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} ile Areas
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}M${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} ail
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}U${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} ser List
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}Y${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} our Statistics
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}P${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} age the SysOp
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}C${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} onfig
${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}L${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} ogoff

${ANSI.BRIGHT_YELLOW}Time Left: 60 minutes${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Command:${ANSI.RESET} `
    this.write(menu)
    this.currentScreen = 'main'
  }
  
  handleMainMenuCommand(cmd) {
    switch(cmd) {
      case 'b':
        this.showMessageBoards()
        break
      case 'f':
        this.showFileAreas()
        break
      case 'm':
        this.showPrivateMail()
        break
      case 'u':
        this.showUserList()
        break
      case 'y':
        this.showStats()
        break
      case 'p':
        // Page the SysOp - redirect to HTTP interface message
        this.write(`\r\n${ANSI.BRIGHT_YELLOW}Page the SysOp is available via the web interface at http://localhost:5173${ANSI.RESET}\r\n`)
        this.write(`${ANSI.BRIGHT_WHITE}Press any key to return to main menu...${ANSI.RESET}`)
        this.currentScreen = 'waiting'
        break
      case 'c':
        // Config - redirect to HTTP interface message
        this.write(`\r\n${ANSI.BRIGHT_YELLOW}Config is available via the web interface at http://localhost:5173${ANSI.RESET}\r\n`)
        this.write(`${ANSI.BRIGHT_WHITE}Press any key to return to main menu...${ANSI.RESET}`)
        this.currentScreen = 'waiting'
        break
      case 'l':
        this.logoff()
        break
      default:
        this.write(`\r\n${ANSI.BRIGHT_RED}Invalid command. Please try again.${ANSI.RESET}\r\n`)
    }
  }
  
  showMessageBoards() {
    // TODO: Use message repository when we refactor message boards
    this.write(`${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            MESSAGE BOARDS
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_YELLOW} #  Board Name                    Messages    Last Post${ANSI.RESET}
${ANSI.BRIGHT_CYAN}───────────────────────────────────────────────────────────────────────────${ANSI.RESET}
 ${ANSI.BRIGHT_WHITE}1${ANSI.WHITE}  General Discussion                42      Today 14:23
 ${ANSI.BRIGHT_WHITE}2${ANSI.WHITE}  Computer Talk                      38      Today 12:15
 ${ANSI.BRIGHT_WHITE}3${ANSI.WHITE}  Programming                        15      Yesterday

${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}1-8${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} Select board  ${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}Q${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} uit to main menu

${ANSI.BRIGHT_WHITE}Command:${ANSI.RESET} `)
  }
  
  showFileAreas() {
    // TODO: Use file repository when we refactor file areas
    this.write(`${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            FILE AREAS
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_YELLOW} #  Category                       Files    Total Size${ANSI.RESET}
${ANSI.BRIGHT_CYAN}───────────────────────────────────────────────────────────────────────────${ANSI.RESET}
 ${ANSI.BRIGHT_WHITE}1${ANSI.WHITE}  Shareware & Demos                 127      15.2 MB
 ${ANSI.BRIGHT_WHITE}2${ANSI.WHITE}  ANSI Art & Graphics                89       2.4 MB
 ${ANSI.BRIGHT_WHITE}3${ANSI.WHITE}  Music & Sound (MODs)              234      42.8 MB

${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}1-7${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} Select category  ${ANSI.BRIGHT_CYAN}[${ANSI.BRIGHT_WHITE}Q${ANSI.BRIGHT_CYAN}]${ANSI.WHITE} uit to main menu

${ANSI.BRIGHT_WHITE}Command:${ANSI.RESET} `)
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
    // TODO: Use user repository when we add user list use case
    this.write(`${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            USER LIST
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_YELLOW}Handle          Location           Last Call        Total Calls${ANSI.RESET}
${ANSI.BRIGHT_CYAN}───────────────────────────────────────────────────────────────────────────${ANSI.RESET}
${ANSI.BRIGHT_WHITE}SysOp           NYC, NY            Today 19:45             1547${ANSI.RESET}
${ANSI.WHITE}BlackKnight     LA, CA             Today 18:32              892
Shadowhawk      Chicago, IL        Today 15:20              654

${ANSI.BRIGHT_WHITE}Press any key to return to main menu...${ANSI.RESET}`)
  }
  
  async showStats() {
    if (!this.userId) {
      this.sendSplashScreen()
      return
    }
    
    try {
      const stats = await this.useCases.getUserStats.execute(this.userId)
      
      const output = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}═══════════════════════════════════════════════════════════════════════════
                            YOUR STATISTICS
═══════════════════════════════════════════════════════════════════════════${ANSI.RESET}

${ANSI.BRIGHT_YELLOW}Handle:${ANSI.BRIGHT_WHITE}              ${stats.handle}${ANSI.RESET}
${ANSI.BRIGHT_YELLOW}Real Name:${ANSI.WHITE}           ${stats.realName || 'N/A'}
${ANSI.BRIGHT_YELLOW}Location:${ANSI.WHITE}            ${stats.location || 'N/A'}
${ANSI.BRIGHT_YELLOW}First Call:${ANSI.WHITE}           ${stats.firstCall || 'N/A'}
${ANSI.BRIGHT_YELLOW}Last Call:${ANSI.WHITE}           ${stats.lastCall || 'N/A'}
${ANSI.BRIGHT_YELLOW}Total Calls:${ANSI.BRIGHT_WHITE}          ${stats.totalCalls}${ANSI.RESET}
${ANSI.BRIGHT_YELLOW}Messages Posted:${ANSI.BRIGHT_WHITE}     ${stats.messagesPosted}${ANSI.RESET}
${ANSI.BRIGHT_YELLOW}Files Uploaded:${ANSI.BRIGHT_WHITE}      ${Math.floor(stats.bytesUploaded / 1024 / 1024)} ${ANSI.WHITE}(${(stats.bytesUploaded / 1024 / 1024).toFixed(1)} MB)
${ANSI.BRIGHT_YELLOW}Files Downloaded:${ANSI.BRIGHT_WHITE}    ${Math.floor(stats.bytesDownloaded / 1024 / 1024)} ${ANSI.WHITE}(${(stats.bytesDownloaded / 1024 / 1024).toFixed(1)} MB)
${ANSI.BRIGHT_YELLOW}Upload/Download:${ANSI.BRIGHT_GREEN}     ${stats.ratio} ratio${ANSI.RESET}
${ANSI.BRIGHT_YELLOW}Time Remaining:${ANSI.BRIGHT_WHITE}      ${60} minutes${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Press any key to return to main menu...${ANSI.RESET}`
      this.write(output)
    } catch (error) {
      console.error(`Error loading statistics:`, error)
      this.write(`\r\n${ANSI.BRIGHT_RED}Error loading statistics. Please try again later.${ANSI.RESET}\r\n`)
      this.showMainMenu(this.handle || 'Guest')
    }
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
  
  handleDisconnect(reason = 'normal') {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
    }
    const reasonMsg = reason === 'normal' ? 'normal close' : reason === 'timeout' ? 'timeout' : 'error'
    console.log(`Telnet client disconnected: ${this.remoteAddress} (reason: ${reasonMsg})`)
  }
}

module.exports = TelnetSession

