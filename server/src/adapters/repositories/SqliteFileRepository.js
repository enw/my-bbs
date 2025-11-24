const FileRepository = require('../../domain/ports/repositories/FileRepository')
const File = require('../../domain/entities/File')

class SqliteFileRepository extends FileRepository {
  constructor(db) {
    super()
    this.db = db
  }

  async getByCategory(categoryId) {
    const rows = this.db.prepare(`
      SELECT f.*, u.handle as uploader_handle
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE f.category_id = ?
      ORDER BY f.upload_date DESC
    `).all(categoryId)
    return rows.map(row => this._mapRowToFile(row))
  }

  async getById(id) {
    const row = this.db.prepare('SELECT * FROM files WHERE id = ?').get(id)
    if (!row) return null
    return this._mapRowToFile(row)
  }

  async create(file) {
    const stmt = this.db.prepare(`
      INSERT INTO files (category_id, filename, description, uploader_id, upload_date, size, download_count, validated)
      VALUES (?, ?, ?, ?, datetime('now'), ?, 0, 0)
    `)
    const result = stmt.run(
      file.categoryId,
      file.filename,
      file.description,
      file.uploaderId,
      file.size
    )
    return this.getById(result.lastInsertRowid)
  }

  _mapRowToFile(row) {
    return new File({
      id: row.id,
      categoryId: row.category_id,
      filename: row.filename,
      description: row.description,
      uploaderId: row.uploader_id,
      uploadDate: row.upload_date,
      size: row.size,
      downloadCount: row.download_count,
      validated: row.validated
    })
  }
}

module.exports = SqliteFileRepository

