import("./utils/envValidator.js");

import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute";
import { logger } from "./utils/logger";
import { initPostgres, initRedis } from "./utils/database";
import type { NextFunction, Request, Response } from "express";

const app = express();
const port = process.env["PORT"] ?? 3000;

app.use(cors({ credentials: true }));
app.use(compression());
app.use(cookieParser(process.env["COOKIE_SECRET"]));
app.use("/auth", authRoute);
app.use("/files", filesRoute);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	logger.error(err);
	res.status(500).json({ message: "Unknown error occurred" });
});

app.listen(port, async () => {
	await initPostgres();
	await initRedis();
	logger.info(`Listening on port: ${port}`);
});
