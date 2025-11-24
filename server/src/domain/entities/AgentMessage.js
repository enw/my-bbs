class AgentMessage {
  constructor({ id, conversationId, role, content, createdAt }) {
    this.id = id
    this.conversationId = conversationId
    this.role = role // 'user' or 'assistant' or 'system'
    this.content = content
    this.createdAt = createdAt
  }
}

module.exports = AgentMessage

