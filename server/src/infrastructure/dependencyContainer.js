const SqliteUserRepository = require('../adapters/repositories/SqliteUserRepository')
const SqliteMessageRepository = require('../adapters/repositories/SqliteMessageRepository')
const SqliteFileRepository = require('../adapters/repositories/SqliteFileRepository')
const RegisterUser = require('../domain/usecases/RegisterUser')
const LoginUser = require('../domain/usecases/LoginUser')
const GetUserStats = require('../domain/usecases/GetUserStats')
const UserController = require('../adapters/http/controllers/UserController')

function createDependencyContainer(db) {
  // Repositories
  const userRepository = new SqliteUserRepository(db)
  const messageRepository = new SqliteMessageRepository(db)
  const fileRepository = new SqliteFileRepository(db)

  // Use cases
  const registerUser = new RegisterUser(userRepository)
  const loginUser = new LoginUser(userRepository)
  const getUserStats = new GetUserStats(userRepository)

  // Controllers
  const userController = new UserController(registerUser, loginUser, getUserStats)

  return {
    repositories: {
      userRepository,
      messageRepository,
      fileRepository
    },
    useCases: {
      registerUser,
      loginUser,
      getUserStats
    },
    controllers: {
      userController
    }
  }
}

module.exports = createDependencyContainer

