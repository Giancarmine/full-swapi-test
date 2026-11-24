const cache = require("../../src/utils/cache");

describe("cache utility", () => {
  beforeEach(() => {
    delete process.env.CACHE_MAX_ENTRIES;
    cache.clear();
    jest.useRealTimers();
  });

  afterEach(() => {
    delete process.env.CACHE_MAX_ENTRIES;
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

  it("de-duplicates concurrent cold loads for the same key", async () => {
    let resolveFetch;
    const fetcher = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const first = cache.getOrSet("shared", fetcher);
    const second = cache.getOrSet("shared", fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    resolveFetch("value");
    await expect(Promise.all([first, second])).resolves.toEqual(["value", "value"]);
  });

  it("does not cache failed fetches and allows a later retry", async () => {
    const fetcher = jest.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue("ok");

    await expect(cache.getOrSet("flaky", fetcher)).rejects.toThrow("boom");
    await expect(cache.getOrSet("flaky", fetcher)).resolves.toBe("ok");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("evicts the least recently used entry when the size limit is reached", () => {
    process.env.CACHE_MAX_ENTRIES = "2";

    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1); // a becomes most recently used
    cache.set("c", 3);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeNull();
    expect(cache.get("c")).toBe(3);
    expect(cache.getStats().evictions).toBe(1);
  });

  it("sweeps unrelated expired entries on write", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    cache.set("old", "value", 10);
    jest.advanceTimersByTime(20);
    cache.set("new", "value", 1000);

    expect(cache.get("old")).toBeNull();
    expect(cache.getStats().expirations).toBe(1);
  });

  it("reports cache statistics and resets them on clear", () => {
    cache.set("a", 1);
    cache.get("a");
    cache.get("missing");

    expect(cache.getStats()).toMatchObject({ size: 1, hits: 1, misses: 1 });
    cache.clear();
    expect(cache.getStats()).toEqual({ size: 0, hits: 0, misses: 0, evictions: 0, expirations: 0 });
  });

  it("replaces an existing key without counting an eviction", () => {
    process.env.CACHE_MAX_ENTRIES = "2";

    cache.set("a", 1);
    cache.set("a", 2);

    expect(cache.get("a")).toBe(2);
    expect(cache.getStats().evictions).toBe(0);
  });

  it("uses a configurable size limit from the environment", () => {
    process.env.CACHE_MAX_ENTRIES = "1";
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBe(2);
  });
});
