const request = require("supertest");

jest.mock("../../src/services/filmService");
jest.mock("../../src/services/characterService");
jest.mock("../../src/services/favoriteService", () => ({
  getFavoriteFilms: jest.fn(),
  getFavoriteCharacters: jest.fn(),
  addFavoriteFilm: jest.fn(),
  addFavoriteCharacter: jest.fn(),
  removeFavoriteFilm: jest.fn(),
  removeFavoriteCharacter: jest.fn(),
  getStoreHealth: jest.fn(() => ({ store: "memory", ok: true })),
}));

const filmService = require("../../src/services/filmService");
const favoriteService = require("../../src/services/favoriteService");
const app = require("../../src/app");
const { metricsHandler, register } = require("../../src/utils/metrics");

describe("readiness and metrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    favoriteService.getStoreHealth.mockReturnValue({ store: "memory", ok: true });
  });

  it("GET /health/ready reports the backing store when ready", async () => {
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      checks: { favorites: "ok" },
      store: "memory",
    });
    expect(typeof res.body.uptimeSeconds).toBe("number");
  });

  it("GET /health/ready returns 503 when the store is unavailable", async () => {
    favoriteService.getStoreHealth.mockReturnValueOnce({ store: "sqlite", ok: false });
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: "error", checks: { favorites: "error" } });
  });

  it("GET /health/ready handles a missing health payload", async () => {
    favoriteService.getStoreHealth.mockReturnValueOnce(undefined);
    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(503);
    expect(res.body.store).toBe("unknown");
  });

  it("GET /metrics exposes Prometheus metrics and records handled requests", async () => {
    await request(app).get("/health");
    const res = await request(app).get("/metrics");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toContain("http_requests_total");
    expect(res.text).toContain('route="/health"');
    expect(res.text).toContain('status="200"');
    expect(res.text).toContain("cache_entries");
  });

  it("GET /metrics labels unmatched routes", async () => {
    await request(app).get("/does-not-exist");
    const res = await request(app).get("/metrics");
    expect(res.text).toContain('route="unmatched"');
  });

  it("metricsHandler forwards formatting failures to the error handler", async () => {
    const fail = jest.spyOn(register, "metrics").mockRejectedValueOnce(new Error("metrics fail"));
    const next = jest.fn();
    const res = { set: jest.fn(), send: jest.fn() };

    await metricsHandler({}, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "metrics fail" }));
    expect(res.send).not.toHaveBeenCalled();
    fail.mockRestore();
  });
});

describe("list response caching", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds Cache-Control and ETag headers to film lists", async () => {
    filmService.getFilms.mockResolvedValue([{ id: "1", title: "A New Hope" }]);
    const res = await request(app).get("/api/films");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("max-age=60");
    expect(res.headers.etag).toBeDefined();
  });

  it("adds Cache-Control and ETag headers to character lists", async () => {
    const characterService = require("../../src/services/characterService");
    characterService.getCharacters.mockResolvedValue([{ id: "1", name: "Luke" }]);
    const res = await request(app).get("/api/characters");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("max-age=60");
    expect(res.headers.etag).toBeDefined();
  });

  it("gzip-compresses large list responses when accepted", async () => {
    filmService.getFilms.mockResolvedValue(
      Array.from({ length: 200 }, (_, index) => ({
        id: String(index + 1),
        title: `A very long film title for deterministic compression ${index + 1}`,
      }))
    );

    const res = await request(app).get("/api/films").set("Accept-Encoding", "gzip");

    expect(res.status).toBe(200);
    expect(res.headers["content-encoding"]).toBe("gzip");
    expect(res.body).toHaveLength(200);
  });
});
