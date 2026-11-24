const path = require("path");
const {
  DEFAULT_MAX_USERS,
  DEFAULT_MAX_ITEMS,
  positiveInt,
  maxUsers,
  maxItems,
  getDataFile,
  getDbFile,
  shouldPersist,
} = require("../../src/utils/favoritesConfig");

describe("favoritesConfig", () => {
  const original = {};

  beforeEach(() => {
    for (const key of [
      "FAVORITES_MAX_USERS",
      "FAVORITES_MAX_ITEMS",
      "FAVORITES_DATA_FILE",
      "FAVORITES_DB_FILE",
      "FAVORITES_PERSIST",
      "NODE_ENV",
    ]) {
      original[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("validates positive integers with a fallback", () => {
    expect(positiveInt("42", 7)).toBe(42);
    expect(positiveInt("0", 7)).toBe(7);
    expect(positiveInt("-1", 7)).toBe(7);
    expect(positiveInt("1.5", 7)).toBe(7);
    expect(positiveInt("abc", 7)).toBe(7);
  });

  it("reads capacity limits from the environment", () => {
    expect(maxUsers()).toBe(DEFAULT_MAX_USERS);
    expect(maxItems()).toBe(DEFAULT_MAX_ITEMS);
    process.env.FAVORITES_MAX_USERS = "3";
    process.env.FAVORITES_MAX_ITEMS = "5";
    expect(maxUsers()).toBe(3);
    expect(maxItems()).toBe(5);
  });

  it("resolves default and overridden data files", () => {
    expect(getDataFile()).toBe(path.join(__dirname, "..", "..", "data", "favorites.json"));
    process.env.FAVORITES_DATA_FILE = "/tmp/custom.json";
    expect(getDataFile()).toBe("/tmp/custom.json");
  });

  it("resolves default and overridden sqlite files", () => {
    expect(getDbFile()).toMatch(/data[/\\]favorites\.db$/);
    process.env.FAVORITES_DB_FILE = "/tmp/custom.db";
    expect(getDbFile()).toBe("/tmp/custom.db");
  });

  it("derives persistence from NODE_ENV unless explicitly overridden", () => {
    expect(shouldPersist()).toBe(true);
    process.env.NODE_ENV = "test";
    expect(shouldPersist()).toBe(false);
    process.env.FAVORITES_PERSIST = "true";
    expect(shouldPersist()).toBe(true);
    process.env.FAVORITES_PERSIST = "false";
    expect(shouldPersist()).toBe(false);
  });
});
