import { Pool } from "pg";
import { logger } from "./logger";

const pool = new Pool({
	host: process.env["DB_HOST"],
	port: parseInt(process.env["DB_PORT"] ?? "5432"),
	user: process.env["DB_USER"],
	password: process.env["DB_PASSWORD"],
	database: process.env["DB_NAME"]
});

pool.on("connect", () => logger.info("New pg client connected."));
pool.on("release", () => logger.info("Released a pg client."));
pool.on("error", (err) => logger.error("Error occurred on pg client.", err));

export function connectDatabase() {
	return pool.connect();
}

export async function initDatabase() {
	const client = await connectDatabase().catch((err) => {
		logger.error("Unable to connect database!", err);
	});

	if (!client) {
		process.exit(1);
	}

	try {
		await client.query(
			`
			CREATE TABLE IF NOT EXISTS Users (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				username VARCHAR(30) NOT NULL,
				display_name VARCHAR(50),
				password_hash TEXT NOT NULL
			)
			`
		);
	} catch (err) {
		logger.error("Failed to initialize database tables!", err);
		process.exit(1);
	}
	client.release();
}
