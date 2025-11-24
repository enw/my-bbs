const createServer = require('./infrastructure/server')

// Start the server
const servers = createServer()

// Graceful shutdown handlers
let isShuttingDown = false

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return
  isShuttingDown = true
  
  console.log(`\n${signal} received. Shutting down gracefully...`)
  
  // Close telnet server connections first
  if (servers.telnetServer) {
    console.log('Closing telnet connections...')
    if (servers.telnetServer.closeAllConnections) {
      servers.telnetServer.closeAllConnections()
    }
    
    servers.telnetServer.close((err) => {
      if (err) {
        console.error('Error closing telnet server:', err)
      } else {
        console.log('Telnet server closed')
      }
    })
  }
  
  // Close HTTP server
  if (servers.httpServer && servers.httpServer.close) {
    servers.httpServer.close(() => {
      console.log('HTTP server closed')
      process.exit(0)
    })
    
    // Force exit after 5 seconds if servers don't close
    setTimeout(() => {
      console.error('Forced shutdown after timeout')
      process.exit(1)
    }, 5000)
  } else {
    process.exit(0)
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('unhandledRejection')
})

module.exports = createServer
