class FileRepository {
  async getByCategory(categoryId) {
    throw new Error('getByCategory must be implemented')
  }

  async getById(id) {
    throw new Error('getById must be implemented')
  }

  async create(file) {
    throw new Error('create must be implemented')
  }
}

module.exports = FileRepository

