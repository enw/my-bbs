import React, { useState, useEffect } from 'react'
import '../styles/ModemConnect.css'

const ModemConnect = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  const [displayText, setDisplayText] = useState([])

  const stages = [
    { text: 'ATZ', delay: 300 },
    { text: 'OK', delay: 500 },
    { text: 'ATDT5551234', delay: 800 },
    { text: '', delay: 500 },
    { text: 'CONNECT 14400', delay: 1000 },
    { text: '', delay: 500 }
  ]

  useEffect(() => {
    // Play modem sound
    playModemSound()

    const timer = setTimeout(() => {
      if (stage < stages.length) {
        if (stages[stage].text) {
          setDisplayText(prev => [...prev, stages[stage].text])
        }
        setStage(stage + 1)
      } else {
        setTimeout(onComplete, 500)
      }
    }, stages[stage]?.delay || 500)

    return () => clearTimeout(timer)
  }, [stage])

  const playModemSound = () => {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 1800
    oscillator.type = 'square'
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 1)
  }

  return (
    <div className="modem-connect">
      <div className="modem-display">
        {displayText.map((text, i) => (
          <div key={i} className="modem-line">{text}</div>
        ))}
        {stage < stages.length && <span className="cursor">_</span>}
      </div>
    </div>
  )
}

export default ModemConnect
