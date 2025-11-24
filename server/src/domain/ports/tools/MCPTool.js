class MCPTool {
  async callTool(toolName, params) {
    throw new Error('callTool must be implemented')
  }

  async listTools() {
    throw new Error('listTools must be implemented')
  }
}

module.exports = MCPTool

