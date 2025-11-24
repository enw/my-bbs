class GetConversations {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository
  }

  async execute(userId) {
    const conversations = await this.conversationRepository.getByUserId(userId)
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }))
  }
}

module.exports = GetConversations

