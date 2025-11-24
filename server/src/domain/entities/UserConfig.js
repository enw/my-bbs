class UserConfig {
  constructor({ id, userId, configKey, configValue, createdAt, updatedAt }) {
    this.id = id
    this.userId = userId
    this.configKey = configKey
    this.configValue = configValue // Encrypted JSON string
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

module.exports = UserConfig

