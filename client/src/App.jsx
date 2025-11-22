import React, { useState, useEffect } from 'react'
import Terminal from './components/Terminal'
import ModemConnect from './components/ModemConnect'
import './styles/App.css'

function App() {
  const [isConnecting, setIsConnecting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  const handleConnectionComplete = () => {
    setIsConnecting(false)
    setIsConnected(true)
  }

  return (
    <div className="app">
      {isConnecting ? (
        <ModemConnect onComplete={handleConnectionComplete} />
      ) : (
        <Terminal />
      )}
    </div>
  )
}

export default App
