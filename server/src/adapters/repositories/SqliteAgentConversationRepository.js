const AgentConversationRepository = require('../../domain/ports/repositories/AgentConversationRepository')
const AgentConversation = require('../../domain/entities/AgentConversation')

class SqliteAgentConversationRepository extends AgentConversationRepository {
  constructor(db) {
    super()
    this.db = db
  }

  async getByUserId(userId) {
    const rows = this.db.prepare(`
      SELECT * FROM agent_conversations 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
    `).all(userId)
    return rows.map(row => this._mapRowToConversation(row))
  }

  async getById(id) {
    const row = this.db.prepare('SELECT * FROM agent_conversations WHERE id = ?').get(id)
    if (!row) return null
    return this._mapRowToConversation(row)
  }

  async create(conversation) {
    const stmt = this.db.prepare(`
      INSERT INTO agent_conversations (user_id, title, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `)
    const result = stmt.run(conversation.userId, conversation.title)
    return this.getById(result.lastInsertRowid)
  }

  async delete(id) {
    // Also delete all messages in the conversation
    this.db.prepare('DELETE FROM agent_messages WHERE conversation_id = ?').run(id)
    this.db.prepare('DELETE FROM agent_conversations WHERE id = ?').run(id)
  }

  async update(conversation) {
    const stmt = this.db.prepare(`
      UPDATE agent_conversations 
      SET title = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    stmt.run(conversation.title, conversation.id)
    return this.getById(conversation.id)
  }

  _mapRowToConversation(row) {
    return new AgentConversation({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  }
}

module.exports = SqliteAgentConversationRepository

