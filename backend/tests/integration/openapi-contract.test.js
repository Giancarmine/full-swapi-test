const request = require("supertest");
const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

jest.mock("../../src/services/filmService");
jest.mock("../../src/services/characterService");
jest.mock("../../src/services/favoriteService");

const filmService = require("../../src/services/filmService");
const characterService = require("../../src/services/characterService");
const favoriteService = require("../../src/services/favoriteService");
const app = require("../../src/app");

describe("OpenAPI contract (basic)", () => {
  const spec = YAML.parse(fs.readFileSync(path.join(__dirname, "../../docs/openapi.yaml"), "utf8"));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("defines core paths", () => {
    expect(spec.paths["/health"]).toBeDefined();
    expect(spec.paths["/api/films"]).toBeDefined();
    expect(spec.paths["/api/characters"]).toBeDefined();
    expect(spec.paths["/api/favorites"]).toBeDefined();
  });

  it("GET /health matches documented success shape", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/films returns array per contract", async () => {
    filmService.getFilms.mockResolvedValue([{ id: "1", title: "A New Hope" }]);
    const res = await request(app).get("/api/films");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/characters returns array per contract", async () => {
    characterService.getCharacters.mockResolvedValue([{ id: "1", name: "Luke" }]);
    const res = await request(app).get("/api/characters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("favorites endpoints follow documented statuses", async () => {
    favoriteService.getFavoriteFilms.mockReturnValue([]);
    favoriteService.getFavoriteCharacters.mockReturnValue([]);
    favoriteService.addFavoriteFilm.mockReturnValue(["1"]);
    favoriteService.removeFavoriteFilm.mockReturnValue(true);

    await request(app).get("/api/favorites").expect(200);
    await request(app).post("/api/favorites/films/1").expect(201);
    await request(app).delete("/api/favorites/films/1").expect(204);
  });

  it("invalid id returns documented 400 error shape", async () => {
    const res = await request(app).get("/api/films/abc");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
