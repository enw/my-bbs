const LLMProvider = require('../../domain/ports/llm/LLMProvider')

class OllamaProvider extends LLMProvider {
  constructor(baseUrl = 'http://localhost:11434') {
    super()
    this.baseUrl = baseUrl
  }

  async chat(messages, options = {}) {
    // Ensure messages are in the correct format for Ollama
    const formattedMessages = messages.map(m => {
      const msg = {
        role: m.role,
        content: m.content
      }
      // Only add tool_calls if they exist and are valid
      // Note: AgentMessage might not store tool_calls, so we only include if present
      if (m.toolCalls) {
        // Ollama expects tool_calls in OpenAI format
        // Since our internal format might be slightly different, we ensure compatibility
        // If m.toolCalls is from OpenAI, it's fine. If from our internal storage, we might need adaptation
        // Assuming m is from AgentMessage which just has content/role, 
        // but ChatWithAgent passes `messages` which might be raw objects with toolCalls
        msg.tool_calls = m.toolCalls
      }
      
      // Important: For tool results, Ollama expects role: 'tool'
      // Our system uses role: 'tool' as well, so this should map directly
      // But check for tool_call_id requirement
      if (m.role === 'tool' && m.tool_call_id) {
        // Ollama doesn't strictly enforce tool_call_id validation like OpenAI, 
        // but we should pass it if available
        // Note: Ollama API docs just say "role: tool, content: result"
      }
      
      return msg
    })

    const requestBody = {
      model: options.model || 'llama3.2:latest',
      messages: formattedMessages,
      stream: false,
      options: {
        temperature: options.temperature || 0.7
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        content: data.message.content,
        toolCalls: data.message.tool_calls || []
      }
    } catch (error) {
      console.error('Ollama chat error:', error)
      throw error
    }
  }

  async chatWithTools(messages, tools, options = {}) {
    // Use native tool calling support in Ollama
    
    // Format messages (reuse chat logic logic if possible, but we need to add tools)
    const formattedMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
      // Add extra fields if they exist (for tool messages or previous assistant messages with calls)
      ...(m.toolCalls && { tool_calls: m.toolCalls }),
      ...(m.role === 'tool' && { name: m.name }) // Ollama might not use name but OpenAI does
    }))

    // Format tools for Ollama (Expects OpenAI-compatible format)
    const formattedTools = tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      }
    }))

    const requestBody = {
      model: options.model || 'llama3.2:latest',
      messages: formattedMessages,
      tools: formattedTools,
      stream: false,
      options: {
        temperature: options.temperature || 0.7
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Map Ollama tool calls to our format (which matches OpenAI's)
      let toolCalls = []
      if (data.message.tool_calls) {
        toolCalls = data.message.tool_calls.map(tc => ({
          id: tc.function.name + '_' + Date.now(), // Ollama might not return ID, generate one
          type: 'function',
          function: {
            name: tc.function.name,
            // Ensure arguments is a string (OpenAI format) as our consumers expect JSON.parse(arguments)
            // Ollama returns arguments as an Object
            arguments: JSON.stringify(tc.function.arguments)
          }
        }))
      }

      return {
        content: data.message.content,
        toolCalls: toolCalls
      }
    } catch (error) {
      console.error('Ollama chatWithTools error:', error)
      // Fallback to manual prompt if native tools fail (unlikely with modern Ollama)
      throw error
    }
  }
}

module.exports = OllamaProvider

