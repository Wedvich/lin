import express from "express";
import { createServer } from "node:http";

const app = express();
app.use(express.json());

const server = createServer(app);

const PORT = Number(process.env.PORT) || 3002;
const HOST = process.env.HOST || "localhost";

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
