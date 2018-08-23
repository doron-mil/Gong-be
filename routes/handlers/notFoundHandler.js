function notFoundHandler(req, res, next) {
  const err = new Error('resource not found');

  err.userSafeMessage = 'resource not found';
  err.httpStatusCode = 404;

  next(err);
}

module.exports = notFoundHandler;
