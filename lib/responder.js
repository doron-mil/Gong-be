const logger = require('./logger');

function send200Response(res, data) {
  res.json({
    ok: true,
    data,
  });
}

function sendErrorResponse(res, status, message, error, req) {
  let pathClause = '';
  if (req) {
    pathClause = `For path : ${req.path}; `;
  }
  logger.error(`responder.sendErrorResponse; ${pathClause}Error message: ${message} `, {error});
  res.status(status)
    .json({
      ok: false,
      message,
      error,
      additional_message: error ? error.message : '',
      data: null,
    });
}

module.exports = {
  send200Response,
  sendErrorResponse,
};
