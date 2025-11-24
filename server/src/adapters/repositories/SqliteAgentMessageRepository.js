const AgentMessageRepository = require('../../domain/ports/repositories/AgentMessageRepository')
const AgentMessage = require('../../domain/entities/AgentMessage')

class SqliteAgentMessageRepository extends AgentMessageRepository {
  constructor(db) {
    super()
    this.db = db
  }

  async getByConversationId(conversationId) {
    const rows = this.db.prepare(`
      SELECT * FROM agent_messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC
    `).all(conversationId)
    return rows.map(row => this._mapRowToMessage(row))
  }

  async getById(id) {
    const row = this.db.prepare('SELECT * FROM agent_messages WHERE id = ?').get(id)
    if (!row) return null
    return this._mapRowToMessage(row)
  }

  async create(message) {
    const stmt = this.db.prepare(`
      INSERT INTO agent_messages (conversation_id, role, content, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `)
    const result = stmt.run(message.conversationId, message.role, message.content)
    return this.getById(result.lastInsertRowid)
  }

  _mapRowToMessage(row) {
    return new AgentMessage({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at
    })
  }
}

module.exports = SqliteAgentMessageRepository

