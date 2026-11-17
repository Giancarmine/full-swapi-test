const { badRequest } = require("../utils/httpError");
const { USER_ID_MAX_LENGTH, isValidUserId } = require("../utils/userId");

const validateUserId = (req, _res, next) => {
  const raw = req.get("x-user-id");

  if (raw === undefined || raw === null || String(raw).trim() === "") {
    req.userId = "anonymous";
    return next();
  }

  const value = String(raw).trim();

  if (!isValidUserId(value)) {
    return next(
      badRequest(
        `X-User-Id must be 1-${USER_ID_MAX_LENGTH} characters using only letters, digits, ".", "_" or "-"`,
        "invalid_user_id"
      )
    );
  }

  req.userId = value;
  return next();
};

module.exports = {
  validateUserId,
};
