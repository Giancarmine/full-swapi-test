const { validateUserId } = require("../../src/middleware/validateUserId");

const makeReq = (header) => ({
  get: (name) => (name.toLowerCase() === "x-user-id" ? header : undefined),
});

describe("validateUserId middleware", () => {
  it("defaults to anonymous when the header is missing", () => {
    const req = makeReq(undefined);
    const next = jest.fn();

    validateUserId(req, {}, next);

    expect(req.userId).toBe("anonymous");
    expect(next).toHaveBeenCalledWith();
  });

  it("defaults to anonymous when the header is blank", () => {
    const req = makeReq("   ");
    const next = jest.fn();

    validateUserId(req, {}, next);

    expect(req.userId).toBe("anonymous");
    expect(next).toHaveBeenCalledWith();
  });

  it("accepts a valid user id and trims surrounding whitespace", () => {
    const req = makeReq("  demo-user.1_test  ");
    const next = jest.fn();

    validateUserId(req, {}, next);

    expect(req.userId).toBe("demo-user.1_test");
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects user ids with disallowed characters", () => {
    const req = makeReq("user id");
    const next = jest.fn();

    validateUserId(req, {}, next);

    expect(req.userId).toBeUndefined();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 400, code: "invalid_user_id" })
    );
  });

  it("rejects user ids longer than 64 characters", () => {
    const req = makeReq("a".repeat(65));
    const next = jest.fn();

    validateUserId(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 400, code: "invalid_user_id" })
    );
  });
});
