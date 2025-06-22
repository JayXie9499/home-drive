import { verifyAccessToken } from "../utils/jwt";
import type { Request, Response, NextFunction } from "express";

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			user?: string;
		}
	}
}

export async function authenticateToken(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const accessToken = req.headers.authorization?.split(" ")[1];

	if (!accessToken) {
		res.status(401).json({ message: "Access token is required" });
		return;
	}

	const jwtPayload = await verifyAccessToken(accessToken);

	if (!jwtPayload) {
		res.status(401).json({ message: "Invalid access token" });
		return;
	}

	req.user = jwtPayload.userId;
	next();
}
