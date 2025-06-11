import { createLogger, transports, format } from "winston";
import fs from "fs";

if (fs.existsSync("logs/latest.log")) {
	const logCreateDate = fs.statSync("logs/latest.log").birthtime;

	fs.renameSync(
		"logs/latest.log",
		`logs/${logCreateDate.toISOString().replaceAll(":", "")}.log`
	);
}

const logFormat = format.printf(
	({ level, timestamp, label, message }) =>
		`[${timestamp}] [${level.toUpperCase()}] [${label}] ${message}`
);

export const logger = createLogger({
	format: format.combine(
		format.timestamp(),
		format.label({ label: "Backend" }),
		logFormat
	),
	transports: [
		new transports.Console(),
		new transports.File({
			dirname: "logs",
			filename: "latest.log"
		})
	]
});
