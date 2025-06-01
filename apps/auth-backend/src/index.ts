import express from "express";
import { createServer } from "node:http";
import { parsePort } from "@lin/utils/port";

const app = express();
app.use(express.json());

const server = createServer(app);

const PORT = parsePort(process.env.AUTH_BACKEND_PORT, 3001);
const HOST = process.env.HOST || "localhost";

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
