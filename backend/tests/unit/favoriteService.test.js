const fs = require("fs");
const os = require("os");
const path = require("path");

describe("favoriteService", () => {
  let favoriteService;

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.FAVORITES_PERSIST = "false";
    delete process.env.FAVORITES_DATA_FILE;
    delete process.env.FAVORITES_MAX_USERS;
    delete process.env.FAVORITES_MAX_ITEMS;
    jest.resetModules();
    favoriteService = require("../../src/services/favoriteService");
    favoriteService._resetForTests();
  });

  afterEach(() => {
    delete process.env.FAVORITES_PERSIST;
    delete process.env.FAVORITES_DATA_FILE;
    delete process.env.FAVORITES_MAX_USERS;
    delete process.env.FAVORITES_MAX_ITEMS;
    jest.restoreAllMocks();
  });

  it("adds and lists favorite films per user", () => {
    expect(favoriteService.getFavoriteFilms("u1")).toEqual([]);
    expect(favoriteService.addFavoriteFilm(1, "u1")).toEqual(["1"]);
    expect(favoriteService.getFavoriteFilms("u1")).toEqual(["1"]);
    expect(favoriteService.getFavoriteFilms("u2")).toEqual([]);
  });

  it("removes favorite films and reports existence", () => {
    favoriteService.addFavoriteFilm("2", "u1");
    expect(favoriteService.removeFavoriteFilm("2", "u1")).toBe(true);
    expect(favoriteService.removeFavoriteFilm("2", "u1")).toBe(false);
    expect(favoriteService.getFavoriteFilms("u1")).toEqual([]);
  });

  it("adds and lists favorite characters per user", () => {
    expect(favoriteService.addFavoriteCharacter("3", "u1")).toEqual(["3"]);
    expect(favoriteService.getFavoriteCharacters("u1")).toEqual(["3"]);
  });

  it("removes favorite characters and reports existence", () => {
    favoriteService.addFavoriteCharacter("4", "u1");
    expect(favoriteService.removeFavoriteCharacter("4", "u1")).toBe(true);
    expect(favoriteService.removeFavoriteCharacter("4", "u1")).toBe(false);
  });

  it("reads favorites without creating a user entry", () => {
    process.env.FAVORITES_MAX_USERS = "1";
    favoriteService.addFavoriteFilm("1", "user-1");

    expect(favoriteService.getFavoriteFilms("user-2")).toEqual([]);
    expect(favoriteService.getFavoriteCharacters("user-2")).toEqual([]);
    expect(() => favoriteService.addFavoriteFilm("2", "user-2")).toThrow(
      expect.objectContaining({ status: 429, code: "favorites_user_limit_reached" })
    );
  });

  it("caps the number of items per user", () => {
    process.env.FAVORITES_MAX_ITEMS = "2";

    favoriteService.addFavoriteFilm("1", "user-1");
    favoriteService.addFavoriteFilm("2", "user-1");

    expect(() => favoriteService.addFavoriteFilm("3", "user-1")).toThrow(
      expect.objectContaining({ status: 429, code: "favorites_limit_reached" })
    );
    expect(favoriteService.getFavoriteFilms("user-1")).toEqual(["1", "2"]);
  });

  it("does not count duplicate favorites against the item cap", () => {
    process.env.FAVORITES_MAX_ITEMS = "1";

    favoriteService.addFavoriteCharacter("1", "user-1");
    favoriteService.addFavoriteCharacter("1", "user-1");

    expect(favoriteService.getFavoriteCharacters("user-1")).toEqual(["1"]);
  });

  it("removes empty user entries so slots are freed", () => {
    process.env.FAVORITES_MAX_USERS = "1";

    favoriteService.addFavoriteFilm("1", "user-1");
    expect(favoriteService.removeFavoriteFilm("1", "user-1")).toBe(true);
    expect(favoriteService.getFavoriteFilms("user-1")).toEqual([]);

    expect(() => favoriteService.addFavoriteFilm("2", "user-2")).not.toThrow();
  });

  it("returns false when removing from an unknown user", () => {
    expect(favoriteService.removeFavoriteFilm("1", "missing")).toBe(false);
    expect(favoriteService.removeFavoriteCharacter("1", "missing")).toBe(false);
  });

  it("persists and reloads favorites when persistence is enabled", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "favorites-test-"));
    const dataFile = path.join(tmpDir, "favorites.json");
    process.env.NODE_ENV = "test";
    process.env.FAVORITES_PERSIST = "true";
    process.env.FAVORITES_DATA_FILE = dataFile;
    jest.resetModules();
    favoriteService = require("../../src/services/favoriteService");

    favoriteService.addFavoriteFilm("7", "alice");
    favoriteService.addFavoriteCharacter("8", "alice");
    expect(fs.existsSync(dataFile)).toBe(true);

    favoriteService._resetForTests();
    expect(favoriteService.getFavoriteFilms("alice")).toEqual([]);
    favoriteService._reloadForTests();
    expect(favoriteService.getFavoriteFilms("alice")).toEqual(["7"]);
    expect(favoriteService.getFavoriteCharacters("alice")).toEqual(["8"]);

    favoriteService.removeFavoriteFilm("7", "alice");
    jest.resetModules();
    process.env.NODE_ENV = "test";
    process.env.FAVORITES_PERSIST = "true";
    process.env.FAVORITES_DATA_FILE = dataFile;
    const reloaded = require("../../src/services/favoriteService");
    expect(reloaded.getFavoriteFilms("alice")).toEqual([]);
    expect(reloaded.getFavoriteCharacters("alice")).toEqual(["8"]);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("handles missing or invalid persisted data gracefully", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "favorites-test-"));
    const missingFile = path.join(tmpDir, "missing.json");
    process.env.NODE_ENV = "test";
    process.env.FAVORITES_PERSIST = "true";
    process.env.FAVORITES_DATA_FILE = missingFile;
    jest.resetModules();
    favoriteService = require("../../src/services/favoriteService");
    expect(favoriteService.getFavoriteFilms("any")).toEqual([]);

    fs.writeFileSync(missingFile, "{not-json", "utf8");
    favoriteService._reloadForTests();
    expect(favoriteService.getFavoriteFilms("any")).toEqual([]);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("sanitizes persisted user ids and duplicate entries when loading", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "favorites-test-"));
    const dataFile = path.join(tmpDir, "favorites.json");
    fs.writeFileSync(
      dataFile,
      JSON.stringify({
        "user-1": { films: ["1", "1", "2"], characters: ["3"] },
        "bad id": { films: ["1"] },
        empty: { films: [], characters: [] },
      })
    );

    process.env.NODE_ENV = "test";
    process.env.FAVORITES_PERSIST = "true";
    process.env.FAVORITES_DATA_FILE = dataFile;
    jest.resetModules();
    const reloaded = require("../../src/services/favoriteService");

    expect(reloaded.getFavoriteFilms("user-1")).toEqual(["1", "2"]);
    expect(reloaded.getFavoriteCharacters("user-1")).toEqual(["3"]);
    expect(reloaded.getFavoriteFilms("bad id")).toEqual([]);
    expect(reloaded.getFavoriteFilms("empty")).toEqual([]);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("keeps serving requests when persistence fails", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(fs, "writeFileSync").mockImplementation(() => {
      throw new Error("disk full");
    });

    process.env.NODE_ENV = "test";
    process.env.FAVORITES_PERSIST = "true";
    jest.resetModules();
    favoriteService = require("../../src/services/favoriteService");

    expect(() => favoriteService.addFavoriteFilm("1", "user-1")).not.toThrow();
    expect(favoriteService.getFavoriteFilms("user-1")).toEqual(["1"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("disk full"));
  });
});
