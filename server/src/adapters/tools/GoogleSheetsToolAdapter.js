const GoogleSheetsTool = require('../../domain/ports/tools/GoogleSheetsTool')
const { google } = require('googleapis')

class GoogleSheetsToolAdapter extends GoogleSheetsTool {
  async readSheet({ spreadsheetId, range, accessToken }) {
    if (!accessToken) {
      throw new Error('Google access token required')
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    })

    return {
      values: response.data.values || [],
      range: response.data.range
    }
  }

  async writeSheet({ spreadsheetId, range, values, accessToken }) {
    if (!accessToken) {
      throw new Error('Google access token required')
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: values
      }
    })

    return {
      success: true,
      updatedCells: response.data.updatedCells,
      updatedRange: response.data.updatedRange
    }
  }

  async createSheet({ title, accessToken }) {
    if (!accessToken) {
      throw new Error('Google access token required')
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: title
        }
      }
    })

    return {
      spreadsheetId: response.data.spreadsheetId,
      spreadsheetUrl: response.data.spreadsheetUrl
    }
  }
}

module.exports = GoogleSheetsToolAdapter

