const request = require("supertest");
const app = require("../../src/app");

describe("Health Check Endpoint", () => {
  it("should return 200 status", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
  });
});

