const LLMProvider = require('../../domain/ports/llm/LLMProvider')

class OpenAIProvider extends LLMProvider {
  constructor(openaiClient) {
    super()
    this.client = openaiClient
  }

  async chat(messages, options = {}) {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4',
      messages: messages,
      temperature: options.temperature || 0.7
    })

    return {
      content: response.choices[0].message.content,
      toolCalls: response.choices[0].message.tool_calls || []
    }
  }

  async chatWithTools(messages, tools, options = {}) {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4',
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
      temperature: options.temperature || 0.7
    })

    const message = response.choices[0].message

    return {
      content: message.content || '',
      toolCalls: message.tool_calls || []
    }
  }
}

module.exports = OpenAIProvider

