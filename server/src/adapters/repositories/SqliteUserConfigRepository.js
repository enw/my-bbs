const UserConfigRepository = require('../../domain/ports/repositories/UserConfigRepository')
const UserConfig = require('../../domain/entities/UserConfig')

class SqliteUserConfigRepository extends UserConfigRepository {
  constructor(db) {
    super()
    this.db = db
  }

  async getByUserId(userId) {
    const rows = this.db.prepare('SELECT * FROM user_configs WHERE user_id = ?').all(userId)
    return rows.map(row => this._mapRowToConfig(row))
  }

  async getByKey(userId, configKey) {
    const row = this.db.prepare(`
      SELECT * FROM user_configs 
      WHERE user_id = ? AND config_key = ?
    `).get(userId, configKey)
    if (!row) return null
    return this._mapRowToConfig(row)
  }

  async save(config) {
    // Check if exists
    const existing = await this.getByKey(config.userId, config.configKey)
    
    if (existing) {
      // Update
      const stmt = this.db.prepare(`
        UPDATE user_configs 
        SET config_value = ?, updated_at = datetime('now')
        WHERE user_id = ? AND config_key = ?
      `)
      stmt.run(config.configValue, config.userId, config.configKey)
      return this.getByKey(config.userId, config.configKey)
    } else {
      // Insert
      const stmt = this.db.prepare(`
        INSERT INTO user_configs (user_id, config_key, config_value, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `)
      const result = stmt.run(config.userId, config.configKey, config.configValue)
      return this.getById(result.lastInsertRowid)
    }
  }

  async delete(userId, configKey) {
    this.db.prepare(`
      DELETE FROM user_configs 
      WHERE user_id = ? AND config_key = ?
    `).run(userId, configKey)
  }

  async getById(id) {
    const row = this.db.prepare('SELECT * FROM user_configs WHERE id = ?').get(id)
    if (!row) return null
    return this._mapRowToConfig(row)
  }

  _mapRowToConfig(row) {
    return new UserConfig({
      id: row.id,
      userId: row.user_id,
      configKey: row.config_key,
      configValue: row.config_value,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  }
}

module.exports = SqliteUserConfigRepository

