const express = require('express')
const router = express.Router()

function createUserRoutes(userController) {
  router.post('/register', (req, res) => userController.register(req, res))
  router.post('/login', (req, res) => userController.login(req, res))
  router.get('/stats', (req, res) => userController.getStats(req, res))
  return router
}

module.exports = createUserRoutes

