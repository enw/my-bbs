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

    // Get user config for LLM provider and API keys
    const userConfig = await this.userConfigRepository.getByUserId(userId)
    const configMap = {}
    if (userConfig) {
      for (const config of userConfig) {
        try {
          const decrypted = await this.encryptionService.decrypt(config.configValue)
          configMap[config.configKey] = JSON.parse(decrypted)
        } catch (e) {
          console.error(`Error decrypting config ${config.configKey}:`, e)
        }
      }
    }

    // Get LLM provider based on user config
    const llmProviderConfig = configMap.llm_provider || { provider: 'openai', model: 'gpt-4' }
    const llmProvider = this.llmProviderFactory.create(llmProviderConfig, configMap)

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
        description: 'Search the web for information',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' }
          },
          required: ['query']
        }
      }
    })
    toolMap.web_search = this.webSearchTool

    // Call LLM with tools
    let response
    const model = llmProviderConfig.model || 'gpt-4'
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
      response = await llmProvider.chat(messages, {
        model: model,
        temperature: 0.7
      })
    }

    // Save assistant message
    const assistantMessage = new AgentMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: response.content,
      createdAt: new Date().toISOString()
    })
    await this.messageRepository.create(assistantMessage)

    // Update conversation timestamp
    conversation.updatedAt = new Date().toISOString()
    await this.conversationRepository.update(conversation)

    return {
      conversationId: conversation.id,
      response: response.content
    }
  }
}

module.exports = ChatWithAgent

