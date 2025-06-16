import("./utils/envValidator.js");

import express from "express";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute";
import { logger } from "./utils/logger";
import { initPostgres, initRedis } from "./utils/database";

const app = express();
const port = process.env["PORT"] ?? 3000;

app.use(cookieParser(process.env["COOKIE_SECRET"]));
app.use("/auth", authRoute);

app.listen(port, () => {
	logger.info(`Listening on port: ${port}`);
});
