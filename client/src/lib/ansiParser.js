// ANSI escape code parser for terminal rendering
// Supports 16-color ANSI, cursor positioning, and CP437 characters

const ANSI_COLORS = {
  30: '#000000', 31: '#aa0000', 32: '#00aa00', 33: '#aa5500',
  34: '#0000aa', 35: '#aa00aa', 36: '#00aaaa', 37: '#aaaaaa',
  90: '#555555', 91: '#ff5555', 92: '#55ff55', 93: '#ffff55',
  94: '#5555ff', 95: '#ff55ff', 96: '#55ffff', 97: '#ffffff',
  40: '#000000', 41: '#aa0000', 42: '#00aa00', 43: '#aa5500',
  44: '#0000aa', 45: '#aa00aa', 46: '#00aaaa', 47: '#aaaaaa',
  100: '#555555', 101: '#ff5555', 102: '#55ff55', 103: '#ffff55',
  104: '#5555ff', 105: '#ff55ff', 106: '#55ffff', 107: '#ffffff'
}

export class ANSIParser {
  constructor() {
    this.reset()
  }

  reset() {
    this.fg = '#aaaaaa'
    this.bg = '#000000'
    this.bold = false
    this.blink = false
    this.cursorX = 0
    this.cursorY = 0
  }

  parseANSI(text) {
    const lines = []
    let currentLine = []
    let i = 0

    while (i < text.length) {
      if (text[i] === '\x1b' && text[i + 1] === '[') {
        // ANSI escape sequence
        let j = i + 2
        let code = ''

        while (j < text.length && text[j] !== 'm' && text[j] !== 'H' && text[j] !== 'J') {
          code += text[j]
          j++
        }

        const command = text[j]

        if (command === 'm') {
          // Color/style code
          this.handleColorCode(code)
        } else if (command === 'H') {
          // Cursor position
          this.handleCursorPosition(code)
        } else if (command === 'J') {
          // Clear screen
          if (code === '2') {
            lines.length = 0
            currentLine = []
          }
        }

        i = j + 1
      } else if (text[i] === '\n') {
        lines.push(currentLine)
        currentLine = []
        i++
      } else if (text[i] === '\r') {
        // Carriage return
        i++
      } else {
        // Regular character
        currentLine.push({
          char: text[i],
          fg: this.fg,
          bg: this.bg,
          bold: this.bold,
          blink: this.blink
        })
        i++
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine)
    }

    return lines
  }

  handleColorCode(code) {
    const codes = code.split(';').map(c => parseInt(c) || 0)

    for (const c of codes) {
      if (c === 0) {
        // Reset
        this.reset()
      } else if (c === 1) {
        // Bold
        this.bold = true
      } else if (c === 5) {
        // Blink
        this.blink = true
      } else if (c >= 30 && c <= 37) {
        // Foreground color
        this.fg = ANSI_COLORS[c]
      } else if (c >= 40 && c <= 47) {
        // Background color
        this.bg = ANSI_COLORS[c]
      } else if (c >= 90 && c <= 97) {
        // Bright foreground
        this.fg = ANSI_COLORS[c]
      } else if (c >= 100 && c <= 107) {
        // Bright background
        this.bg = ANSI_COLORS[c]
      }
    }
  }

  handleCursorPosition(code) {
    const parts = code.split(';')
    this.cursorY = parseInt(parts[0] || 1) - 1
    this.cursorX = parseInt(parts[1] || 1) - 1
  }
}

// Convert CP437 (DOS) characters to Unicode
export const CP437_MAP = {
  0x01: '☺', 0x02: '☻', 0x03: '♥', 0x04: '♦', 0x05: '♣', 0x06: '♠',
  0x07: '•', 0x08: '◘', 0x09: '○', 0x0B: '♂', 0x0C: '♀',
  0x0E: '♫', 0x0F: '☼', 0x10: '►', 0x11: '◄', 0x12: '↕', 0x13: '‼',
  0x14: '¶', 0x15: '§', 0x16: '▬', 0x17: '↨', 0x18: '↑', 0x19: '↓',
  0x1A: '→', 0x1B: '←', 0x1C: '∟', 0x1D: '↔', 0x1E: '▲', 0x1F: '▼',
  // Box drawing characters
  0xB0: '░', 0xB1: '▒', 0xB2: '▓', 0xB3: '│', 0xB4: '┤', 0xB5: '╡',
  0xB6: '╢', 0xB7: '╖', 0xB8: '╕', 0xB9: '╣', 0xBA: '║', 0xBB: '╗',
  0xBC: '╝', 0xBD: '╜', 0xBE: '╛', 0xBF: '┐', 0xC0: '└', 0xC1: '┴',
  0xC2: '┬', 0xC3: '├', 0xC4: '─', 0xC5: '┼', 0xC6: '╞', 0xC7: '╟',
  0xC8: '╚', 0xC9: '╔', 0xCA: '╩', 0xCB: '╦', 0xCC: '╠', 0xCD: '═',
  0xCE: '╬', 0xCF: '╧', 0xD0: '╨', 0xD1: '╤', 0xD2: '╥', 0xD3: '╙',
  0xD4: '╘', 0xD5: '╒', 0xD6: '╓', 0xD7: '╫', 0xD8: '╪', 0xD9: '┘',
  0xDA: '┌', 0xDB: '█', 0xDC: '▄', 0xDD: '▌', 0xDE: '▐', 0xDF: '▀'
}

export function convertCP437(char) {
  const code = char.charCodeAt(0)
  return CP437_MAP[code] || char
}
