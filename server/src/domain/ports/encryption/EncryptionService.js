class EncryptionService {
  async encrypt(plaintext) {
    throw new Error('encrypt must be implemented')
  }

  async decrypt(ciphertext) {
    throw new Error('decrypt must be implemented')
  }
}

module.exports = EncryptionService

