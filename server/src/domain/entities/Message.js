class Message {
  constructor({ id, boardId, threadId, parentId, fromUserId, toUser, subject, body, postedAt, readStatus }) {
    this.id = id
    this.boardId = boardId
    this.threadId = threadId
    this.parentId = parentId
    this.fromUserId = fromUserId
    this.toUser = toUser
    this.subject = subject
    this.body = body
    this.postedAt = postedAt
    this.readStatus = readStatus || 0
  }
}

module.exports = Message

