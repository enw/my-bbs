const LLMProvider = require('../../domain/ports/llm/LLMProvider')

class OllamaProvider extends LLMProvider {
  constructor(baseUrl = 'http://localhost:11434') {
    super()
    this.baseUrl = baseUrl
  }

  async chat(messages, options = {}) {
    const model = options.model || 'llama2'
    
    // Convert messages format for Ollama
    const prompt = this._formatMessagesForOllama(messages)
    
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      content: data.response,
      toolCalls: [] // Ollama doesn't support tool calling natively
    }
  }

  async chatWithTools(messages, tools, options = {}) {
    // Ollama doesn't support tool calling, so we'll just do a regular chat
    // and include tool descriptions in the system message
    const systemMessage = `You have access to the following tools:
${tools.map(t => `- ${t.function.name}: ${t.function.description}`).join('\n')}

When you need to use a tool, describe what you want to do and the user will execute it for you.`

    const messagesWithSystem = [
      { role: 'system', content: systemMessage },
      ...messages
    ]

    return this.chat(messagesWithSystem, options)
  }

  _formatMessagesForOllama(messages) {
    // Convert OpenAI format to a simple prompt
    return messages.map(m => {
      if (m.role === 'system') {
        return `System: ${m.content}`
      } else if (m.role === 'user') {
        return `User: ${m.content}`
      } else if (m.role === 'assistant') {
        return `Assistant: ${m.content}`
      }
      return m.content
    }).join('\n\n')
  }
}

module.exports = OllamaProvider

