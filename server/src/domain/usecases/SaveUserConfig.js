class SaveUserConfig {
  constructor(userConfigRepository, encryptionService) {
    this.userConfigRepository = userConfigRepository
    this.encryptionService = encryptionService
  }

  async execute(userId, configKey, configValue) {
    // Encrypt the config value
    const encrypted = await this.encryptionService.encrypt(JSON.stringify(configValue))

    const config = {
      userId,
      configKey,
      configValue: encrypted,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await this.userConfigRepository.save(config)
  }
}

module.exports = SaveUserConfig

