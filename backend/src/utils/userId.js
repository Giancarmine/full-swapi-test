const USER_ID_MAX_LENGTH = 64;
const USER_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

const isValidUserId = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= USER_ID_MAX_LENGTH &&
  USER_ID_PATTERN.test(value);

module.exports = {
  USER_ID_MAX_LENGTH,
  USER_ID_PATTERN,
  isValidUserId,
};
