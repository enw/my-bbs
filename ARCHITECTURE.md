# Retro BBS Architecture

## Overview

The Retro BBS uses **Ports/Adapters (Hexagonal) Architecture** to support multiple interfaces (Telnet, HTTP, Electron) while sharing the same core business logic. This is **not** a thin layer on telnet - instead, telnet and HTTP are **parallel adapters** that both use the same domain layer.

## Architecture Pattern: Ports & Adapters

### Core Principle

**The domain layer (business logic) is independent of infrastructure.** All interfaces (telnet, HTTP, browser) are adapters that translate between their protocol and the domain use cases.

```
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER (Core)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Entities   │  │    Ports     │  │  Use Cases   │     │
│  │  (User, etc) │  │ (Interfaces) │  │ (Business    │     │
│  │              │  │              │  │  Logic)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │                    │                    │
    ┌────┴────┐         ┌─────┴─────┐      ┌──────┴──────┐
    │         │         │           │      │             │
┌───┴───┐ ┌──┴───┐ ┌───┴───┐ ┌────┴────┐ │             │
│TELNET │ │ HTTP │ │TOOLS  │ │REPOS    │ │  SERVICES   │
│ADAPTER│ │ADAPT │ │ADAPT  │ │ADAPT    │ │  ADAPT      │
└───────┘ └──────┘ └───────┘ └─────────┘ └─────────────┘
```

## Layer Breakdown

### 1. Domain Layer (`server/src/domain/`)

**Purpose**: Pure business logic with no dependencies on infrastructure.

#### Entities (`domain/entities/`)
- Domain models: `User`, `Message`, `File`, `AgentConversation`, `AgentMessage`, `UserConfig`
- Contain business logic (e.g., `User.getRatio()`)
- No database, no HTTP, no external dependencies

#### Ports (`domain/ports/`)
- **Interfaces/Contracts** that define what the domain needs
- `UserRepository` - interface for user data access
- `LLMProvider` - interface for LLM interactions
- `EmailTool`, `GoogleSheetsTool`, etc. - interfaces for external services
- `EncryptionService` - interface for encryption

#### Use Cases (`domain/usecases/`)
- **Business logic** that orchestrates domain operations
- `RegisterUser`, `LoginUser`, `ChatWithAgent`, `SaveUserConfig`
- Depend on **ports** (interfaces), not concrete implementations
- Example: `ChatWithAgent` uses `LLMProvider` port, doesn't care if it's OpenAI or Ollama

### 2. Adapters Layer (`server/src/adapters/`)

**Purpose**: Concrete implementations that connect domain to infrastructure.

#### HTTP Adapter (`adapters/http/`)
- **Controllers**: Translate HTTP requests to use case calls
  - `UserController` → calls `RegisterUser`, `LoginUser` use cases
  - `AgentController` → calls `ChatWithAgent` use case
  - `SettingsController` → calls `SaveUserConfig`, `GetUserConfig` use cases
- **Routes**: Express route definitions
  - `/api/users/*` - User operations
  - `/api/agent/*` - Agent chat operations
  - `/api/settings/*` - Settings/configuration

#### Telnet Adapter (`adapters/telnet/`)
- **TelnetSession**: Handles telnet protocol (socket I/O, ANSI formatting)
- **TelnetServer**: Creates telnet server on port 2323
- **Uses same use cases** as HTTP adapter:
  - Calls `registerUser.execute()` for registration
  - Calls `loginUser.execute()` for login
  - Calls `getUserStats.execute()` for stats
- Handles telnet-specific concerns:
  - Socket management
  - ANSI escape sequences
  - Input buffering
  - Connection timeouts

#### Repository Adapters (`adapters/repositories/`)
- **SQLite implementations** of repository ports
- `SqliteUserRepository` implements `UserRepository` port
- `SqliteAgentConversationRepository` implements `AgentConversationRepository` port
- All use `better-sqlite3` for database access

#### LLM Adapters (`adapters/llm/`)
- `OpenAIProvider` implements `LLMProvider` port (uses OpenAI SDK)
- `OllamaProvider` implements `LLMProvider` port (uses Ollama HTTP API)
- Both implement the same interface, so use cases can swap between them

#### Tool Adapters (`adapters/tools/`)
- `GmailEmailTool` implements `EmailTool` port (uses Gmail API)
- `GoogleSheetsToolAdapter` implements `GoogleSheetsTool` port
- `DuckDuckGoWebSearchTool` implements `WebSearchTool` port
- `MCPToolAdapter` implements `MCPTool` port (connects to local MCP server)

#### Service Adapters (`adapters/encryption/`)
- `CryptoEncryptionService` implements `EncryptionService` port
- Uses Node.js `crypto` module

### 3. Infrastructure Layer (`server/src/infrastructure/`)

**Purpose**: Framework setup, dependency injection, wiring.

- **database.js**: SQLite connection and schema initialization
- **dependencyContainer.js**: Creates all adapters and wires them to use cases
- **server.js**: Express app setup, mounts routes, starts telnet server
- **llmProviderFactory.js**: Creates LLM providers based on user config

## Data Flow Examples

### Example 1: User Login via HTTP

```
Browser → HTTP POST /api/users/login
  ↓
UserController.login()
  ↓
LoginUser.execute({ handle, password })
  ↓
UserRepository.getByHandle(handle)  [port]
  ↓
SqliteUserRepository.getByHandle()  [adapter]
  ↓
SQLite Database
  ↓
User entity returned
  ↓
LoginUser validates password
  ↓
UserRepository.update(user)  [port]
  ↓
SqliteUserRepository.update()  [adapter]
  ↓
UserController formats HTTP response
  ↓
Browser receives JSON response
```

### Example 2: User Login via Telnet

```
Telnet Client → Socket connection
  ↓
TelnetSession.handlePassword(password)
  ↓
LoginUser.execute({ handle, password })  [SAME USE CASE]
  ↓
UserRepository.getByHandle(handle)  [SAME PORT]
  ↓
SqliteUserRepository.getByHandle()  [SAME ADAPTER]
  ↓
SQLite Database
  ↓
User entity returned
  ↓
LoginUser validates password
  ↓
TelnetSession.showMainMenu(handle)  [telnet-specific formatting]
  ↓
Socket.write(ANSI formatted menu)
  ↓
Telnet Client displays menu
```

**Key Point**: Both HTTP and Telnet use the **exact same** `LoginUser` use case and `UserRepository`. Only the presentation layer differs.

### Example 3: Agent Chat

```
Browser → HTTP POST /api/agent/chat
  ↓
AgentController.chat()
  ↓
ChatWithAgent.execute({ userId, message })
  ↓
UserConfigRepository.getByUserId()  [get user's LLM config]
  ↓
LLMProviderFactory.create(config)  [creates OpenAI or Ollama]
  ↓
LLMProvider.chatWithTools(messages, tools)  [port]
  ↓
OpenAIProvider.chatWithTools()  [adapter - calls OpenAI API]
  ↓
Tool calls executed (EmailTool, GoogleSheetsTool, etc.)
  ↓
Response returned to use case
  ↓
AgentMessageRepository.create()  [save to database]
  ↓
AgentController formats HTTP response
  ↓
Browser receives JSON response
```

## Why Multiple Adapters?

### Telnet Adapter
- **Purpose**: Authentic BBS experience via direct telnet connection
- **Use Case**: Users who want the classic terminal experience
- **Protocol**: Raw TCP socket, ANSI escape sequences
- **Example**: `telnet localhost 2323`

### HTTP Adapter
- **Purpose**: Modern web browser access
- **Use Case**: Users accessing via web browser or Electron app
- **Protocol**: HTTP REST API, JSON
- **Example**: `http://localhost:3000/api/users/login`

### Both Use Same Domain
- **No duplication**: Business logic exists once in domain layer
- **Consistency**: Same validation, same rules, same data
- **Testability**: Can test domain logic without HTTP or telnet
- **Flexibility**: Easy to add new adapters (WebSocket, gRPC, etc.)

## Frontend Architecture

### Browser Interface (`client/src/`)
- **React components**: `Terminal.jsx`, `AgentChat.jsx`, `Settings.jsx`
- **HTTP client**: Makes requests to `/api/*` endpoints
- **ANSI rendering**: Parses ANSI escape codes for display
- **State management**: React hooks (useState, useEffect)

### Electron Interface (`electron/`)
- **Wrapper**: Electron app that loads the React frontend
- **Protocol**: Uses HTTP adapter (loads `http://localhost:5173`)
- **No direct telnet**: Electron app uses HTTP, not telnet protocol

## Agent Chat Feature Architecture

### Domain Flow
```
User Message
  ↓
ChatWithAgent Use Case
  ↓
Get User Config (encrypted API keys)
  ↓
LLMProviderFactory.create() → OpenAIProvider or OllamaProvider
  ↓
LLMProvider.chatWithTools()
  ↓
Tool Calls (if needed):
  - EmailTool.sendEmail()
  - GoogleSheetsTool.readSheet()
  - WebSearchTool.search()
  - MCPTool.callTool()
  ↓
LLMProvider.chat() [final response]
  ↓
Save to AgentMessageRepository
  ↓
Return response
```

### Tool Integration
- Tools are **ports** (interfaces) in domain layer
- **Adapters** implement tools:
  - `GmailEmailTool` uses Google OAuth tokens
  - `GoogleSheetsToolAdapter` uses Google Sheets API
  - `DuckDuckGoWebSearchTool` uses DuckDuckGo API
  - `MCPToolAdapter` connects to local MCP server
- Tools are **injected** into `ChatWithAgent` use case
- User config determines which tools are available

## Dependency Injection

### Dependency Container (`infrastructure/dependencyContainer.js`)
- Creates all adapters (repositories, tools, services)
- Creates all use cases (injects adapters)
- Creates all controllers (injects use cases)
- **Single source of truth** for wiring

### Example Wiring
```javascript
// 1. Create adapters
const userRepository = new SqliteUserRepository(db)
const encryptionService = new CryptoEncryptionService()

// 2. Create use cases (inject adapters)
const loginUser = new LoginUser(userRepository)
const saveUserConfig = new SaveUserConfig(userConfigRepository, encryptionService)

// 3. Create controllers (inject use cases)
const userController = new UserController(loginUser, ...)
const settingsController = new SettingsController(saveUserConfig, ...)
```

## File Structure

```
server/src/
├── domain/                    # Core business logic (NO infrastructure deps)
│   ├── entities/             # Domain models
│   ├── ports/                # Interfaces/contracts
│   │   ├── repositories/    # Data access interfaces
│   │   ├── llm/             # LLM provider interface
│   │   ├── tools/           # Tool interfaces
│   │   └── encryption/      # Encryption interface
│   └── usecases/            # Business logic
│
├── adapters/                 # Infrastructure implementations
│   ├── http/                # HTTP/REST adapter
│   │   ├── controllers/    # HTTP request handlers
│   │   └── routes/          # Express routes
│   ├── telnet/              # Telnet protocol adapter
│   ├── repositories/        # SQLite implementations
│   ├── llm/                 # LLM provider implementations
│   ├── tools/               # Tool implementations
│   └── encryption/          # Encryption implementation
│
└── infrastructure/           # Framework setup
    ├── database.js          # DB connection
    ├── dependencyContainer.js  # DI wiring
    ├── llmProviderFactory.js   # LLM factory
    └── server.js            # Express + Telnet setup
```

## Key Architectural Decisions

### 1. Why Ports/Adapters?
- **Separation of Concerns**: Business logic independent of HTTP/telnet
- **Testability**: Can test use cases with mock adapters
- **Flexibility**: Easy to swap implementations (e.g., PostgreSQL instead of SQLite)
- **Multiple Interfaces**: Support telnet AND HTTP without duplication

### 2. Why Not Just Telnet?
- **Browser Access**: Modern users expect web interface
- **Electron App**: Desktop app needs HTTP API
- **Future-Proof**: Easy to add WebSocket, gRPC, GraphQL adapters

### 3. Why Not Just HTTP?
- **Authentic Experience**: Telnet is the classic BBS protocol
- **Nostalgia**: Direct telnet connection feels authentic
- **Flexibility**: Users can choose their interface

### 4. Shared Domain = No Duplication
- **Single Source of Truth**: Business rules exist once
- **Consistency**: Same validation, same behavior across interfaces
- **Maintainability**: Change business logic in one place

## Communication Patterns

### HTTP Flow
```
Client (Browser/Electron)
  ↓ HTTP Request
Express Router
  ↓
Controller (HTTP Adapter)
  ↓
Use Case (Domain)
  ↓
Repository Port
  ↓
Repository Adapter (SQLite)
  ↓
Database
```

### Telnet Flow
```
Telnet Client
  ↓ TCP Socket
TelnetServer
  ↓
TelnetSession (Telnet Adapter)
  ↓
Use Case (Domain)  [SAME AS HTTP]
  ↓
Repository Port
  ↓
Repository Adapter (SQLite)  [SAME AS HTTP]
  ↓
Database
```

## Benefits of This Architecture

1. **No Code Duplication**: Business logic written once, used by all adapters
2. **Easy Testing**: Mock ports to test use cases in isolation
3. **Protocol Independence**: Domain doesn't care about HTTP vs telnet
4. **Easy Extension**: Add new adapters (WebSocket, CLI, etc.) without changing domain
5. **Clear Separation**: Infrastructure concerns separate from business logic
6. **Flexible**: Swap implementations (different database, different LLM provider)

## Current State

### Implemented
- ✅ Domain layer (entities, ports, use cases)
- ✅ HTTP adapter (controllers, routes)
- ✅ Telnet adapter (session, server)
- ✅ Repository adapters (SQLite)
- ✅ LLM adapters (OpenAI, Ollama)
- ✅ Tool adapters (Email, Sheets, Web Search, MCP)
- ✅ Encryption service
- ✅ Dependency injection container

### Frontend
- ✅ React components (Terminal, AgentChat, Settings)
- ✅ HTTP client integration
- ⚠️ Terminal menu integration (needs [A]gent Chat and [C]onfig options)

### Future Enhancements
- WebSocket adapter for real-time chat
- GraphQL adapter
- CLI adapter
- Different database adapters (PostgreSQL, MongoDB)

## Summary

**This is NOT a thin layer on telnet.** Instead, it's a **ports/adapters architecture** where:

- **Domain layer** = Core business logic (independent of protocols)
- **Telnet adapter** = One way to access the domain (telnet protocol)
- **HTTP adapter** = Another way to access the domain (REST API)
- **Both adapters** use the same domain use cases and repositories

The HTTP routes are **necessary** because the browser/Electron frontend needs HTTP, not telnet. Both interfaces are **equal** - neither is a "thin layer" on the other. They're parallel adapters to the same domain.

