const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const utilsManager = require('../lib/utilsManager');

async function authenticatePassword(aPassword, aUserConfig) {
  return bcrypt.compare(aPassword, aUserConfig.encodedPasswd);
}

async function authenticate({ username, password }) {
  if (username && password) {
    const userConfig = utilsManager.usersMap.get(username.toLowerCase());
    if (userConfig) {
      const retToken = await authenticatePassword(password, userConfig)
        .then((res) => {
          if (res === true) {
            const token = jwt.sign({
              sub: userConfig.id,
              role: userConfig.role,
            }, userConfig.tokenSecret, { expiresIn: 60 * 20 });
            // console.log( 'Decoded token :' , jwt.verify(token, userConfig.tokenSecret))
            return token;
          }
          return null;
        })
        .catch(() => null);
      return retToken;
    }
  }
  return null;
}

// function decode() {
//   console.log('111111', bcrypt.hashSync('adminGong', 10));
//   console.log('222222', bcrypt.hashSync('teacherGong', 10));
// }
// module.exports = decode;

module.exports = authenticate;
