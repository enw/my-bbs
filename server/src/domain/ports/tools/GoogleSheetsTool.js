class GoogleSheetsTool {
  async readSheet(params) {
    throw new Error('readSheet must be implemented')
  }

  async writeSheet(params) {
    throw new Error('writeSheet must be implemented')
  }

  async createSheet(params) {
    throw new Error('createSheet must be implemented')
  }
}

module.exports = GoogleSheetsTool

