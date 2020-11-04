const expressJwt = require('express-jwt');
const moment = require('moment');

const utilsManager = require('../lib/utilsManager');
const responder = require('../lib/responder');

const secretCallback = (req, payload, done) => {
  const { sub } = payload;
  let foundSecret;
  if (sub) {
    const authUser = utilsManager.usersMap.get(sub.toLowerCase());
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
      console.log('Authorization Entry point. Req( method ,path ,time) :', req.path,
        ' , ', req.method, ' , ', moment().format('HH:mm:ss:ms'));
      next();
    },
    // authenticate JWT token and attach user to request object (req.user)
    expressJwt({
      secret: secretCallback,
      algorithms: ['HS256'],
    })
      .unless({ path: ['/login', '/nextgong', '/api/login', '/api/nextgong'] }),

    // authorize based on user role
    (err, req, res, next) => {
      if (err) {
        responder.sendErrorResponse(res, err.httpStatusCode || 500, 'invalid token ', err, req);
        return err;
      }
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
