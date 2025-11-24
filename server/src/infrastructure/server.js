const express = require('express')
const cors = require('cors')
const session = require('express-session')
const { createDatabase } = require('./database')
const createDependencyContainer = require('./dependencyContainer')
const createUserRoutes = require('../adapters/http/routes/userRoutes')
const createAgentRoutes = require('../adapters/http/routes/agentRoutes')
const createSettingsRoutes = require('../adapters/http/routes/settingsRoutes')
const createTelnetServer = require('../adapters/telnet/TelnetServer')

function createServer() {
  const app = express()
  const PORT = process.env.PORT || 3000
  const TELNET_PORT = process.env.TELNET_PORT || 2323

  // Database setup
  const db = createDatabase()

  // Dependency injection
  const container = createDependencyContainer(db)
  
  // Start telnet server (uses same use cases and repositories)
  const telnetServer = createTelnetServer(
    container.useCases,
    container.repositories,
    TELNET_PORT
  )

  // Middleware
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }))
  app.use(express.json())
  app.use(session({
    secret: 'retro-bbs-secret-1993',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 3600000 // 1 hour
    }
  }))

  // Root route - explain setup
  app.get('/', (req, res) => {
    res.json({
      message: 'Retro BBS API Server',
      info: 'This is the backend API server. The frontend is served on http://localhost:5173',
      endpoints: {
        health: '/api/health',
        users: '/api/users',
        agent: '/api/agent',
        settings: '/api/settings',
        boards: '/api/boards',
        files: '/api/files'
      },
      telnet: `telnet://localhost:${TELNET_PORT}`
    })
  })

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Retro BBS Server Running' })
  })

  // Legacy routes (boards and files - keeping for now)
  app.get('/api/boards', (req, res) => {
    const boards = db.prepare(`
      SELECT b.*, COUNT(m.id) as message_count
      FROM boards b
      LEFT JOIN messages m ON b.id = m.board_id
      GROUP BY b.id
      ORDER BY b.id
    `).all()
    res.json(boards)
  })

  app.get('/api/files/categories', (req, res) => {
    const categories = db.prepare(`
      SELECT c.*, COUNT(f.id) as file_count, COALESCE(SUM(f.size), 0) as total_size
      FROM file_categories c
      LEFT JOIN files f ON c.id = f.category_id
      GROUP BY c.id
      ORDER BY c.id
    `).all()
    res.json(categories)
  })

  app.get('/api/files/category/:id', (req, res) => {
    const files = db.prepare(`
      SELECT f.*, u.handle as uploader_handle
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE f.category_id = ?
      ORDER BY f.upload_date DESC
    `).all(req.params.id)
    res.json(files)
  })

  // User routes
  app.use('/api/users', createUserRoutes(container.controllers.userController))

  // Agent routes
  app.use('/api/agent', createAgentRoutes(container.controllers.agentController))

  // Settings routes
  app.use('/api/settings', createSettingsRoutes(container.controllers.settingsController))

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`Retro BBS HTTP Server running on http://localhost:${PORT}`)
  })

  // Return both servers for graceful shutdown
  return { httpServer: app, telnetServer }
}

module.exports = createServer

