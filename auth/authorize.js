const expressJwt = require('express-jwt');
const authConfig = require('./authConfig');

const secretCallback = (req, payload, done) => {
  const { role } = payload;
  let foundSecret;
  if (role) {
    const authUser = authConfig.get(role);
    if (authUser) {
      foundSecret = authUser.tokenSecret;
      done(null, foundSecret);
    }
  }
  if (!foundSecret) {
    done(new Error('missing_secret'));
  }
};


function authorize(roles = []) {
  let rolesArray = roles;
  if (typeof roles === 'string') {
    rolesArray = [roles];
  }

  return [
    // For Debugging
    (req, res, next) => {
      console.log('Authorization Entry point. Req( method ,path ) :', req.path, ' , ', req.method);
      next();
    },
    // authenticate JWT token and attach user to request object (req.user)
    expressJwt({ secret: secretCallback })
      .unless({ path: ['/login', '/nextgong'] }),

    // authorize based on user role
    (req, res, next) => {
      if (rolesArray.length && !rolesArray.includes(req.user.role)) {
        // user's role is not authorized
        return res.status(401)
          .json({ message: 'Unauthorized' });
      }

      // authentication and authorization successful
      next();
      return null;
    },
  ];
}

module.exports = authorize;
