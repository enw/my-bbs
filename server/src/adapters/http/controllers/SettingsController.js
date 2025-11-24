const { google } = require('googleapis')

class SettingsController {
  constructor(saveUserConfig, getUserConfig, testConnection) {
    this.saveUserConfig = saveUserConfig
    this.getUserConfig = getUserConfig
    this.testConnection = testConnection
  }

  // Get userId from session or use default (1) for localhost development
  // WARNING: This is insecure and should only be used for localhost development
  getUserId(req) {
    if (req.session.userId) {
      return req.session.userId
    }
    // For localhost development, use userId=1
    // If user doesn't exist, it will fail with foreign key constraint
    // The database initialization should create a default user
    return 1
  }

  async getSettings(req, res) {
    try {
      // Authentication disabled for localhost development
      const userId = this.getUserId(req)

      const config = await this.getUserConfig.execute(userId)
      res.json(config)
    } catch (error) {
      console.error('Get settings error:', error)
      res.status(500).json({ error: 'Failed to get settings' })
    }
  }

  async saveSettings(req, res) {
    try {
      // Authentication disabled for localhost development
      const userId = this.getUserId(req)

      const { llmProvider, openaiApiKey, ollamaUrl, mcpUrl, llmModel } = req.body

      // Save LLM provider
      if (llmProvider) {
        await this.saveUserConfig.execute(userId, 'llm_provider', {
          provider: llmProvider,
          model: llmModel || 'gpt-4'
        })
      }

      // Save OpenAI API key if provided
      if (openaiApiKey) {
        await this.saveUserConfig.execute(userId, 'openai_api_key', {
          apiKey: openaiApiKey
        })
      }

      // Save Ollama URL if provided
      if (ollamaUrl) {
        await this.saveUserConfig.execute(userId, 'ollama_config', {
          url: ollamaUrl
        })
      }

      // Save MCP URL if provided
      if (mcpUrl) {
        await this.saveUserConfig.execute(userId, 'mcp_url', {
          url: mcpUrl
        })
      }

      res.json({ success: true })
    } catch (error) {
      console.error('Save settings error:', error)
      res.status(500).json({ error: 'Failed to save settings' })
    }
  }

  async testConnection(req, res) {
    try {
      // Authentication disabled for localhost development
      const userId = this.getUserId(req)

      const { provider, config } = req.body
      const result = await this.testConnection.execute(userId, provider, config)
      res.json(result)
    } catch (error) {
      console.error('Test connection error:', error)
      res.status(500).json({ error: 'Failed to test connection' })
    }
  }

  async googleOAuth(req, res) {
    try {
      // Authentication disabled for localhost development
      const userId = this.getUserId(req)

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
      )

      const scopes = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/spreadsheets'
      ]

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: userId.toString() // Store user ID in state
      })

      res.redirect(authUrl)
    } catch (error) {
      console.error('Google OAuth error:', error)
      res.status(500).json({ error: 'Failed to initiate OAuth' })
    }
  }

  async googleOAuthCallback(req, res) {
    try {
      const { code, state } = req.query
      const userId = parseInt(state) || this.getUserId(req)

      // Authentication disabled for localhost development
      // if (!userId || userId !== req.session.userId) {
      //   return res.status(401).json({ error: 'Invalid OAuth state' })
      // }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
      )

      const { tokens } = await oauth2Client.getToken(code)
      
      // Save tokens
      await this.saveUserConfig.execute(userId, 'google_access_token', {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      })

      res.redirect('http://localhost:5173/settings?oauth=success')
    } catch (error) {
      console.error('Google OAuth callback error:', error)
      res.redirect('http://localhost:5173/settings?oauth=error')
    }
  }

  async getOllamaModels(req, res) {
    try {
      const { ollamaUrl } = req.query
      const url = ollamaUrl || 'http://localhost:11434'
      
      const response = await fetch(`${url}/api/tags`)
      
      if (!response.ok) {
        throw new Error(`Ollama server not reachable: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Extract model names in "model:version" format
      // Ollama API /api/tags returns: { models: [{ name: "model:version", ... }, ...] }
      const models = (data.models || []).map(model => {
        // The name field contains the full "model:version" format (e.g., "llama2:13b")
        return model.name || model.model || ''
      }).filter(name => name) // Filter out any empty names

      res.json({ success: true, models })
    } catch (error) {
      console.error('Get Ollama models error:', error)
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch Ollama models' })
    }
  }
}

module.exports = SettingsController

