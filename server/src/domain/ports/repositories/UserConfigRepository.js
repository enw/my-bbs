class UserConfigRepository {
  async getByUserId(userId) {
    throw new Error('getByUserId must be implemented')
  }

  async getByKey(userId, configKey) {
    throw new Error('getByKey must be implemented')
  }

  async save(config) {
    throw new Error('save must be implemented')
  }

  async delete(userId, configKey) {
    throw new Error('delete must be implemented')
  }
}

module.exports = UserConfigRepository

