class AgentMessageRepository {
  async getByConversationId(conversationId) {
    throw new Error('getByConversationId must be implemented')
  }

  async create(message) {
    throw new Error('create must be implemented')
  }

  async getById(id) {
    throw new Error('getById must be implemented')
  }
}

module.exports = AgentMessageRepository

