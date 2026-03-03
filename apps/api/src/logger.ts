import morgan from "morgan";
import { env } from "./config.js";

export const httpLogger = morgan(
  env.NODE_ENV === "development" ? "dev" : "combined"
);
