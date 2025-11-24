class GetUserConfig {
  constructor(userConfigRepository, encryptionService) {
    this.userConfigRepository = userConfigRepository
    this.encryptionService = encryptionService
  }

  async execute(userId) {
    const configs = await this.userConfigRepository.getByUserId(userId)
    const result = {}

    for (const config of configs) {
      try {
        const decrypted = await this.encryptionService.decrypt(config.configValue)
        result[config.configKey] = JSON.parse(decrypted)
      } catch (error) {
        console.error(`Error decrypting config ${config.configKey}:`, error)
        result[config.configKey] = null
      }
    }

    return result
  }
}

module.exports = GetUserConfig

