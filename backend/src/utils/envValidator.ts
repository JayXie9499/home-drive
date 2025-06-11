import { logger } from "./logger";

const env = process.env;

if (
	!env["PORT"]?.length ||
	!env["DB_HOST"]?.length ||
	!env["DB_PORT"]?.length ||
	!env["DB_USER"]?.length ||
	!env["DB_PASSWORD"]?.length ||
	!env["DB_NAME"]?.length
) {
	logger.error("Setup environment variables properly before starting the app.");
	process.exit(1);
}
