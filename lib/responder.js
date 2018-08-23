function send200Response(res, data) {
  res.json({
    ok: true,
    data,
  });
}

function sendErrorResponse(res, status, message) {
  res.status(status)
    .json({
      ok: false,
      error: message,
      data: null,
    });
}

module.exports = {
  send200Response,
  sendErrorResponse,
};
