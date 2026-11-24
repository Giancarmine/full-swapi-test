const axios = require("axios");
const { SWAPI_BASE_URL } = process.env;

// Create axios instance with default config
const swapiClient = axios.create({
  baseURL: SWAPI_BASE_URL || "https://www.swapi.tech/api",
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "User-Agent": "StarWarsApp/1.0",
  },
});

// Rate limiting variables (tunable so local tests/CI do not pay the upstream pacing)
const positiveEnvInt = (name, fallback) => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
const RATE_LIMIT_DELAY = positiveEnvInt("SWAPI_MIN_REQUEST_INTERVAL_MS", 1000);
const MAX_RETRIES = positiveEnvInt("SWAPI_MAX_RETRIES", 2);
let lastRequestTime = 0;

// Add request interceptor for rate limiting
swapiClient.interceptors.request.use(async (config) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return config;
});

// Add response interceptor for error handling
swapiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const status = error.response?.status;

    if (status === 429) {
      const retryCount = config.__retryCount || 0;

      if (retryCount < MAX_RETRIES) {
        config.__retryCount = retryCount + 1;
        const delayMs = 1000 * 2 ** retryCount;
        console.warn(
          `Rate limited by SWAPI. Retrying in ${delayMs}ms (attempt ${config.__retryCount}/${MAX_RETRIES})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return swapiClient(config);
      }
    }

    return Promise.reject(error);
  }
);

// Extract ID from URL
const extractIdFromUrl = (url) => {
  if (!url) return null;
  const matches = url.match(/\/([0-9]+)\/?$/);
  return matches ? matches[1] : null;
};

module.exports = {
  swapiClient,
  extractIdFromUrl,
};
