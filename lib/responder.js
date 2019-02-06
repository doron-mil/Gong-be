function send200Response(res, data) {
  res.json({
    ok: true,
    data,
  });
}

function sendErrorResponse(res, status, message, error) {
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
