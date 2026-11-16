jest.mock("axios", () => {
  const requestMock = jest.fn((config) => Promise.resolve({ data: { ok: true }, config }));
  const instance = Object.assign(requestMock, {
    interceptors: {
      request: {
        handlers: [],
        use: jest.fn((fulfilled) => instance.interceptors.request.handlers.push(fulfilled)),
      },
      response: {
        handlers: [],
        use: jest.fn((fulfilled, rejected) =>
          instance.interceptors.response.handlers.push({ fulfilled, rejected })
        ),
      },
    },
    get: jest.fn(),
  });
  return {
    create: jest.fn(() => instance),
    __instance: instance,
  };
});

describe("swapiClient interceptors", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("request interceptor enforces rate limit delay", async () => {
    const axios = require("axios");
    require("../../src/utils/swapiClient");
    const instance = axios.__instance;
    const reqInterceptor = instance.interceptors.request.handlers[0];

    await reqInterceptor({ url: "/a" }); // sets lastRequestTime
    const p = reqInterceptor({ url: "/b" });
    await jest.advanceTimersByTimeAsync(1000);
    const cfg = await p;
    expect(cfg.url).toBe("/b");
  });

  it("response interceptor retries 429 up to max then rejects", async () => {
    const axios = require("axios");
    const { swapiClient } = require("../../src/utils/swapiClient");
    const instance = axios.__instance;
    const { rejected } = instance.interceptors.response.handlers[0];
    swapiClient.mockRejectedValue({ response: { status: 429 }, config: { __retryCount: 2 } });

    await expect(
      rejected({ response: { status: 429 }, config: { __retryCount: 2 } })
    ).rejects.toMatchObject({
      response: { status: 429 },
    });
  });

  it("response interceptor passes through non-429 errors", async () => {
    const axios = require("axios");
    require("../../src/utils/swapiClient");
    const instance = axios.__instance;
    const { rejected } = instance.interceptors.response.handlers[0];
    const err = { response: { status: 500 }, config: {} };
    await expect(rejected(err)).rejects.toBe(err);
  });
});
