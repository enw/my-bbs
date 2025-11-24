class MessageRepository {
  async getByBoard(boardId) {
    throw new Error('getByBoard must be implemented')
  }

  async getById(id) {
    throw new Error('getById must be implemented')
  }

  async create(message) {
    throw new Error('create must be implemented')
  }
}

module.exports = MessageRepository

