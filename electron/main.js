const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let serverProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Retro BBS',
    icon: path.join(__dirname, '../assets/icon.png'),
    focusable: true
  })
  
  // Ensure window can receive keyboard input
  mainWindow.setFocusable(true)

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  
  // Ensure window gets focus when shown
  mainWindow.once('ready-to-show', () => {
    mainWindow.focus()
    mainWindow.show()
  })
}

function startServer() {
  const serverPath = path.join(__dirname, '../server/src/index.js')
  serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit'
  })

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err)
  })
}

app.whenReady().then(() => {
  // Only start server in production mode
  // In development, the electron:dev script handles server startup
  if (process.env.NODE_ENV !== 'development') {
    startServer()
  }

  // Give server time to start (only needed in production)
  const delay = process.env.NODE_ENV === 'development' ? 0 : 2000
  setTimeout(() => {
    createWindow()
  }, delay)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})
