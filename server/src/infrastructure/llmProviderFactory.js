const OpenAIProvider = require('../adapters/llm/OpenAIProvider')
const OllamaProvider = require('../adapters/llm/OllamaProvider')
const { OpenAI } = require('openai')

class LLMProviderFactory {
  create(config, userConfigMap) {
    const provider = config.provider || 'openai'

    if (provider === 'openai') {
      const apiKey = userConfigMap.openai_api_key?.apiKey || process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OpenAI API key not configured')
      }
      const openaiClient = new OpenAI({ apiKey })
      return new OpenAIProvider(openaiClient)
    } else if (provider === 'ollama') {
      const ollamaUrl = userConfigMap.ollama_config?.url || process.env.OLLAMA_URL || 'http://localhost:11434'
      return new OllamaProvider(ollamaUrl)
    } else {
      throw new Error(`Unknown LLM provider: ${provider}`)
    }
  }
}

module.exports = LLMProviderFactory

