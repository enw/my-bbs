class DeleteConversation {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository
  }

  async execute(userId, conversationId) {
    const conversation = await this.conversationRepository.getById(conversationId)
    if (!conversation || conversation.userId !== userId) {
      throw new Error('Conversation not found')
    }
    await this.conversationRepository.delete(conversationId)
  }
}

module.exports = DeleteConversation

