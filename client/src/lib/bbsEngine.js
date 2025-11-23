// Browser BBS Engine - Ported from telnetServer.js
// Runs entirely in the browser, no server needed

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

export class BBSEngine {
  constructor(db, onOutput) {
    this.db = db
    this.onOutput = onOutput // Callback function for output
    this.userId = null
    this.handle = null
    this.currentScreen = 'splash'
    this.registrationData = {}
    this.registrationStep = 0
    this.loginHandle = null
    
    // Send initial splash screen
    this.sendSplashScreen()
  }

  write(data) {
    if (this.onOutput) {
      this.onOutput(data)
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

  processCommand(cmd) {
    if (this.currentScreen === 'splash') {
      if (cmd === 'n') {
        this.showNewUserForm()
      } else if (cmd === 'l') {
        this.showLoginForm()
      }
    } else if (this.currentScreen.startsWith('newuser-')) {
      if (this.currentScreen === 'newuser-confirm') {
        // User pressed Enter on confirmation screen
        if (this.handle) {
          this.showMainMenu(this.handle)
        } else {
          this.sendSplashScreen()
        }
      } else {
        this.handleRegistrationInput(cmd)
      }
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
    this.registrationData = {}
    this.registrationStep = 0
    this.showRegistrationStep()
  }

  showRegistrationStep() {
    const steps = this.getRegistrationSteps().map((step, idx) => ({
      ...step,
      screen: `newuser-step${idx}`
    }))
    
    if (this.registrationStep === 0) {
      // Show header
      const header = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}┌────────────────────────────────────────────────────────────┐
│                   NEW USER REGISTRATION                     │
│                (Please answer all questions)                │
└────────────────────────────────────────────────────────────┘${ANSI.RESET}

`
      this.write(header)
    }
    
    if (this.registrationStep >= steps.length) {
      // All steps complete, show summary and save
      this.completeRegistration()
      return
    }
    
    const step = steps[this.registrationStep]
    this.currentScreen = step.screen
    
    if (step.isYesNo) {
      this.write(`${step.prompt} `)
    } else {
      this.write(`${step.prompt} `)
    }
  }

  getRegistrationSteps() {
    return [
      { field: 'real_first_name', prompt: 'Enter your REAL first name:', validator: (v) => v.length > 0 },
      { field: 'real_last_name', prompt: 'Enter your REAL last name:', validator: (v) => v.length > 0 },
      { field: 'street_address', prompt: 'Enter your street address:', validator: (v) => v.length > 0 },
      { field: 'city_state_zip', prompt: 'Enter your city / state / zip:', validator: (v) => v.length > 0 },
      { field: 'phone', prompt: 'Enter your phone number:', validator: (v) => v.length > 0 },
      { field: 'phone_is_voice', prompt: 'Is this a voice number Y/N?', validator: (v) => /^[yn]$/i.test(v), isYesNo: true },
      { field: 'handle', prompt: 'Choose a HANDLE (Alias):', validator: (v) => v.length >= 3 && v.length <= 20, checkUnique: true },
      { field: 'password', prompt: 'Choose a PASSWORD:', validator: (v) => v.length >= 4 },
      { field: 'password_confirm', prompt: 'Re-enter PASSWORD:', validator: (v) => v === this.registrationData.password },
      { field: 'age', prompt: 'Age:', validator: (v) => /^\d+$/.test(v) && parseInt(v) > 0 },
      { field: 'gender', prompt: 'Gender (M/F):', validator: (v) => /^[mf]$/i.test(v) },
      { field: 'computer_type', prompt: 'Computer type (IBM/Clone, Amiga, Mac, Other):', validator: (v) => v.length > 0 },
      { field: 'modem_speed', prompt: 'Modem speed (2400/9600/14.4):', validator: (v) => /^(2400|9600|14\.4|14400)$/i.test(v) },
      { field: 'heard_from', prompt: 'Where did you hear about this BBS?:', validator: (v) => v.length > 0 },
      { field: 'wants_ansi', prompt: 'Do you want ANSI color? (Y/N):', validator: (v) => /^[yn]$/i.test(v), isYesNo: true },
      { field: 'is_long_distance', prompt: 'Are you calling long distance? (Y/N):', validator: (v) => /^[yn]$/i.test(v), isYesNo: true },
      { field: 'wants_graphics', prompt: 'Do you want graphics menus? (Y/N):', validator: (v) => /^[yn]$/i.test(v), isYesNo: true },
      { field: 'understands_logging', prompt: 'Do you understand that this system logs ALL activity? (Y/N):', validator: (v) => /^[yn]$/i.test(v), isYesNo: true },
      { field: 'agrees_no_abuse', prompt: 'Do you agree NOT to abuse your access? (Y/N):', validator: (v) => /^[yn]$/i.test(v), isYesNo: true },
      { field: 'promises_upload', prompt: 'Do you promise to upload something "cool" within 7 days? (Y/N):', validator: (v) => /^[yn]$/i.test(v), isYesNo: true }
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
      if (step.field === 'password_confirm' && value !== this.registrationData.password) {
        this.write(`\r\n${ANSI.BRIGHT_RED}Passwords do not match. Please try again.${ANSI.RESET}\r\n`)
      } else if (step.checkUnique) {
        // Check if handle is already taken
        try {
          const existing = this.db.prepare('SELECT id FROM users WHERE handle = ?').get(value)
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
    if (step.isYesNo) {
      this.registrationData[step.field] = /^y$/i.test(value) ? 1 : 0
    } else {
      this.registrationData[step.field] = value
    }
    
    // Move to next step
    this.registrationStep++
    this.write('\r\n')
    this.showRegistrationStep()
  }

  async completeRegistration() {
    try {
      // Combine first and last name for real_name
      const realName = `${this.registrationData.real_first_name} ${this.registrationData.real_last_name}`.trim()
      
      // Insert user into database
      const stmt = this.db.prepare(`
        INSERT INTO users (
          handle, password_hash, real_name, real_first_name, real_last_name,
          street_address, city_state_zip, location, phone, phone_is_voice,
          age, gender, computer_type, modem_speed, heard_from,
          wants_ansi, is_long_distance, wants_graphics,
          understands_logging, agrees_no_abuse, promises_upload,
          first_call, last_call, total_calls, access_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 0, 1)
      `)
      
      stmt.run(
        this.registrationData.handle,
        this.registrationData.password, // In production, hash this
        realName,
        this.registrationData.real_first_name,
        this.registrationData.real_last_name,
        this.registrationData.street_address,
        this.registrationData.city_state_zip,
        this.registrationData.city_state_zip, // Use as location too
        this.registrationData.phone,
        this.registrationData.phone_is_voice,
        parseInt(this.registrationData.age),
        this.registrationData.gender.toUpperCase(),
        this.registrationData.computer_type,
        this.registrationData.modem_speed,
        this.registrationData.heard_from,
        this.registrationData.wants_ansi,
        this.registrationData.is_long_distance,
        this.registrationData.wants_graphics,
        this.registrationData.understands_logging,
        this.registrationData.agrees_no_abuse,
        this.registrationData.promises_upload
      )
      
      // Save database after mutation
      if (this.db.autoSave) {
        await this.db.autoSave()
      }
      
      const summary = `${ANSI.CLEAR}${ANSI.HOME}${ANSI.WHITE}
${ANSI.BRIGHT_CYAN}──────────────────────────────────────────────────────────────${ANSI.RESET}

${ANSI.BRIGHT_GREEN}Registration complete!${ANSI.RESET}

${ANSI.BRIGHT_YELLOW}SysOp will now review your account.
You may have LIMITED access until approved.${ANSI.RESET}

${ANSI.BRIGHT_CYAN}──────────────────────────────────────────────────────────────${ANSI.RESET}

${ANSI.BRIGHT_WHITE}Press ENTER to continue...${ANSI.RESET}`
      
      this.write(summary)
      this.currentScreen = 'newuser-confirm'
      const user = this.db.prepare('SELECT id FROM users WHERE handle = ?').get(this.registrationData.handle)
      this.userId = user?.id || null
      this.handle = this.registrationData.handle
    } catch (error) {
      console.error(`Database error in completeRegistration:`, error)
      this.write(`\r\n${ANSI.BRIGHT_RED}Error saving registration. Please try again later.${ANSI.RESET}\r\n`)
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
      const user = this.db.prepare('SELECT * FROM users WHERE handle = ?').get(this.loginHandle)
      
      if (!user || user.password_hash !== password) {
        this.write(`\r\n${ANSI.BRIGHT_RED}Invalid credentials.${ANSI.RESET}\r\n`)
        this.sendSplashScreen()
        return
      }
      
      // Update last call
      this.db.prepare('UPDATE users SET last_call = datetime(\'now\'), total_calls = total_calls + 1 WHERE id = ?')
        .run(user.id)
      
      // Save database after mutation
      if (this.db.autoSave) {
        await this.db.autoSave()
      }
      
      this.userId = user.id
      this.handle = user.handle
      this.showMainMenu(user.handle)
    } catch (error) {
      console.error(`Database error in handlePassword:`, error)
      this.write(`\r\n${ANSI.BRIGHT_RED}Database error. Please try again later.${ANSI.RESET}\r\n`)
      this.sendSplashScreen()
    }
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
    try {
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
    } catch (error) {
      console.error(`Database error in showMessageBoards:`, error)
      this.write(`\r\n${ANSI.BRIGHT_RED}Error loading message boards. Please try again later.${ANSI.RESET}\r\n`)
      this.showMainMenu(this.handle || 'Guest')
    }
  }

  showFileAreas() {
    try {
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
    } catch (error) {
      console.error(`Database error in showFileAreas:`, error)
      this.write(`\r\n${ANSI.BRIGHT_RED}Error loading file areas. Please try again later.${ANSI.RESET}\r\n`)
      this.showMainMenu(this.handle || 'Guest')
    }
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
    try {
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
    } catch (error) {
      console.error(`Database error in showUserList:`, error)
      this.write(`\r\n${ANSI.BRIGHT_RED}Error loading user list. Please try again later.${ANSI.RESET}\r\n`)
      this.showMainMenu(this.handle || 'Guest')
    }
  }

  showStats() {
    if (!this.userId) {
      this.sendSplashScreen()
      return
    }
    
    try {
      const user = this.db.prepare(`
        SELECT handle, real_name, location, first_call, last_call, total_calls,
               bytes_uploaded, bytes_downloaded, messages_posted
        FROM users WHERE id = ?
      `).get(this.userId)
      
      if (!user) {
        this.write(`\r\n${ANSI.BRIGHT_RED}User not found.${ANSI.RESET}\r\n`)
        this.sendSplashScreen()
        return
      }
      
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
    } catch (error) {
      console.error(`Database error in showStats:`, error)
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
    // In browser, we can trigger a page reload after delay
    setTimeout(() => {
      if (this.onLogoff) {
        this.onLogoff()
      }
    }, 2000)
  }
}

