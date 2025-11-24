const Database = require('better-sqlite3')
const path = require('path')

function initDatabase(db) {
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

  // User configs (for agent chat feature)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      config_key TEXT NOT NULL,
      config_value TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, config_key)
    )
  `)

  // Agent conversations
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // Agent messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES agent_conversations(id)
    )
  `)

  // Ensure at least one user exists for localhost development
  // This is needed when authentication is disabled and SettingsController uses userId=1
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (userCount.count === 0) {
    // If no users exist, create one (will get id=1 automatically)
    try {
      db.prepare(`
        INSERT INTO users (handle, password_hash, real_name, location, phone, first_call, last_call, total_calls, access_level)
        VALUES ('DefaultUser', 'password', 'Default User', 'Localhost', 'N/A', datetime('now'), datetime('now'), 0, 1)
      `).run()
      console.log('Created default user (id=1) for localhost development')
    } catch (e) {
      console.log('Could not create default user:', e.message)
    }
  } else {
    // If users exist, ensure user with id=1 exists
    const user1 = db.prepare('SELECT * FROM users WHERE id = 1').get()
    if (!user1) {
      console.log('Warning: No user with id=1 exists. Settings will use first available user ID.')
    }
  }

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

function createDatabase() {
  const dbPath = path.join(__dirname, '../../data/bbs.db')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  initDatabase(db)
  return db
}

module.exports = { createDatabase, initDatabase }

