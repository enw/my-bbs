const User = require('../entities/User')

class RegisterUser {
  constructor(userRepository) {
    this.userRepository = userRepository
  }

  async execute({ handle, password, realName, location, phone }) {
    // Check if handle exists
    const existing = await this.userRepository.getByHandle(handle)
    if (existing) {
      throw new Error('Handle already taken')
    }

    // Hash password (temporarily using plain text for testing)
    const passwordHash = password // TODO: await bcrypt.hash(password, 10)

    // Create user entity
    const user = new User({
      handle,
      passwordHash,
      realName,
      location,
      phone,
      firstCall: new Date().toISOString(),
      lastCall: new Date().toISOString(),
      totalCalls: 0
    })

    // Save to repository
    const createdUser = await this.userRepository.create(user)
    return createdUser
  }
}

module.exports = RegisterUser

