const axios = require("axios");
const { SWAPI_BASE_URL } = process.env;

// Create axios instance with default config
const swapiClient = axios.create({
  baseURL: SWAPI_BASE_URL || "https://www.swapi.tech/api",
  timeout: 10000,
  headers: {
    "Accept": "application/json",
    "User-Agent": "StarWarsApp/1.0"
  }
});

// Rate limiting variables
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
let lastRequestTime = 0;

// Add request interceptor for rate limiting
swapiClient.interceptors.request.use(async (config) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => 
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return config;
});

// Add response interceptor for error handling
swapiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      console.warn("Rate limited by SWAPI. Waiting before retrying...");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(swapiClient(error.config));
        }, 5000); // Wait 5 seconds before retrying
      });
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

