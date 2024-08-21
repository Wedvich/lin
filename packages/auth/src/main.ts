import "dotenv/config";

import http from "node:http";

import logger from "./logger.js";
import app from "./app.js";

const port = process.env.PORT || 3081;

const server = http.createServer(app);

server.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
