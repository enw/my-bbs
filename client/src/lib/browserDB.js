// Browser database wrapper using SQL.js
// Provides compatibility with better-sqlite3 API
import { initSqlJs } from 'sql.js'
// Import WASM URL explicitly for Vite to process it correctly
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

const DB_NAME = 'retro-bbs-db'
const DB_VERSION = 1

class BrowserDB {
  constructor() {
    this.db = null
    this.sqlJs = null
    this.initialized = false
  }

  async init() {
    if (this.initialized) {
      return this
    }

    try {
      // Load SQL.js
      // Using the imported WASM URL ensures Vite provides the correct path
      let initSqlJsFn = null
      
      // Try standard import first
      try {
         const mod = await import('sql.js')
         initSqlJsFn = mod.default || mod
         
         // Handle double wrapping if present
         if (initSqlJsFn.default && typeof initSqlJsFn.default === 'function') {
            initSqlJsFn = initSqlJsFn.default
         }
      } catch (e) {
         console.warn("Import failed, falling back to CDN", e)
      }

      if (!initSqlJsFn || typeof initSqlJsFn !== 'function') {
         initSqlJsFn = await this.loadSqlJsFromCDN()
      }

      this.sqlJs = await initSqlJsFn({
        locateFile: (file) => {
          if (file.endsWith('.wasm')) {
             return sqlWasmUrl
          }
          return file
        }
      })

      // Try to load existing database from IndexedDB
      const existingDb = await this.loadFromIndexedDB()
      
      if (existingDb) {
        this.db = new this.sqlJs.Database(existingDb)
      } else {
        // Create new database
        this.db = new this.sqlJs.Database()
        this.initSchema()
        this.seedData()
        await this.saveToIndexedDB()
      }

      this.initialized = true
      return this
    } catch (error) {
      console.error('Failed to initialize browser database:', error)
      throw error
    }
  }

  initSchema() {
    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        handle TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        real_name TEXT,
        real_first_name TEXT,
        real_last_name TEXT,
        street_address TEXT,
        city_state_zip TEXT,
        location TEXT,
        phone TEXT,
        phone_is_voice INTEGER DEFAULT 1,
        age INTEGER,
        gender TEXT,
        computer_type TEXT,
        modem_speed TEXT,
        heard_from TEXT,
        wants_ansi INTEGER DEFAULT 1,
        is_long_distance INTEGER DEFAULT 0,
        wants_graphics INTEGER DEFAULT 1,
        understands_logging INTEGER DEFAULT 0,
        agrees_no_abuse INTEGER DEFAULT 0,
        promises_upload INTEGER DEFAULT 0,
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
    this.db.run(`
      CREATE TABLE IF NOT EXISTS boards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      )
    `)

    // Messages
    this.db.run(`
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
    this.db.run(`
      CREATE TABLE IF NOT EXISTS file_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      )
    `)

    // Files
    this.db.run(`
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
    this.db.run(`
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

    // Check for new columns and add them if needed (migration)
    this.migrateSchema()
  }

  migrateSchema() {
    // Get existing columns
    const tableInfo = this.db.exec("PRAGMA table_info(users)")
    if (tableInfo.length === 0) return

    const columns = tableInfo[0].values.map(row => row[1]) // Column name is at index 1
    
    const newColumns = [
      { name: 'real_first_name', type: 'TEXT' },
      { name: 'real_last_name', type: 'TEXT' },
      { name: 'street_address', type: 'TEXT' },
      { name: 'city_state_zip', type: 'TEXT' },
      { name: 'phone_is_voice', type: 'INTEGER DEFAULT 1' },
      { name: 'age', type: 'INTEGER' },
      { name: 'gender', type: 'TEXT' },
      { name: 'computer_type', type: 'TEXT' },
      { name: 'modem_speed', type: 'TEXT' },
      { name: 'heard_from', type: 'TEXT' },
      { name: 'wants_ansi', type: 'INTEGER DEFAULT 1' },
      { name: 'is_long_distance', type: 'INTEGER DEFAULT 0' },
      { name: 'wants_graphics', type: 'INTEGER DEFAULT 1' },
      { name: 'understands_logging', type: 'INTEGER DEFAULT 0' },
      { name: 'agrees_no_abuse', type: 'INTEGER DEFAULT 0' },
      { name: 'promises_upload', type: 'INTEGER DEFAULT 0' }
    ]

    newColumns.forEach(col => {
      if (!columns.includes(col.name)) {
        try {
          this.db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`)
        } catch (err) {
          // Column might already exist, ignore
        }
      }
    })
  }

  seedData() {
    // Seed default boards
    const boardResult = this.db.exec("SELECT COUNT(*) as count FROM boards")
    let boardCount = 0
    if (boardResult.length > 0 && boardResult[0].values && boardResult[0].values[0]) {
      boardCount = boardResult[0].values[0][0]
    }
    
    if (boardCount === 0) {
      const stmt = this.db.prepare('INSERT INTO boards (name, description) VALUES (?, ?)')
      stmt.run(['General Discussion', 'General chat and discussion'])
      stmt.run(['Computer Talk', 'PC, Mac, Amiga, and more'])
      stmt.run(['Programming', 'Code, algorithms, and development'])
      stmt.run(['Hardware/Software Help', 'Technical support'])
      stmt.run(['Music & Entertainment', 'Music, movies, and fun'])
      stmt.run(['Jokes & Humor', 'Laughs and good times'])
      stmt.run(['For Sale/Trade', 'Buy, sell, and trade'])
      stmt.run(['SysOp Announcements', 'Official board announcements'])
      stmt.free()
    }

    // Seed file categories
    const catResult = this.db.exec("SELECT COUNT(*) as count FROM file_categories")
    let catCount = 0
    if (catResult.length > 0 && catResult[0].values && catResult[0].values[0]) {
      catCount = catResult[0].values[0][0]
    }
    
    if (catCount === 0) {
      const stmt = this.db.prepare('INSERT INTO file_categories (name, description) VALUES (?, ?)')
      stmt.run(['Shareware & Demos', 'Shareware games and demos'])
      stmt.run(['ANSI Art & Graphics', 'ANSI art packs and graphics'])
      stmt.run(['Music & Sound', 'MOD files, S3M, XM, and players'])
      stmt.run(['Utilities', 'File managers, compression, screen savers'])
      stmt.run(['Drivers', 'Mouse, printer, and video drivers'])
      stmt.run(['Text Files & Info', 'Documentation and text files'])
      stmt.run(['Jokes & Entertainment', 'Jokes, lyrics, and fun'])
      stmt.run(['Fractal & Graphics Apps', 'Fractint, POV-Ray, math graphing'])
      stmt.free()
    }
  }

  // Compatibility methods with better-sqlite3 API
  prepare(query) {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return new PreparedStatement(this.db, query)
  }

  exec(query) {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    this.db.run(query)
  }

  pragma(query) {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    // SQL.js doesn't support PRAGMA directly, but we can execute it
    const result = this.db.exec(query)
    if (result.length > 0) {
      // Convert to array of objects like better-sqlite3
      const columns = result[0].columns
      const values = result[0].values
      return values.map(row => {
        const obj = {}
        columns.forEach((col, idx) => {
          obj[col] = row[idx]
        })
        return obj
      })
    }
    return []
  }

  async saveToIndexedDB() {
    if (!this.db) return

    try {
      const data = this.db.export()
      const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['database'], 'readwrite')
          const store = transaction.objectStore('database')
          const putRequest = store.put(buffer, 'data')
          
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        }
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result
          if (!db.objectStoreNames.contains('database')) {
            db.createObjectStore('database')
          }
        }
      })
    } catch (error) {
      console.error('Failed to save database to IndexedDB:', error)
    }
  }

  async loadFromIndexedDB() {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        
        request.onerror = () => resolve(null) // No existing database
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['database'], 'readonly')
          const store = transaction.objectStore('database')
          const getRequest = store.get('data')
          
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              resolve(new Uint8Array(getRequest.result))
            } else {
              resolve(null)
            }
          }
          getRequest.onerror = () => resolve(null)
        }
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result
          if (!db.objectStoreNames.contains('database')) {
            db.createObjectStore('database')
          }
        }
      })
    } catch (error) {
      console.error('Failed to load database from IndexedDB:', error)
      return null
    }
  }

  // Auto-save after mutations
  async autoSave() {
    await this.saveToIndexedDB()
  }
  
  // Load SQL.js from CDN as fallback (using ES module import)
  async loadSqlJsFromCDN() {
    // Import from CDN using dynamic import
    // jsDelivr supports ES modules
    const cdnModule = await import('https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.js')
    // CDN version should also have default export
    return cdnModule.default || cdnModule.initSqlJs || cdnModule
  }
}

// PreparedStatement wrapper for better-sqlite3 compatibility
class PreparedStatement {
  constructor(db, query) {
    this.db = db
    this.query = query
    this.stmt = db.prepare(query)
  }

  get(...params) {
    if (params.length > 0) {
      this.stmt.bind(params)
    }
    let result = null
    if (this.stmt.step()) {
      result = this.stmt.getAsObject()
    }
    this.stmt.reset()
    return result
  }

  all(...params) {
    if (params.length > 0) {
      this.stmt.bind(params)
    }
    const results = []
    while (this.stmt.step()) {
      results.push(this.stmt.getAsObject())
    }
    this.stmt.reset()
    return results
  }

  run(...params) {
    if (params.length > 0) {
      this.stmt.bind(params)
    }
    this.stmt.step()
    const lastInsertRowid = this.db.exec("SELECT last_insert_rowid()")
    const changes = this.db.exec("SELECT changes()")
    this.stmt.reset()
    return {
      lastInsertRowid: lastInsertRowid.length > 0 && lastInsertRowid[0].values[0] ? lastInsertRowid[0].values[0][0] : null,
      changes: changes.length > 0 && changes[0].values[0] ? changes[0].values[0][0] : 0
    }
  }

  free() {
    if (this.stmt) {
      this.stmt.free()
    }
  }
}

let browserDBInstance = null

export async function initBrowserDB() {
  if (!browserDBInstance) {
    browserDBInstance = new BrowserDB()
    await browserDBInstance.init()
  }
  return browserDBInstance
}

export function getBrowserDB() {
  if (!browserDBInstance || !browserDBInstance.initialized) {
    throw new Error('Database not initialized. Call initBrowserDB() first.')
  }
  return browserDBInstance
}

