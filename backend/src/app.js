const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const rateLimit = require("express-rate-limit");
const OpenApiValidator = require("express-openapi-validator");
const routes = require("./routes");

// Initialize express app
const app = express();

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // HTTP request logger

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later.", code: "rate_limited" },
});

const openapiPath = path.join(__dirname, "..", "docs", "openapi.yaml");
app.use(
  OpenApiValidator.middleware({
    apiSpec: openapiPath,
    validateRequests: true,
    validateResponses: process.env.NODE_ENV !== "production",
    ignorePaths: /.*\/api-docs.*/,
  })
);

// API routes
app.use("/api", apiLimiter, routes);

// API docs (non-production environments)
if (process.env.NODE_ENV !== "production") {
  try {
    const openapiPath = path.join(__dirname, "..", "docs", "openapi.yaml");
    const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, "utf8"));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));
  } catch (_err) {
    // Docs are optional at runtime; validation is enforced in CI.
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handler middleware
app.use((err, req, res, _next) => {
  const status = Number(err.status || err.statusCode || 500);
  const isValidationError = Array.isArray(err.errors) && status >= 400 && status < 500;
  const message =
    isValidationError && status === 400
      ? "Invalid request"
      : err.message || (status >= 500 ? "Internal server error" : "Request error");
  const code = err.code || (isValidationError ? "validation_error" : undefined);

  if (status >= 500) {
    console.error(err.stack || err);
  }

  const payload = {
    error:
      status >= 500 && process.env.NODE_ENV === "production" ? "Internal server error" : message,
  };

  if (code) {
    payload.code = code;
  }

  if (
    status >= 500 &&
    process.env.NODE_ENV !== "production" &&
    err.message &&
    payload.error !== err.message
  ) {
    payload.message = err.message;
  }

  if (isValidationError && process.env.NODE_ENV !== "production") {
    payload.details = err.errors.map((e) => ({
      path: e.path,
      message: e.message,
      errorCode: e.errorCode,
    }));
  }

  res.status(status).json(payload);
});

module.exports = app;
