class EmailTool {
  async sendEmail(params) {
    throw new Error('sendEmail must be implemented')
  }

  async readEmails(params) {
    throw new Error('readEmails must be implemented')
  }

  async listThreads(params) {
    throw new Error('listThreads must be implemented')
  }
}

module.exports = EmailTool

