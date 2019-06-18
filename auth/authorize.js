const expressJwt = require('express-jwt');
const authConfig = require('./authConfig');
const responder = require('../lib/responder');
const moment = require('moment');

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
      console.log('Authorization Entry point. Req( method ,path ,time) :', req.path,
        ' , ', req.method, ' , ', moment().format('HH:mm:ss:ms'));
      next();
    },
    // authenticate JWT token and attach user to request object (req.user)
    expressJwt({ secret: secretCallback })
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
