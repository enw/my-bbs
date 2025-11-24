const UserRepository = require('../../domain/ports/repositories/UserRepository')
const User = require('../../domain/entities/User')

class SqliteUserRepository extends UserRepository {
  constructor(db) {
    super()
    this.db = db
  }

  async getById(id) {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!row) return null
    return this._mapRowToUser(row)
  }

  async getByHandle(handle) {
    const row = this.db.prepare('SELECT * FROM users WHERE handle = ?').get(handle)
    if (!row) return null
    return this._mapRowToUser(row)
  }

  async create(user) {
    const stmt = this.db.prepare(`
      INSERT INTO users (handle, password_hash, real_name, location, phone, first_call, last_call, total_calls)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), 0)
    `)
    const result = stmt.run(
      user.handle,
      user.passwordHash,
      user.realName,
      user.location,
      user.phone
    )
    return this.getById(result.lastInsertRowid)
  }

  async update(user) {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET last_call = datetime('now'), total_calls = ?
      WHERE id = ?
    `)
    stmt.run(user.totalCalls, user.id)
    return this.getById(user.id)
  }

  _mapRowToUser(row) {
    return new User({
      id: row.id,
      handle: row.handle,
      passwordHash: row.password_hash,
      realName: row.real_name,
      location: row.location,
      phone: row.phone,
      firstCall: row.first_call,
      lastCall: row.last_call,
      totalCalls: row.total_calls,
      bytesUploaded: row.bytes_uploaded,
      bytesDownloaded: row.bytes_downloaded,
      messagesPosted: row.messages_posted,
      accessLevel: row.access_level,
      timeBank: row.time_bank
    })
  }
}

module.exports = SqliteUserRepository

