class AgentController {
  constructor(chatWithAgent, getConversations, deleteConversation) {
    this.chatWithAgent = chatWithAgent
    this.getConversationsUseCase = getConversations
    this.deleteConversationUseCase = deleteConversation
  }

  async chat(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const { message, conversationId } = req.body

      if (!message) {
        return res.status(400).json({ error: 'Message is required' })
      }

      const result = await this.chatWithAgent.execute({
        userId: req.session.userId,
        message,
        conversationId
      })

      res.json(result)
    } catch (error) {
      console.error('Agent chat error:', error)
      res.status(500).json({ error: error.message || 'Failed to process chat' })
    }
  }

  async getConversations(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const conversations = await this.getConversationsUseCase.execute(req.session.userId)
      res.json(conversations)
    } catch (error) {
      console.error('Get conversations error:', error)
      res.status(500).json({ error: 'Failed to get conversations' })
    }
  }

  async getConversationMessages(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const { id } = req.params
      // This would need a GetConversationMessages use case
      // For now, return empty array
      res.json([])
    } catch (error) {
      console.error('Get conversation messages error:', error)
      res.status(500).json({ error: 'Failed to get messages' })
    }
  }

  async deleteConversation(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const { id } = req.params
      await this.deleteConversationUseCase.execute(req.session.userId, parseInt(id))
      res.json({ success: true })
    } catch (error) {
      if (error.message === 'Conversation not found') {
        return res.status(404).json({ error: error.message })
      }
      console.error('Delete conversation error:', error)
      res.status(500).json({ error: 'Failed to delete conversation' })
    }
  }
}

module.exports = AgentController

