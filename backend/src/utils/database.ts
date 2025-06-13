import { Pool } from "pg";
import { createClient } from "@redis/client";
import { logger } from "./logger";

const pgPool = new Pool({
	host: process.env["POSTGRES_HOST"],
	port: parseInt(process.env["POSTGRES_PORT"] ?? "5432"),
	user: process.env["POSTGRES_USER"],
	password: process.env["POSTGRES_PASSWORD"],
	database: process.env["POSTGRES_NAME"]
});

pgPool.on("connect", () => logger.info("New pg client connected."));
pgPool.on("release", () => logger.info("Released a pg client."));
pgPool.on("error", (err) => logger.error("Error occurred on pg client.", err));

export function connectPostgres() {
	return pgPool.connect();
}

export async function initPostgres() {
	const client = await connectPostgres().catch((err) => {
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
		await client.query(
			`
			CREATE TABLE IF NOT EXISTS Items (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				owner_id UUID NOT NULL,
				parent_id UUID,
				name VARCHAR(255) NOT NULL,
				size BIGINT NOT NULL DEFAULT 0,
				mime VARCHAR(255),
				is_folder BOOL NOT NULL DEFAULT FALSE,

				CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE,
				CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES Items(id) ON DELETE CASCADE
			)
			`
		);
	} catch (err) {
		logger.error("Failed to initialize database tables!", err);
		process.exit(1);
	}
	client.release();
}

export const redisClient = createClient({
	RESP: 3,
	clientSideCache: {
		ttl: 30 * 24 * 60 * 60 * 1000
	},
	socket: {
		host: process.env["REDIS_HOST"],
		port: parseInt(process.env["REDIS_PORT"] ?? "6379")
	},
	username: process.env["REDIS_USER"],
	password: process.env["REDIS_PASSWORD"]
});

export async function initRedis() {
	redisClient.on("error", (err) =>
		logger.error("Error occurred on redis client.", err)
	);
	await redisClient.connect();
}
