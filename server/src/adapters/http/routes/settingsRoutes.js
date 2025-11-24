const express = require('express')
const router = express.Router()

function createSettingsRoutes(settingsController) {
  router.get('/', (req, res) => settingsController.getSettings(req, res))
  router.post('/', (req, res) => settingsController.saveSettings(req, res))
  router.post('/test-connection', (req, res) => settingsController.testConnection(req, res))
  router.get('/ollama-models', (req, res) => settingsController.getOllamaModels(req, res))
  router.get('/auth/google', (req, res) => settingsController.googleOAuth(req, res))
  router.get('/auth/google/callback', (req, res) => settingsController.googleOAuthCallback(req, res))
  return router
}

module.exports = createSettingsRoutes

