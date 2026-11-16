class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const badRequest = (message = "Invalid request", code = "bad_request") =>
  new HttpError(400, message, code);

const notFound = (message = "Not found", code = "not_found") => new HttpError(404, message, code);

const tooManyRequests = (message = "Rate limit exceeded", code = "rate_limited") =>
  new HttpError(429, message, code);

module.exports = {
  HttpError,
  badRequest,
  notFound,
  tooManyRequests,
};
