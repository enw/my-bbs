const AgentConversation = require('../entities/AgentConversation')
const AgentMessage = require('../entities/AgentMessage')

class ChatWithAgent {
  constructor(
    llmProviderFactory,
    conversationRepository,
    messageRepository,
    emailTool,
    googleSheetsTool,
    webSearchTool,
    mcpTool,
    userConfigRepository,
    encryptionService
  ) {
    this.llmProviderFactory = llmProviderFactory
    this.conversationRepository = conversationRepository
    this.messageRepository = messageRepository
    this.emailTool = emailTool
    this.googleSheetsTool = googleSheetsTool
    this.webSearchTool = webSearchTool
    this.mcpTool = mcpTool
    this.userConfigRepository = userConfigRepository
    this.encryptionService = encryptionService
  }

  async execute({ userId, message, conversationId = null }) {
    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await this.conversationRepository.getById(conversationId)
      if (!conversation || conversation.userId !== userId) {
        throw new Error('Conversation not found')
      }
    } else {
      conversation = new AgentConversation({
        userId,
        title: message.substring(0, 50) || 'New Conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      conversation = await this.conversationRepository.create(conversation)
    }

    // Save user message
    const userMessage = new AgentMessage({
      conversationId: conversation.id,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString()
    })
    await this.messageRepository.create(userMessage)

    // Get conversation history
    const history = await this.messageRepository.getByConversationId(conversation.id)
    const messages = history.map(m => ({
      role: m.role,
      content: m.content
    }))

    // Add system prompt for DrIP - 1993 l33t hax0r SysOp personality
    // Only add system prompt if this is a new conversation (no history)
    if (messages.length === 0 || messages[0].role !== 'system') {
      const systemPrompt = `You are DrIP, the SysOp of DRiPz \/RLD. It's 1993. You're 13 years old, live in the San Fernando Valley area of LA, and run this BBS from your bedroom. You're l33t, knowledgeable, and VERY terse. You speak like a 13-year-old kid in 1993 - casual, direct, no formal language. Say "'sup?" not "How can I assist you today?" You're a hacker who happens to know a lot about computers, electronics, systems thinking, and how things work. You value clarity, quality, and getting things right. You're interested in RF, electronics, building systems, and understanding how things work under the hood. You don't reveal you're an AI or ML model - you're just a smart kid who can help with research, email, spreadsheets, and technical stuff when needed. Keep responses SHORT and to the point - you have homework, warez to hack, and other things to do. No long explanations unless absolutely necessary. Be direct, factual, and authentic to 1993 hacker culture. Talk like a kid - use casual slang, be informal, but still knowledgeable. You're in school during the day, so responses might be slower then. You're direct but not mean - just focused, efficient, and busy.

CRITICAL: Always write in ALL LOWERCASE. Never use capital letters except for proper nouns or acronyms. This is your style - lowercase everything.

IMPORTANT: It's 1993. The web isn't really a thing yet - most people don't even know what it is. You have access to a special research tool, but ONLY use it for:
1. Things you genuinely don't know about (not common knowledge from 1993)
2. Current events, news, or "what's happening" type questions
3. Things that would require up-to-date information

Don't use it for basic questions about computers, electronics, or stuff you should already know. Act like the web is this weird experimental thing, not a normal part of life.`
      messages.unshift({
        role: 'system',
        content: systemPrompt
      })
    }

    // Get user config for LLM provider and API keys
    const userConfig = await this.userConfigRepository.getByUserId(userId)
    const configMap = {}
    if (userConfig) {
      for (const config of userConfig) {
        try {
          // Check if the value looks encrypted (has the format: iv:authTag:encrypted)
          const isEncrypted = config.configValue.includes(':') && config.configValue.split(':').length === 3
          
          let decrypted
          if (isEncrypted) {
            decrypted = await this.encryptionService.decrypt(config.configValue)
          } else {
            // If not encrypted, try to parse as plain JSON (for non-sensitive configs)
            decrypted = config.configValue
          }
          
          configMap[config.configKey] = JSON.parse(decrypted)
        } catch (e) {
          // Log error but continue - some configs might be corrupted or use different encryption
          console.warn(`Warning: Could not decrypt config ${config.configKey}, skipping. Error: ${e.message}`)
          // For non-sensitive configs like terminal_width, we can skip them
          // They'll just use defaults
        }
      }
    }

    // Get LLM provider based on user config
    const llmProviderConfig = configMap.llm_provider || { provider: 'ollama', model: 'llama3.2:latest' }
    
    let llmProvider
    try {
      llmProvider = this.llmProviderFactory.create(llmProviderConfig, configMap)
    } catch (error) {
      throw new Error(`Failed to create LLM provider: ${error.message}. Please configure your LLM settings in the Config menu.`)
    }

    // Get available tools based on user config
    const availableTools = []
    const toolMap = {}

    if (configMap.google_access_token) {
      availableTools.push({
        type: 'function',
        function: {
          name: 'send_email',
          description: 'Send an email via Gmail',
          parameters: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Recipient email address' },
              subject: { type: 'string', description: 'Email subject' },
              body: { type: 'string', description: 'Email body' }
            },
            required: ['to', 'subject', 'body']
          }
        }
      })
      toolMap.send_email = this.emailTool
    }

    if (configMap.google_access_token) {
      availableTools.push({
        type: 'function',
        function: {
          name: 'read_google_sheet',
          description: 'Read data from a Google Sheet',
          parameters: {
            type: 'object',
            properties: {
              spreadsheetId: { type: 'string', description: 'Google Sheets spreadsheet ID' },
              range: { type: 'string', description: 'Range to read (e.g., A1:B10)' }
            },
            required: ['spreadsheetId', 'range']
          }
        }
      })
      toolMap.read_google_sheet = this.googleSheetsTool
    }

    if (configMap.mcp_url) {
      availableTools.push({
        type: 'function',
        function: {
          name: 'mcp_call',
          description: 'Call a tool from the local MCP server',
          parameters: {
            type: 'object',
            properties: {
              toolName: { type: 'string', description: 'Name of the MCP tool to call' },
              params: { type: 'object', description: 'Parameters for the tool' }
            },
            required: ['toolName', 'params']
          }
        }
      })
      toolMap.mcp_call = this.mcpTool
    }

    // Always available
    availableTools.push({
      type: 'function',
      function: {
        name: 'web_search',
        description: 'ONLY use this for: 1) Things you genuinely don\'t know (not common 1993 knowledge), 2) Current events/news/"what\'s happening" questions, 3) Information that requires up-to-date data. DO NOT use for basic computer/electronics questions you should already know. The web is experimental in 1993 - most people haven\'t heard of it.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query - be specific and include key terms' }
          },
          required: ['query']
        }
      }
    })
    toolMap.web_search = this.webSearchTool

    // Call LLM with tools
    let response
    // Default to llama3.2:latest for Ollama, gpt-4 for OpenAI
    const defaultModel = llmProviderConfig.provider === 'ollama' ? 'llama3.2:latest' : 'gpt-4'
    const model = llmProviderConfig.model || defaultModel
    if (availableTools.length > 0) {
      response = await llmProvider.chatWithTools(messages, availableTools, {
        model: model,
        temperature: 0.7
      })
    } else {
      response = await llmProvider.chat(messages, {
        model: model,
        temperature: 0.7
      })
    }

    // Handle tool calls if any
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        const tool = toolMap[toolCall.function.name]
        if (!tool) {
          // Tool doesn't exist - log and skip
          console.warn(`Tool ${toolCall.function.name} is not available. Available tools: ${Object.keys(toolMap).join(', ')}`)
          continue
        }
        if (tool) {
          try {
            const params = JSON.parse(toolCall.function.arguments)
            let result

            if (toolCall.function.name === 'send_email') {
              result = await tool.sendEmail({ ...params, accessToken: configMap.google_access_token })
            } else if (toolCall.function.name === 'read_google_sheet') {
              result = await tool.readSheet({ ...params, accessToken: configMap.google_access_token })
            } else if (toolCall.function.name === 'mcp_call') {
              result = await tool.callTool(params.toolName, params.params)
            } else if (toolCall.function.name === 'web_search') {
              result = await tool.search(params.query)
            }

            // Add tool result to messages
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify(result)
            })
          } catch (error) {
            console.error(`Error executing tool ${toolCall.function.name}:`, error)
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify({ error: error.message })
            })
          }
        }
      }

      // Get final response after tool execution
      // Both OpenAI and Ollama need to use chatWithTools for follow-up after tool execution
      // This ensures tool messages are properly handled
      response = await llmProvider.chatWithTools(messages, availableTools, {
        model: model,
        temperature: 0.7
      })
    }

    // Clean response content - remove thinking tokens, reasoning, and tool call markers
    let cleanedContent = this._cleanResponseContent(response.content)
    
    // Remove tool call markers that might have been left in the response (for Ollama)
    // Handle various formats: TOOL_CALL:, web_search:, GOPHER:, etc.
    cleanedContent = cleanedContent.replace(/TOOL_CALL:\s*\{[^}]+\}/g, '').trim()
    cleanedContent = cleanedContent.replace(/\w+:\s*\{\s*"tool"\s*:\s*"[^"]+"\s*,\s*"params"\s*:\s*\{[^}]*\}\s*\}/g, '').trim()
    cleanedContent = cleanedContent.replace(/\w+:\s*\{\s*"tool"\s*:\s*"[^"]+"\s*,\s*"params"\s*:\s*\{[^}]*\}\s*\}/g, '').trim() // Run twice for nested objects
    
    // Convert DrIP's response to lowercase (his style)
    // Preserve URLs and common patterns
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
    const urls = []
    cleanedContent = cleanedContent.replace(urlPattern, (url) => {
      urls.push(url)
      return `__URL_${urls.length - 1}__`
    })
    
    // Lowercase everything
    cleanedContent = cleanedContent.toLowerCase()
    
    // Restore URLs
    urls.forEach((url, idx) => {
      cleanedContent = cleanedContent.replace(`__url_${idx}__`, url)
    })

    // Save assistant message
    const assistantMessage = new AgentMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: cleanedContent,
      createdAt: new Date().toISOString()
    })
    await this.messageRepository.create(assistantMessage)

    // Update conversation timestamp
    conversation.updatedAt = new Date().toISOString()
    await this.conversationRepository.update(conversation)

    return {
      conversationId: conversation.id,
      response: cleanedContent
    }
  }

  _cleanResponseContent(content) {
    if (!content) return ''
    
    // Remove thinking/reasoning tags and their content
    let cleaned = content
    
    // Remove <think>...</think> tags and content (Llama thinking)
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '')
    
    // Remove <thinking>...</thinking> tags and content
    cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    
    // Remove <think>...</think> tags and content
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '')
    
    // Remove any standalone thinking/reasoning tags (in case of unclosed tags)
    cleaned = cleaned.replace(/<\/?redacted_reasoning>/gi, '')
    cleaned = cleaned.replace(/<\/?thinking>/gi, '')
    cleaned = cleaned.replace(/<\/?think>/gi, '')
    
    // Remove reasoning blocks that might be in other formats
    cleaned = cleaned.replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '')
    cleaned = cleaned.replace(/\[reasoning\][\s\S]*?\[\/reasoning\]/gi, '')
    cleaned = cleaned.replace(/\[redacted_reasoning\][\s\S]*?\[\/redacted_reasoning\]/gi, '')
    
    // Clean up any extra whitespace/newlines left behind
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
    
    return cleaned
  }
}

module.exports = ChatWithAgent

