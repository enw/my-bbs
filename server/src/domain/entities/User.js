class User {
  constructor({ id, handle, passwordHash, realName, location, phone, firstCall, lastCall, totalCalls, bytesUploaded, bytesDownloaded, messagesPosted, accessLevel, timeBank }) {
    this.id = id
    this.handle = handle
    this.passwordHash = passwordHash
    this.realName = realName
    this.location = location
    this.phone = phone
    this.firstCall = firstCall
    this.lastCall = lastCall
    this.totalCalls = totalCalls || 0
    this.bytesUploaded = bytesUploaded || 0
    this.bytesDownloaded = bytesDownloaded || 0
    this.messagesPosted = messagesPosted || 0
    this.accessLevel = accessLevel || 1
    this.timeBank = timeBank || 60
  }

  getRatio() {
    if (this.bytesUploaded > 0) {
      return (this.bytesDownloaded / this.bytesUploaded).toFixed(1)
    }
    return '∞'
  }

  toJSON() {
    return {
      id: this.id,
      handle: this.handle,
      realName: this.real_name,
      location: this.location,
      firstCall: this.first_call,
      lastCall: this.last_call,
      totalCalls: this.total_calls,
      bytesUploaded: this.bytes_uploaded,
      bytesDownloaded: this.bytes_downloaded,
      messagesPosted: this.messages_posted,
      ratio: this.getRatio()
    }
  }
}

module.exports = User

