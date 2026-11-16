const fs = require("fs");
const os = require("os");
const path = require("path");

describe("favoriteService", () => {
  let favoriteService;

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.FAVORITES_PERSIST = "false";
    delete process.env.FAVORITES_DATA_FILE;
    jest.resetModules();
    favoriteService = require("../../src/services/favoriteService");
    favoriteService._resetForTests();
  });

  afterEach(() => {
    delete process.env.FAVORITES_PERSIST;
    delete process.env.FAVORITES_DATA_FILE;
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
});
