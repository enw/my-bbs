class LoginUser {
  constructor(userRepository) {
    this.userRepository = userRepository
  }

  async execute({ handle, password }) {
    const user = await this.userRepository.getByHandle(handle)

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Validate password (temporarily using plain text comparison)
    const valid = (password === user.passwordHash) // TODO: await bcrypt.compare(password, user.passwordHash)

    if (!valid) {
      throw new Error('Invalid credentials')
    }

    // Update last call and total calls
    user.lastCall = new Date().toISOString()
    user.totalCalls = (user.totalCalls || 0) + 1
    await this.userRepository.update(user)

    return user
  }
}

module.exports = LoginUser

