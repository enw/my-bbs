// Connection Manager - Detects server availability and manages connection mode
// Falls back to browser-only mode if server unavailable

import { initBrowserDB, getBrowserDB } from './browserDB'
import { BBSEngine } from './bbsEngine'

let connectionMode = null // 'server' or 'browser'
let browserDB = null
let bbsEngine = null

export async function initConnection() {
  // Try to detect server first
  let serverAvailable = false
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // Short timeout for quick detection
      signal: AbortSignal.timeout(2000)
    })
    
    if (response.ok) {
      serverAvailable = true
      connectionMode = 'server'
      console.log('Server mode: Connected to backend API')
      // Still initialize browser DB as fallback
      try {
        browserDB = await initBrowserDB()
      } catch (error) {
        console.warn('Browser DB initialization failed, but server is available:', error.message)
      }
      return { mode: 'server', db: null, engine: null }
    }
  } catch (error) {
    // Server unavailable, will use browser mode
    console.log('Server unavailable, using browser-only mode:', error.message)
  }
  
  // Server not available, use browser mode
  // Initialize browser DB (required for browser mode)
  try {
    browserDB = await initBrowserDB()
    connectionMode = 'browser'
    console.log('Browser mode: Using local SQL.js database')
    return { mode: 'browser', db: browserDB, engine: null }
  } catch (error) {
    console.error('Failed to initialize browser database:', error)
    throw new Error('Failed to initialize database. Both server and browser modes failed.')
  }
}

export function getMode() {
  return connectionMode
}

export function getDB() {
  if (connectionMode === 'browser') {
    return getBrowserDB()
  }
  // In server mode, database is on server
  return null
}

export function createBBSEngine(onOutput, onLogoff) {
  // For now, always use browser mode (server mode would need API integration)
  // Browser DB should be initialized by now (either as primary or fallback)
  if (!browserDB) {
    throw new Error('Browser database not initialized. Call initConnection() first.')
  }
  
  bbsEngine = new BBSEngine(browserDB, onOutput)
  if (onLogoff) {
    bbsEngine.onLogoff = onLogoff
  }
  return bbsEngine
}

export function getBBSEngine() {
  return bbsEngine
}

// Check if we should use server API for a specific operation
export function shouldUseServerAPI() {
  return connectionMode === 'server'
}

// Make API call to server (if available)
export async function apiCall(endpoint, options = {}) {
  if (connectionMode === 'server') {
    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      return await response.json()
    } catch (error) {
      console.error('API call failed:', error)
      // Fallback to browser mode?
      return null
    }
  }
  return null
}

