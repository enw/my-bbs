const WebSearchTool = require('../../domain/ports/tools/WebSearchTool')

class DuckDuckGoWebSearchTool extends WebSearchTool {
  async search(query, options = {}) {
    try {
      const results = []
      
      // Use DuckDuckGo Instant Answer API for quick facts
      try {
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        const data = await response.json()

        // Add instant answer if available
        if (data.AbstractText) {
          results.push({
            title: data.Heading || query,
            snippet: data.AbstractText,
            url: data.AbstractURL,
            source: 'DuckDuckGo Instant Answer'
          })
        }

        // Add definition if available
        if (data.Definition) {
          results.push({
            title: data.DefinitionHeading || 'Definition',
            snippet: data.Definition,
            url: data.DefinitionURL,
            source: 'DuckDuckGo Definition'
          })
        }

        // Add related topics
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          data.RelatedTopics.slice(0, 5).forEach(topic => {
            if (topic.Text) {
              results.push({
                title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
                snippet: topic.Text,
                source: 'DuckDuckGo Related Topic'
              })
            }
          })
        }
      } catch (apiError) {
        console.error('DuckDuckGo API error:', apiError)
      }

      // Use DuckDuckGo HTML search for more results
      try {
        const webResponse = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        const html = await webResponse.text()
        
        // Simple regex-based extraction (basic but works for most cases)
        // Look for result links in the HTML
        const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi
        const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/gi
        
        const links = []
        let linkMatch
        while ((linkMatch = linkRegex.exec(html)) !== null && links.length < 10) {
          links.push({
            url: linkMatch[1],
            title: linkMatch[2].trim()
          })
        }
        
        const snippets = []
        let snippetMatch
        while ((snippetMatch = snippetRegex.exec(html)) !== null && snippets.length < 10) {
          snippets.push(snippetMatch[1].trim())
        }
        
        // Combine links and snippets
        for (let i = 0; i < Math.min(links.length, snippets.length); i++) {
          if (links[i] && snippets[i]) {
            results.push({
              title: links[i].title,
              snippet: snippets[i],
              url: links[i].url,
              source: 'DuckDuckGo Web Search'
            })
          }
        }
      } catch (htmlError) {
        console.error('DuckDuckGo HTML search error:', htmlError)
      }

      // If no results, return a helpful message
      if (results.length === 0) {
        return {
          query: query,
          results: [{
            title: 'No results found',
            snippet: `No search results found for "${query}". Try rephrasing your query or using more specific terms.`,
            source: 'System'
          }]
        }
      }

      return {
        query: query,
        results: results.slice(0, options.maxResults || 10)
      }
    } catch (error) {
      console.error('Web search error:', error)
      return {
        query: query,
        results: [{
          title: 'Search Error',
          snippet: `Error searching for "${query}": ${error.message}`,
          source: 'System'
        }],
        error: error.message
      }
    }
  }
}

module.exports = DuckDuckGoWebSearchTool

