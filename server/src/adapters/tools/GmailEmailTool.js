const EmailTool = require('../../domain/ports/tools/EmailTool')
const { google } = require('googleapis')

class GmailEmailTool extends EmailTool {
  async sendEmail({ to, subject, body, accessToken }) {
    if (!accessToken) {
      throw new Error('Google access token required')
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Create email message
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n')

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    })

    return {
      success: true,
      messageId: response.data.id
    }
  }

  async readEmails({ maxResults = 10, accessToken }) {
    if (!accessToken) {
      throw new Error('Google access token required')
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults
    })

    const messages = []
    for (const message of response.data.messages || []) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id
      })
      messages.push({
        id: fullMessage.data.id,
        subject: this._getHeader(fullMessage.data.payload.headers, 'Subject'),
        from: this._getHeader(fullMessage.data.payload.headers, 'From'),
        snippet: fullMessage.data.snippet
      })
    }

    return messages
  }

  async listThreads({ maxResults = 10, accessToken }) {
    if (!accessToken) {
      throw new Error('Google access token required')
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const response = await gmail.users.threads.list({
      userId: 'me',
      maxResults: maxResults
    })

    return response.data.threads || []
  }

  _getHeader(headers, name) {
    const header = headers.find(h => h.name === name)
    return header ? header.value : ''
  }
}

module.exports = GmailEmailTool

