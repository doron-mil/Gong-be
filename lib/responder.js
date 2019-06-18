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
  console.error(`responder.sendErrorResponse; ${pathClause}Error message: ${message} , Error : ${error}`);
  res.status(status)
    .json({
      ok: false,
      message,
      error,
      data: null,
    });
}

module.exports = {
  send200Response,
  sendErrorResponse,
};
