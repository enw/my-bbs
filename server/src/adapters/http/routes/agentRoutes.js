const express = require('express')
const router = express.Router()

function createAgentRoutes(agentController) {
  router.post('/chat', (req, res) => agentController.chat(req, res))
  router.get('/conversations', (req, res) => agentController.getConversations(req, res))
  router.get('/conversations/:id/messages', (req, res) => agentController.getConversationMessages(req, res))
  router.delete('/conversations/:id', (req, res) => agentController.deleteConversation(req, res))
  return router
}

module.exports = createAgentRoutes

