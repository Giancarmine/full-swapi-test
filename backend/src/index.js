require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000);

const server = app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`API endpoints available at http://${HOST}:${PORT}/api`);
  console.log(`Health check at http://${HOST}:${PORT}/health`);
});

const shutdown = (signal) => {
  console.log(`[server] Received ${signal}; shutting down gracefully`);

  const forceExit = setTimeout(() => {
    console.error(`[server] Forced shutdown after ${SHUTDOWN_TIMEOUT_MS}ms`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((err) => {
    clearTimeout(forceExit);
    if (err) {
      console.error("[server] Error while closing the server:", err);
      process.exit(1);
    }
    console.log("[server] Closed all connections");
    process.exit(0);
  });
};

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});
