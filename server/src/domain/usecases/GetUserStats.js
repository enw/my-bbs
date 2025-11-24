class GetUserStats {
  constructor(userRepository) {
    this.userRepository = userRepository
  }

  async execute(userId) {
    const user = await this.userRepository.getById(userId)

    if (!user) {
      throw new Error('User not found')
    }

    return {
      handle: user.handle,
      realName: user.realName,
      location: user.location,
      firstCall: user.firstCall,
      lastCall: user.lastCall,
      totalCalls: user.totalCalls,
      bytesUploaded: user.bytesUploaded,
      bytesDownloaded: user.bytesDownloaded,
      messagesPosted: user.messagesPosted,
      ratio: user.getRatio()
    }
  }
}

module.exports = GetUserStats

