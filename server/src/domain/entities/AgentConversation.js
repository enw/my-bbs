class AgentConversation {
  constructor({ id, userId, title, createdAt, updatedAt }) {
    this.id = id
    this.userId = userId
    this.title = title
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

module.exports = AgentConversation

