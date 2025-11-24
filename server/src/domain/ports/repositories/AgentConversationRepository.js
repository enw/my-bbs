class AgentConversationRepository {
  async getByUserId(userId) {
    throw new Error('getByUserId must be implemented')
  }

  async getById(id) {
    throw new Error('getById must be implemented')
  }

  async create(conversation) {
    throw new Error('create must be implemented')
  }

  async delete(id) {
    throw new Error('delete must be implemented')
  }

  async update(conversation) {
    throw new Error('update must be implemented')
  }
}

module.exports = AgentConversationRepository

