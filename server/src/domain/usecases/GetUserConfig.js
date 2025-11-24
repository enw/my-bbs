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
        // Check if the value looks encrypted (has the format: iv:authTag:encrypted)
        const isEncrypted = config.configValue.includes(':') && config.configValue.split(':').length === 3
        
        let decrypted
        if (isEncrypted) {
          decrypted = await this.encryptionService.decrypt(config.configValue)
        } else {
          // If not encrypted, try to parse as plain JSON (for non-sensitive configs)
          decrypted = config.configValue
        }
        
        result[config.configKey] = JSON.parse(decrypted)
      } catch (error) {
        // Log warning but continue - some configs might be corrupted
        console.warn(`Warning: Could not decrypt config ${config.configKey}, skipping. Error: ${error.message}`)
        result[config.configKey] = null
      }
    }

    return result
  }
}

module.exports = GetUserConfig

