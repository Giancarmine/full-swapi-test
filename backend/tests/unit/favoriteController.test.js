const {
  addFavoriteFilm,
  addFavoriteCharacter,
  getFavorites,
  removeFavoriteFilm,
  removeFavoriteCharacter,
} = require("../../src/controllers/favoriteController");
const favoriteService = require("../../src/services/favoriteService");

jest.mock("../../src/services/favoriteService", () => ({
  getFavoriteFilms: jest.fn(),
  getFavoriteCharacters: jest.fn(),
  addFavoriteFilm: jest.fn(),
  addFavoriteCharacter: jest.fn(),
  removeFavoriteFilm: jest.fn(),
  removeFavoriteCharacter: jest.fn(),
}));

describe("Favorite Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFavorites", () => {
    it("should return favorites", async () => {
      const mockFilms = [{ id: "1", title: "A New Hope" }];
      const mockCharacters = [{ id: "1", name: "Luke Skywalker" }];

      favoriteService.getFavoriteFilms.mockReturnValue(mockFilms);
      favoriteService.getFavoriteCharacters.mockReturnValue(mockCharacters);

      const req = { get: jest.fn().mockReturnValue("user-1") };
      const res = { json: jest.fn() };

      getFavorites(req, res);

      expect(favoriteService.getFavoriteFilms).toHaveBeenCalledWith("user-1");
      expect(res.json).toHaveBeenCalledWith({ films: mockFilms, characters: mockCharacters });
    });

    it("should handle errors", async () => {
      const error = new Error("Failed to get favorites");
      favoriteService.getFavoriteFilms.mockImplementation(() => {
        throw error;
      });

      const req = { get: jest.fn().mockReturnValue(undefined) };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      getFavorites(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("addFavoriteFilm", () => {
    it("should add a film favorite", async () => {
      favoriteService.addFavoriteFilm.mockReturnValue(["1"]);

      const req = { params: { id: "1" }, get: jest.fn().mockReturnValue("user-1") };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await addFavoriteFilm(req, res, next);

      expect(favoriteService.addFavoriteFilm).toHaveBeenCalledWith("1", "user-1");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("should handle errors", async () => {
      const error = new Error("Failed to add favorite film");
      favoriteService.addFavoriteFilm.mockImplementation(() => {
        throw error;
      });

      const req = { params: { id: "1" }, get: jest.fn().mockReturnValue(undefined) };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      addFavoriteFilm(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("addFavoriteCharacter", () => {
    it("should add a character favorite", async () => {
      favoriteService.addFavoriteCharacter.mockReturnValue(["1"]);

      const req = { params: { id: "1" }, get: jest.fn().mockReturnValue("user-1") };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      addFavoriteCharacter(req, res, next);

      expect(favoriteService.addFavoriteCharacter).toHaveBeenCalledWith("1", "user-1");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("should handle errors", async () => {
      const error = new Error("Failed to add favorite character");
      favoriteService.addFavoriteCharacter.mockImplementation(() => {
        throw error;
      });

      const req = { params: { id: "1" }, get: jest.fn().mockReturnValue(undefined) };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      addFavoriteCharacter(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("removeFavoriteFilm", () => {
    it("should remove a film favorite", async () => {
      favoriteService.removeFavoriteFilm.mockReturnValue(true);

      const req = { params: { id: "1" }, get: jest.fn().mockReturnValue("user-1") };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      removeFavoriteFilm(req, res, next);

      expect(favoriteService.removeFavoriteFilm).toHaveBeenCalledWith("1", "user-1");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 404 if film not found", async () => {
      favoriteService.removeFavoriteFilm.mockReturnValue(false);

      const req = { params: { id: "999" }, get: jest.fn().mockReturnValue("user-1") };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
      const next = jest.fn();

      removeFavoriteFilm(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toMatchObject({ status: 404 });
    });
  });

  describe("removeFavoriteCharacter", () => {
    it("should remove a character favorite", async () => {
      favoriteService.removeFavoriteCharacter.mockReturnValue(true);

      const req = { params: { id: "1" }, get: jest.fn().mockReturnValue("user-1") };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      const next = jest.fn();

      removeFavoriteCharacter(req, res, next);

      expect(favoriteService.removeFavoriteCharacter).toHaveBeenCalledWith("1", "user-1");
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 404 if character not found", async () => {
      favoriteService.removeFavoriteCharacter.mockReturnValue(false);

      const req = { params: { id: "999" }, get: jest.fn().mockReturnValue("user-1") };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
      const next = jest.fn();

      removeFavoriteCharacter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toMatchObject({ status: 404 });
    });
  });
});
