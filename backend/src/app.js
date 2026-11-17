const crypto = require("crypto");
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

const isProduction = process.env.NODE_ENV === "production";

const parseTrustProxy = () => {
  const raw = process.env.TRUST_PROXY;
  if (raw === undefined || raw === "") return "loopback";
  if (raw === "true") return 1; // trust a single reverse proxy hop
  if (raw === "false") return false;
  const hops = Number(raw);
  if (Number.isInteger(hops) && hops >= 0) return hops;
  return raw; // e.g. a subnet or named range supported by Express
};

app.set("trust proxy", parseTrustProxy());

const buildCorsOptions = () => {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return {};

  const origins = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (origins.length === 0) return {};

  return {
    origin(origin, callback) {
      if (!origin || origins.includes("*") || origins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  };
};

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

const requestId = (req, res, next) => {
  const incoming = req.get("x-request-id");
  req.id = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};

const requestLogger = (req, res, next) => {
  if (!isProduction) {
    return morgan("dev")(req, res, next);
  }

  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(
      JSON.stringify({
        level: "info",
        msg: "request",
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
      })
    );
  });
  return next();
};

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors(buildCorsOptions())); // Configurable allowlist via CORS_ORIGINS
app.use(requestId);
app.use(requestLogger);
app.use(express.json({ limit: "100kb" })); // Parse JSON bodies

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
    validateResponses: !isProduction,
    ignorePaths: /.*\/api-docs.*/,
  })
);

// API routes
app.use("/api", apiLimiter, routes);

// API docs (non-production environments)
if (!isProduction) {
  try {
    const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, "utf8"));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));
  } catch (err) {
    console.warn(`[docs] Unable to load API docs from ${openapiPath}: ${err.message}`);
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
    if (isProduction) {
      console.error(
        JSON.stringify({
          level: "error",
          msg: "request_failed",
          requestId: req.id,
          error: err.message,
          stack: err.stack,
        })
      );
    } else {
      console.error(err.stack || err);
    }
  }

  const payload = {
    error: status >= 500 && isProduction ? "Internal server error" : message,
  };

  if (code) {
    payload.code = code;
  }

  if (status >= 500 && !isProduction && err.message && payload.error !== err.message) {
    payload.message = err.message;
  }

  if (isValidationError && !isProduction) {
    payload.details = err.errors.map((e) => ({
      path: e.path,
      message: e.message,
      errorCode: e.errorCode,
    }));
  }

  res.status(status).json(payload);
});

module.exports = app;
