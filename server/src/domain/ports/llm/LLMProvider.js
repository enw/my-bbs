class LLMProvider {
  async chat(messages, options = {}) {
    throw new Error('chat must be implemented')
  }

  async chatWithTools(messages, tools, options = {}) {
    throw new Error('chatWithTools must be implemented')
  }
}

module.exports = LLMProvider

