const crypto = require('crypto')
const EncryptionService = require('../../domain/ports/encryption/EncryptionService')

class CryptoEncryptionService extends EncryptionService {
  constructor(encryptionKey) {
    super()
    // Use environment variable or default (in production, MUST use env var)
    this.algorithm = 'aes-256-gcm'
    this.key = encryptionKey || process.env.ENCRYPTION_KEY || this._generateDefaultKey()
    
    // Ensure key is 32 bytes for AES-256
    if (this.key.length !== 32) {
      this.key = crypto.createHash('sha256').update(this.key).digest()
    }
  }

  async encrypt(plaintext) {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Return IV + authTag + encrypted data as hex strings
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  }

  async decrypt(ciphertext) {
    const parts = ciphertext.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  _generateDefaultKey() {
    // Generate a default key (WARNING: Not secure for production!)
    // In production, this should always come from environment variable
    console.warn('WARNING: Using default encryption key. Set ENCRYPTION_KEY environment variable in production!')
    return crypto.randomBytes(32)
  }
}

module.exports = CryptoEncryptionService

