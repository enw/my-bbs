class File {
  constructor({ id, categoryId, filename, description, uploaderId, uploadDate, size, downloadCount, validated }) {
    this.id = id
    this.categoryId = categoryId
    this.filename = filename
    this.description = description
    this.uploaderId = uploaderId
    this.uploadDate = uploadDate
    this.size = size
    this.downloadCount = downloadCount || 0
    this.validated = validated || 0
  }
}

module.exports = File

