import { logger } from "./logger";

const env = process.env;

if (
	!env["PORT"]?.length ||
	!env["POSTGRES_HOST"]?.length ||
	!env["POSTGRES_USER"]?.length ||
	!env["POSTGRES_PASSWORD"]?.length ||
	!env["POSTGRES_NAME"]?.length ||
	!env["REDIS_HOST"]?.length ||
	!env["REDIS_USER"]?.length ||
	!env["REDIS_PASSWORD"]?.length
) {
	logger.error("Setup environment variables properly before starting the app.");
	process.exit(1);
}
