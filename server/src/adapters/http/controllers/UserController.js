class UserController {
  constructor(registerUser, loginUser, getUserStats) {
    this.registerUser = registerUser
    this.loginUser = loginUser
    this.getUserStats = getUserStats
  }

  async register(req, res) {
    try {
      const { handle, password, realName, location, phone } = req.body
      const user = await this.registerUser.execute({ handle, password, realName, location, phone })

      req.session.userId = user.id
      req.session.handle = user.handle

      res.json({
        success: true,
        user: { id: user.id, handle: user.handle }
      })
    } catch (error) {
      if (error.message === 'Handle already taken') {
        return res.status(400).json({ error: error.message })
      }
      console.error('Registration error:', error)
      res.status(500).json({ error: 'Registration failed' })
    }
  }

  async login(req, res) {
    try {
      const { handle, password } = req.body
      const user = await this.loginUser.execute({ handle, password })

      req.session.userId = user.id
      req.session.handle = user.handle

      res.json({
        success: true,
        user: {
          id: user.id,
          handle: user.handle,
          realName: user.realName,
          location: user.location
        }
      })
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message })
      }
      console.error('Login error:', error)
      res.status(500).json({ error: 'Login failed' })
    }
  }

  async getStats(req, res) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const stats = await this.getUserStats.execute(req.session.userId)
      res.json(stats)
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message })
      }
      console.error('Get stats error:', error)
      res.status(500).json({ error: 'Failed to get stats' })
    }
  }
}

module.exports = UserController

