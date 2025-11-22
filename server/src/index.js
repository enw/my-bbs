const express = require('express')
const cors = require('cors')
const session = require('express-session')
const Database = require('better-sqlite3')
// const bcrypt = require('bcrypt') // Temporarily disabled for testing
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// Database setup
const db = new Database(path.join(__dirname, '../data/bbs.db'))
db.pragma('journal_mode = WAL')

// Initialize database tables
initDatabase()

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(session({
  secret: 'retro-bbs-secret-1993',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 3600000 // 1 hour
  }
}))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Retro BBS Server Running' })
})

// User registration
app.post('/api/users/register', async (req, res) => {
  try {
    const { handle, password, realName, location, phone } = req.body

    // Check if handle exists
    const existing = db.prepare('SELECT id FROM users WHERE handle = ?').get(handle)
    if (existing) {
      return res.status(400).json({ error: 'Handle already taken' })
    }

    // Hash password (temporarily using plain text for testing)
    const passwordHash = password // await bcrypt.hash(password, 10)

    // Insert user
    const stmt = db.prepare(`
      INSERT INTO users (handle, password_hash, real_name, location, phone, first_call, last_call, total_calls)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), 0)
    `)

    const result = stmt.run(handle, passwordHash, realName, location, phone)

    req.session.userId = result.lastInsertRowid
    req.session.handle = handle

    res.json({
      success: true,
      user: { id: result.lastInsertRowid, handle }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// User login
app.post('/api/users/login', async (req, res) => {
  try {
    const { handle, password } = req.body

    const user = db.prepare('SELECT * FROM users WHERE handle = ?').get(handle)

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = (password === user.password_hash) // await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Update last call and total calls
    db.prepare('UPDATE users SET last_call = datetime(\'now\'), total_calls = total_calls + 1 WHERE id = ?')
      .run(user.id)

    req.session.userId = user.id
    req.session.handle = user.handle

    res.json({
      success: true,
      user: {
        id: user.id,
        handle: user.handle,
        realName: user.real_name,
        location: user.location
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get user stats
app.get('/api/users/stats', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = db.prepare(`
    SELECT handle, real_name, location, first_call, last_call, total_calls,
           bytes_uploaded, bytes_downloaded, messages_posted
    FROM users WHERE id = ?
  `).get(req.session.userId)

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json({
    handle: user.handle,
    realName: user.real_name,
    location: user.location,
    firstCall: user.first_call,
    lastCall: user.last_call,
    totalCalls: user.total_calls,
    bytesUploaded: user.bytes_uploaded,
    bytesDownloaded: user.bytes_downloaded,
    messagesPosted: user.messages_posted,
    ratio: user.bytes_uploaded > 0 ? (user.bytes_downloaded / user.bytes_uploaded).toFixed(1) : '∞'
  })
})

// Get message boards
app.get('/api/boards', (req, res) => {
  const boards = db.prepare(`
    SELECT b.*, COUNT(m.id) as message_count
    FROM boards b
    LEFT JOIN messages m ON b.id = m.board_id
    GROUP BY b.id
    ORDER BY b.id
  `).all()

  res.json(boards)
})

// Get file categories
app.get('/api/files/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(f.id) as file_count, COALESCE(SUM(f.size), 0) as total_size
    FROM file_categories c
    LEFT JOIN files f ON c.id = f.category_id
    GROUP BY c.id
    ORDER BY c.id
  `).all()

  res.json(categories)
})

// Get files in category
app.get('/api/files/category/:id', (req, res) => {
  const files = db.prepare(`
    SELECT f.*, u.handle as uploader_handle
    FROM files f
    LEFT JOIN users u ON f.uploader_id = u.id
    WHERE f.category_id = ?
    ORDER BY f.upload_date DESC
  `).all(req.params.id)

  res.json(files)
})

function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handle TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      location TEXT,
      phone TEXT,
      first_call TEXT,
      last_call TEXT,
      total_calls INTEGER DEFAULT 0,
      bytes_uploaded INTEGER DEFAULT 0,
      bytes_downloaded INTEGER DEFAULT 0,
      messages_posted INTEGER DEFAULT 0,
      access_level INTEGER DEFAULT 1,
      time_bank INTEGER DEFAULT 60
    )
  `)

  // Message boards
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    )
  `)

  // Messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      thread_id INTEGER,
      parent_id INTEGER,
      from_user_id INTEGER NOT NULL,
      to_user TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      posted_at TEXT DEFAULT (datetime('now')),
      read_status INTEGER DEFAULT 0,
      FOREIGN KEY (board_id) REFERENCES boards(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id)
    )
  `)

  // File categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS file_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    )
  `)

  // Files
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      description TEXT,
      uploader_id INTEGER,
      upload_date TEXT DEFAULT (datetime('now')),
      size INTEGER,
      download_count INTEGER DEFAULT 0,
      validated INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES file_categories(id),
      FOREIGN KEY (uploader_id) REFERENCES users(id)
    )
  `)

  // Private messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      sent_at TEXT DEFAULT (datetime('now')),
      read_status INTEGER DEFAULT 0,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    )
  `)

  // Seed default boards
  const boardCount = db.prepare('SELECT COUNT(*) as count FROM boards').get()
  if (boardCount.count === 0) {
    const stmt = db.prepare('INSERT INTO boards (name, description) VALUES (?, ?)')
    stmt.run('General Discussion', 'General chat and discussion')
    stmt.run('Computer Talk', 'PC, Mac, Amiga, and more')
    stmt.run('Programming', 'Code, algorithms, and development')
    stmt.run('Hardware/Software Help', 'Technical support')
    stmt.run('Music & Entertainment', 'Music, movies, and fun')
    stmt.run('Jokes & Humor', 'Laughs and good times')
    stmt.run('For Sale/Trade', 'Buy, sell, and trade')
    stmt.run('SysOp Announcements', 'Official board announcements')
  }

  // Seed file categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM file_categories').get()
  if (catCount.count === 0) {
    const stmt = db.prepare('INSERT INTO file_categories (name, description) VALUES (?, ?)')
    stmt.run('Shareware & Demos', 'Shareware games and demos')
    stmt.run('ANSI Art & Graphics', 'ANSI art packs and graphics')
    stmt.run('Music & Sound', 'MOD files, S3M, XM, and players')
    stmt.run('Utilities', 'File managers, compression, screen savers')
    stmt.run('Drivers', 'Mouse, printer, and video drivers')
    stmt.run('Text Files & Info', 'Documentation and text files')
    stmt.run('Jokes & Entertainment', 'Jokes, lyrics, and fun')
    stmt.run('Fractal & Graphics Apps', 'Fractint, POV-Ray, math graphing')
  }
}

app.listen(PORT, () => {
  console.log(`Retro BBS Server running on http://localhost:${PORT}`)
})

module.exports = app
