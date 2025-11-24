const MCPTool = require('../../domain/ports/tools/MCPTool')

class MCPToolAdapter extends MCPTool {
  constructor(baseUrl = 'http://localhost:3001') {
    super()
    this.baseUrl = baseUrl
  }

  async callTool(toolName, params) {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error(`MCP server error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`MCP tool call error for ${toolName}:`, error)
      throw new Error(`Failed to call MCP tool ${toolName}: ${error.message}`)
    }
  }

  async listTools() {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/tools`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`MCP server error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('MCP list tools error:', error)
      return []
    }
  }
}

module.exports = MCPToolAdapter

