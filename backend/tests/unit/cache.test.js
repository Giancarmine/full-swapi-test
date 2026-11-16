const cache = require("../../src/utils/cache");

describe("cache utility", () => {
  beforeEach(() => {
    cache.clear();
    jest.useRealTimers();
  });

  afterEach(() => {
    cache.clear();
    jest.useRealTimers();
  });

  it("stores and retrieves values", () => {
    cache.set("key", { value: 1 });
    expect(cache.get("key")).toEqual({ value: 1 });
  });

  it("returns null for missing keys", () => {
    expect(cache.get("missing")).toBeNull();
  });

  it("expires values after ttl", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    cache.set("key", "value", 1000);
    expect(cache.get("key")).toBe("value");

    jest.advanceTimersByTime(1001);
    expect(cache.get("key")).toBeNull();
  });

  it("deletes values", () => {
    cache.set("key", "value");
    cache.del("key");
    expect(cache.get("key")).toBeNull();
  });

  it("getOrSet returns cached value without calling fetcher again", async () => {
    const fetcher = jest.fn().mockResolvedValue("fresh");

    const first = await cache.getOrSet("key", fetcher, 1000);
    const second = await cache.getOrSet("key", fetcher, 1000);

    expect(first).toBe("fresh");
    expect(second).toBe("fresh");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
