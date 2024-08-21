import express from "express";
import { pinoHttp } from "pino-http";

import logger from "./logger.js";
import router from "./routes/index.js";

const app = express();
app.disable("x-powered-by");

const httpLogger = pinoHttp({ logger });
app.use(httpLogger);

app.use("/auth", router);

export default app;
