const WebSearchTool = require('../../domain/ports/tools/WebSearchTool')

class DuckDuckGoWebSearchTool extends WebSearchTool {
  async search(query, options = {}) {
    try {
      // Use DuckDuckGo Instant Answer API
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`)
      const data = await response.json()

      // Also try a web search via DuckDuckGo HTML (simple scraping)
      // For a more robust solution, you'd use a proper search API
      const webResponse = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`)
      const html = await webResponse.text()

      // Extract results (simplified - in production use a proper HTML parser)
      const results = []

      // Add instant answer if available
      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL,
          source: 'DuckDuckGo Instant Answer'
        })
      }

      // Add related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        data.RelatedTopics.slice(0, 5).forEach(topic => {
          if (topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0],
              snippet: topic.Text,
              source: 'DuckDuckGo'
            })
          }
        })
      }

      return {
        query: query,
        results: results.slice(0, options.maxResults || 10)
      }
    } catch (error) {
      console.error('Web search error:', error)
      return {
        query: query,
        results: [],
        error: error.message
      }
    }
  }
}

module.exports = DuckDuckGoWebSearchTool

