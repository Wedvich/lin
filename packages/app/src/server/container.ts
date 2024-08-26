import { Container } from "@lin/dependency-injection/container";
import { createLogger } from "./logger";

export const TypeIds = {
  Logger: Symbol.for("Logger"),
};

const container = new Container();

const logger = createLogger();
container.registerInstance(TypeIds.Logger, logger);

container.verify();

export default container;
