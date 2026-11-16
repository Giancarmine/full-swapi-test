const request = require("supertest");
const app = require("../../src/app");
const characterService = require("../../src/services/characterService");

jest.mock("../../src/services/characterService");

describe("Character Routes Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /characters", () => {
    it("should return all characters with status 200", async () => {
      const mockCharacters = [
        { id: "1", name: "Luke Skywalker" },
        { id: "2", name: "Darth Vader" },
      ];
      characterService.getCharacters.mockResolvedValue(mockCharacters);

      const response = await request(app).get("/api/characters");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockCharacters);
    });

    it("should handle errors with status 500", async () => {
      characterService.getCharacters.mockRejectedValue(new Error("Service error"));

      const response = await request(app).get("/api/characters");

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /characters/:id", () => {
    it("should return a character with status 200", async () => {
      const mockCharacter = { id: "1", name: "Luke Skywalker" };
      characterService.getCharacterById.mockResolvedValue(mockCharacter);

      const response = await request(app).get("/api/characters/1");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockCharacter);
    });

    it("should return 404 if character not found", async () => {
      const error = new Error("Character not found");
      error.status = 404;
      error.code = "not_found";
      characterService.getCharacterById.mockRejectedValue(error);

      const response = await request(app).get("/api/characters/999");

      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({ error: "Character not found", code: "not_found" });
    });

    it("should handle rate limit errors with status 429", async () => {
      const error = new Error("API rate limit exceeded");
      error.status = 429;
      error.code = "rate_limited";
      characterService.getCharacterById.mockRejectedValue(error);

      const response = await request(app).get("/api/characters/1");

      expect(response.statusCode).toBe(429);
      expect(response.body).toMatchObject({
        error: "API rate limit exceeded",
        code: "rate_limited",
      });
    });
  });
});
