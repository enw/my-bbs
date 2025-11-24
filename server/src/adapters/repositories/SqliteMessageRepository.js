const MessageRepository = require('../../domain/ports/repositories/MessageRepository')
const Message = require('../../domain/entities/Message')

class SqliteMessageRepository extends MessageRepository {
  constructor(db) {
    super()
    this.db = db
  }

  async getByBoard(boardId) {
    const rows = this.db.prepare(`
      SELECT m.*, COUNT(m2.id) as message_count
      FROM messages m
      LEFT JOIN messages m2 ON m.id = m2.parent_id
      WHERE m.board_id = ?
      GROUP BY m.id
      ORDER BY m.posted_at DESC
    `).all(boardId)
    return rows.map(row => this._mapRowToMessage(row))
  }

  async getById(id) {
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id)
    if (!row) return null
    return this._mapRowToMessage(row)
  }

  async create(message) {
    const stmt = this.db.prepare(`
      INSERT INTO messages (board_id, thread_id, parent_id, from_user_id, to_user, subject, body, posted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    const result = stmt.run(
      message.boardId,
      message.threadId,
      message.parentId,
      message.fromUserId,
      message.toUser,
      message.subject,
      message.body
    )
    return this.getById(result.lastInsertRowid)
  }

  _mapRowToMessage(row) {
    return new Message({
      id: row.id,
      boardId: row.board_id,
      threadId: row.thread_id,
      parentId: row.parent_id,
      fromUserId: row.from_user_id,
      toUser: row.to_user,
      subject: row.subject,
      body: row.body,
      postedAt: row.posted_at,
      readStatus: row.read_status
    })
  }
}

module.exports = SqliteMessageRepository

