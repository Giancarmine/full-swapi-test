require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`API endpoints available at http://${HOST}:${PORT}/api`);
  console.log(`Health check at http://${HOST}:${PORT}/health`);
});

