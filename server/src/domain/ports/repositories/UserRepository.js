class UserRepository {
  async getById(id) {
    throw new Error('getById must be implemented')
  }

  async getByHandle(handle) {
    throw new Error('getByHandle must be implemented')
  }

  async create(user) {
    throw new Error('create must be implemented')
  }

  async update(user) {
    throw new Error('update must be implemented')
  }
}

module.exports = UserRepository

