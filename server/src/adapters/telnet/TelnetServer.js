const net = require('net')
const TelnetSession = require('./TelnetSession')

function createTelnetServer(useCases, repositories, port = 2323) {
  const activeSessions = new Set()
  
  const server = net.createServer((socket) => {
    console.log(`New telnet connection from ${socket.remoteAddress}`)
    const session = new TelnetSession(socket, useCases, repositories)
    activeSessions.add(session)
    
    socket.on('close', () => {
      activeSessions.delete(session)
    })
  })
  
  server.listen(port, () => {
    console.log(`Telnet BBS server listening on port ${port}`)
    console.log(`Connect with: telnet localhost ${port}`)
    console.log(`Or use netcat: nc localhost ${port}`)
  })
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Telnet server error: Port ${port} is already in use.`)
      console.error('This usually means the previous server instance is still running.')
      console.error('Try: lsof -ti:2323 | xargs kill -9')
      // Don't throw - let the process handle it
    } else {
      console.error('Telnet server error:', err)
    }
  })
  
  // Store active sessions for graceful shutdown
  server.getActiveSessions = () => activeSessions.size
  server.closeAllConnections = () => {
    activeSessions.forEach(session => {
      if (session.socket && !session.socket.destroyed) {
        session.socket.destroy()
      }
    })
    activeSessions.clear()
  }
  
  return server
}

module.exports = createTelnetServer

