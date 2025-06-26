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
	!env["REDIS_PASSWORD"]?.length ||
	!env["JWT_ACCESS_SECRET"]?.length ||
	!env["JWT_REFRESH_SECRET"]?.length ||
	!env["JWT_ACCESS_TOKEN_EXP"]?.length ||
	!env["JWT_REFRESH_TOKEN_EXP"]?.length ||
	!env["COOKIE_SECRET"]?.length ||
	!env["TEMP_STORAGE"]?.length
) {
	logger.error("Setup environment variables properly before starting the app.");
	process.exit(1);
}
