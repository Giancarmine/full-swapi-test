jest.mock("axios", () => {
  const requestMock = jest.fn();
  const instance = Object.assign(requestMock, {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
  });
  return {
    create: jest.fn(() => instance),
    __instance: instance,
  };
});

describe("swapiClient utils", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("extractIdFromUrl extracts numeric id", () => {
    const { extractIdFromUrl } = require("../../src/utils/swapiClient");
    expect(extractIdFromUrl("https://www.swapi.tech/api/films/1/")).toBe("1");
    expect(extractIdFromUrl("https://www.swapi.tech/api/people/10")).toBe("10");
    expect(extractIdFromUrl("")).toBeNull();
    expect(extractIdFromUrl(null)).toBeNull();
    expect(extractIdFromUrl("https://www.swapi.tech/api/films/abc")).toBeNull();
  });

  it("registers axios interceptors and retries on 429", async () => {
    jest.useFakeTimers();
    const axios = require("axios");
    const { swapiClient } = require("../../src/utils/swapiClient");
    const instance = axios.__instance;

    expect(instance.interceptors.request.use).toHaveBeenCalled();
    expect(instance.interceptors.response.use).toHaveBeenCalled();

    const errorHandler = instance.interceptors.response.use.mock.calls[0][1];
    const config = { url: "/films" };

    const promise = errorHandler({ response: { status: 429 }, config });
    await jest.advanceTimersByTimeAsync(1000);
    await promise;

    expect(swapiClient).toHaveBeenCalledWith(expect.objectContaining({ __retryCount: 1 }));
    jest.useRealTimers();
  });
});
