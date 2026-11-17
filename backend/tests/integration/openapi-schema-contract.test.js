const request = require("supertest");
const path = require("path");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const { dereferenceFile } = require("../helpers/dereference");

jest.mock("../../src/services/filmService");
jest.mock("../../src/services/characterService");
jest.mock("../../src/services/favoriteService");

const filmService = require("../../src/services/filmService");
const characterService = require("../../src/services/characterService");
const favoriteService = require("../../src/services/favoriteService");
const app = require("../../src/app");

const specPath = path.join(__dirname, "../../docs/openapi.yaml");

const getResponseSchema = (spec, routePath, method, status) => {
  const op = spec.paths?.[routePath]?.[method];
  const content = op?.responses?.[String(status)]?.content?.["application/json"];
  return content?.schema || null;
};

describe("OpenAPI schema contract", () => {
  let spec;
  let ajv;

  beforeAll(async () => {
    spec = dereferenceFile(specPath);
    ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const expectValid = (schema, data) => {
    if (!schema) return;
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
      throw new Error(`Schema validation failed: ${ajv.errorsText(validate.errors)}`);
    }
  };

  it("GET /health matches schema", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expectValid(getResponseSchema(spec, "/health", "get", 200), res.body);
  });

  it("GET /api/films matches schema", async () => {
    filmService.getFilms.mockResolvedValue([
      {
        id: "1",
        title: "A New Hope",
        director: "George Lucas",
        releaseDate: "1977-05-25",
        openingCrawl: "crawl",
        characters: ["1"],
        episodeId: 4,
        coverImage: "img",
      },
    ]);
    const res = await request(app).get("/api/films");
    expect(res.status).toBe(200);
    expectValid(getResponseSchema(spec, "/api/films", "get", 200), res.body);
  });

  it("GET /api/films/{id} matches schema", async () => {
    filmService.getFilmById.mockResolvedValue({
      id: "1",
      title: "A New Hope",
      director: "George Lucas",
      releaseDate: "1977-05-25",
      openingCrawl: "crawl",
      characters: ["1"],
      episodeId: 4,
      coverImage: "img",
    });
    const res = await request(app).get("/api/films/1");
    expect(res.status).toBe(200);
    expectValid(getResponseSchema(spec, "/api/films/{id}", "get", 200), res.body);
  });

  it("GET /api/characters matches schema", async () => {
    characterService.getCharacters.mockResolvedValue([
      {
        id: "1",
        name: "Luke Skywalker",
        gender: "male",
        birthYear: "19BBY",
        height: "172",
        mass: "77",
        homeworld: "1",
        image: "img",
        url: "u",
      },
    ]);
    const res = await request(app).get("/api/characters");
    expect(res.status).toBe(200);
    expectValid(getResponseSchema(spec, "/api/characters", "get", 200), res.body);
  });

  it("GET /api/characters/{id} matches schema", async () => {
    characterService.getCharacterById.mockResolvedValue({
      id: "1",
      name: "Luke Skywalker",
      gender: "male",
      birthYear: "19BBY",
      height: "172",
      mass: "77",
      hairColor: "blond",
      eyeColor: "blue",
      skinColor: "fair",
      homeworld: { id: "1", name: "Tatooine" },
      image: "img",
    });
    const res = await request(app).get("/api/characters/1");
    expect(res.status).toBe(200);
    expectValid(getResponseSchema(spec, "/api/characters/{id}", "get", 200), res.body);
  });

  it("GET /api/favorites matches schema", async () => {
    favoriteService.getFavoriteFilms.mockReturnValue(["1"]);
    favoriteService.getFavoriteCharacters.mockReturnValue(["2"]);
    const res = await request(app).get("/api/favorites");
    expect(res.status).toBe(200);
    expectValid(getResponseSchema(spec, "/api/favorites", "get", 200), res.body);
  });

  it("error responses match schema", async () => {
    const res = await request(app).get("/api/films/abc");
    expect(res.status).toBe(400);
    expectValid(getResponseSchema(spec, "/api/films/{id}", "get", 400), res.body);
  });
});
