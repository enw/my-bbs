class TestConnection {
  constructor(llmProviderFactory, userConfigRepository, encryptionService) {
    this.llmProviderFactory = llmProviderFactory
    this.userConfigRepository = userConfigRepository
    this.encryptionService = encryptionService
  }

  async execute(userId, provider, config) {
    // Get existing config if any
    const existingConfig = await this.userConfigRepository.getByKey(userId, 'llm_provider')
    let testConfig = config

    if (existingConfig) {
      try {
        const decrypted = await this.encryptionService.decrypt(existingConfig.configValue)
        testConfig = { ...JSON.parse(decrypted), ...config }
      } catch (e) {
        // Use provided config
      }
    }

    // Test the connection based on provider
    try {
      if (provider === 'openai') {
        // Create provider with test config
        const configMap = { openai_api_key: { apiKey: testConfig.openaiApiKey } }
        const llmProvider = this.llmProviderFactory.create(
          { provider: 'openai', model: 'gpt-3.5-turbo' },
          configMap
        )
        await llmProvider.chat(
          [{ role: 'user', content: 'Say "test" if you can read this.' }],
          { model: 'gpt-3.5-turbo' }
        )
      } else if (provider === 'ollama') {
        // Test Ollama connection
        const ollamaUrl = testConfig.ollamaUrl || 'http://localhost:11434'
        const response = await fetch(`${ollamaUrl}/api/tags`)
        if (!response.ok) {
          throw new Error('Ollama server not reachable')
        }
      }

      return { success: true, message: 'Connection successful' }
    } catch (error) {
      return { success: false, message: error.message || 'Connection failed' }
    }
  }
}

module.exports = TestConnection

