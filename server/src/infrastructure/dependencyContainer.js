const SqliteUserRepository = require('../adapters/repositories/SqliteUserRepository')
const SqliteMessageRepository = require('../adapters/repositories/SqliteMessageRepository')
const SqliteFileRepository = require('../adapters/repositories/SqliteFileRepository')
const SqliteAgentConversationRepository = require('../adapters/repositories/SqliteAgentConversationRepository')
const SqliteAgentMessageRepository = require('../adapters/repositories/SqliteAgentMessageRepository')
const SqliteUserConfigRepository = require('../adapters/repositories/SqliteUserConfigRepository')
const RegisterUser = require('../domain/usecases/RegisterUser')
const LoginUser = require('../domain/usecases/LoginUser')
const GetUserStats = require('../domain/usecases/GetUserStats')
const ChatWithAgent = require('../domain/usecases/ChatWithAgent')
const GetConversations = require('../domain/usecases/GetConversations')
const DeleteConversation = require('../domain/usecases/DeleteConversation')
const SaveUserConfig = require('../domain/usecases/SaveUserConfig')
const GetUserConfig = require('../domain/usecases/GetUserConfig')
const TestConnection = require('../domain/usecases/TestConnection')
const UserController = require('../adapters/http/controllers/UserController')
const AgentController = require('../adapters/http/controllers/AgentController')
const SettingsController = require('../adapters/http/controllers/SettingsController')
const GmailEmailTool = require('../adapters/tools/GmailEmailTool')
const GoogleSheetsToolAdapter = require('../adapters/tools/GoogleSheetsToolAdapter')
const DuckDuckGoWebSearchTool = require('../adapters/tools/DuckDuckGoWebSearchTool')
const MCPToolAdapter = require('../adapters/tools/MCPToolAdapter')
const CryptoEncryptionService = require('../adapters/encryption/CryptoEncryptionService')
const LLMProviderFactory = require('./llmProviderFactory')

function createDependencyContainer(db) {
  // Repositories
  const userRepository = new SqliteUserRepository(db)
  const messageRepository = new SqliteMessageRepository(db)
  const fileRepository = new SqliteFileRepository(db)
  const agentConversationRepository = new SqliteAgentConversationRepository(db)
  const agentMessageRepository = new SqliteAgentMessageRepository(db)
  const userConfigRepository = new SqliteUserConfigRepository(db)

  // Encryption service
  const encryptionService = new CryptoEncryptionService(process.env.ENCRYPTION_KEY)

  // LLM Provider Factory
  const llmProviderFactory = new LLMProviderFactory()

  // Tools
  const emailTool = new GmailEmailTool()
  const googleSheetsTool = new GoogleSheetsToolAdapter()
  const webSearchTool = new DuckDuckGoWebSearchTool()
  const mcpTool = new MCPToolAdapter(process.env.MCP_URL || 'http://localhost:3001')

  // Use cases
  const registerUser = new RegisterUser(userRepository)
  const loginUser = new LoginUser(userRepository)
  const getUserStats = new GetUserStats(userRepository)
  
  // Agent use cases
  const chatWithAgent = new ChatWithAgent(
    llmProviderFactory,
    agentConversationRepository,
    agentMessageRepository,
    emailTool,
    googleSheetsTool,
    webSearchTool,
    mcpTool,
    userConfigRepository,
    encryptionService
  )

  const getConversations = new GetConversations(agentConversationRepository)
  const deleteConversation = new DeleteConversation(agentConversationRepository)
  const saveUserConfig = new SaveUserConfig(userConfigRepository, encryptionService)
  const getUserConfig = new GetUserConfig(userConfigRepository, encryptionService)
  const testConnection = new TestConnection(llmProviderFactory, userConfigRepository, encryptionService)

  // Controllers
  const userController = new UserController(registerUser, loginUser, getUserStats)
  const agentController = new AgentController(chatWithAgent, getConversations, deleteConversation)
  const settingsController = new SettingsController(saveUserConfig, getUserConfig, testConnection)

  return {
    repositories: {
      userRepository,
      messageRepository,
      fileRepository,
      agentConversationRepository,
      agentMessageRepository,
      userConfigRepository
    },
    useCases: {
      registerUser,
      loginUser,
      getUserStats,
      chatWithAgent,
      getConversations,
      deleteConversation,
      saveUserConfig,
      getUserConfig,
      testConnection
    },
    controllers: {
      userController,
      agentController,
      settingsController
    },
    services: {
      encryptionService,
      llmProviderFactory,
      emailTool,
      googleSheetsTool,
      webSearchTool,
      mcpTool
    }
  }
}

module.exports = createDependencyContainer

