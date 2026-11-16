const request = require("supertest");
const app = require("../../src/app");
const favoriteService = require("../../src/services/favoriteService");

jest.mock("../../src/services/favoriteService", () => ({
  addFavoriteFilm: jest.fn(),
  addFavoriteCharacter: jest.fn(),
  removeFavoriteFilm: jest.fn(),
  removeFavoriteCharacter: jest.fn(),
  getFavoriteFilms: jest.fn(),
  getFavoriteCharacters: jest.fn(),
}));

describe("Favorite Routes Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /favorites", () => {
    it("should return favorites", async () => {
      favoriteService.getFavoriteFilms.mockReturnValue(["1"]);
      favoriteService.getFavoriteCharacters.mockReturnValue(["2"]);

      const response = await request(app).get("/api/favorites");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        films: ["1"],
        characters: ["2"],
      });
    });
  });

  describe("POST /favorites/films/:id", () => {
    it("should add a film favorite", async () => {
      favoriteService.addFavoriteFilm.mockReturnValue(["1"]);

      const response = await request(app).post("/api/favorites/films/1");

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ success: true });
    });
  });

  describe("POST /favorites/characters/:id", () => {
    it("should add a character favorite", async () => {
      favoriteService.addFavoriteCharacter.mockReturnValue(["1"]);

      const response = await request(app).post("/api/favorites/characters/1");

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ success: true });
    });
  });

  describe("DELETE /favorites/films/:id", () => {
    it("should remove a film favorite", async () => {
      favoriteService.removeFavoriteFilm.mockReturnValue(true);

      const response = await request(app).delete("/api/favorites/films/1");

      expect(response.statusCode).toBe(204);
    });

    it("should return 404 if film favorite not found", async () => {
      favoriteService.removeFavoriteFilm.mockReturnValue(false);

      const response = await request(app).delete("/api/favorites/films/999");

      expect(response.statusCode).toBe(404);
    });

    it("should return 400 for invalid film id", async () => {
      const response = await request(app).delete("/api/favorites/films/abc");
      expect(response.statusCode).toBe(400);
    });
  });

  describe("DELETE /favorites/characters/:id", () => {
    it("should remove a character favorite", async () => {
      favoriteService.removeFavoriteCharacter.mockReturnValue(true);

      const response = await request(app).delete("/api/favorites/characters/1");

      expect(response.statusCode).toBe(204);
    });

    it("should return 404 if character favorite not found", async () => {
      favoriteService.removeFavoriteCharacter.mockReturnValue(false);

      const response = await request(app).delete("/api/favorites/characters/999");

      expect(response.statusCode).toBe(404);
    });

    it("should return 400 for invalid character id", async () => {
      const response = await request(app).delete("/api/favorites/characters/abc");
      expect(response.statusCode).toBe(400);
    });
  });
});
