const responder = require('../../lib/responder');
const logger = require('../../lib/logger');

function errorHandler(err, req, res, next) {
  const httpStatusCode = err.httpStatusCode || 500;
  const userSafeMessage = err.userSafeMessage || 'server error';

  const loggerLevel = httpStatusCode === 500 ? 'error' : 'verbose';

  logger.log(loggerLevel, err.message);
  responder.sendErrorResponse(res, httpStatusCode, userSafeMessage);
}

module.exports = errorHandler;
