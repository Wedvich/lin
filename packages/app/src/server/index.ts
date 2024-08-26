import { createRequestHandler } from "@remix-run/express";
import express from "express";
import { pinoHttp } from "pino-http";
import container, { TypeIds } from "./container";
import { ViteLoggerAdapter } from "./logger";
import type { Logger } from "pino";

const logger = container.get<Logger>(TypeIds.Logger);
logger.info("Starting server...");

const port = process.env.PORT || 3080;

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then((vite) =>
        vite.createServer({
          customLogger: new ViteLoggerAdapter(logger),
          server: { middlewareMode: true },
        }),
      );

const app = express();

const httpLogger = pinoHttp({ logger, useLevel: "trace" });
app.use(httpLogger);

app.use(
  viteDevServer ? viteDevServer.middlewares : express.static("build/client"),
);

const build = viteDevServer
  ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
  : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await import("../build/server/index.js");

app.all("*", createRequestHandler({ build }));

app.listen(port, () => {
  logger.info("Server listening on http://localhost:%s", port);
});
