const { badRequest } = require("../utils/httpError");

const validateIdParam =
  (paramName = "id") =>
  (req, _res, next) => {
    const value = req.params[paramName];
    if (!/^[1-9]\d*$/.test(String(value || ""))) {
      return next(badRequest(`Invalid ${paramName} parameter`));
    }
    return next();
  };

module.exports = {
  validateIdParam,
};
