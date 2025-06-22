import argon2 from "argon2";
import { connectPostgres, redisClient } from "../utils/database";
import {
	generateAccessToken,
	generateRefreshToken,
	resolveExpirationSec,
	verifyRefreshToken
} from "../utils/jwt";
import { logger } from "../utils/logger";
import type { Request, Response } from "express";
import type { User } from "@shared/types/api";

export async function loginUser(req: Request, res: Response) {
	const { username, password } = req.body;

	if (!username || !password) {
		res.status(400).json({ message: "Username and password are required" });
		return;
	}

	const postgres = await connectPostgres();
	const result = await postgres.query(
		`
    SELECT * FROM Users
    WHERE username = $1
    `,
		[username]
	);

	if (!result.rowCount) {
		res.status(401).json({ message: "User doesn't exist" });
		return;
	}

	const user: User = result.rows[0];
	const pwdMatch = await argon2.verify(user.password_hash, password);

	if (!pwdMatch) {
		res.status(401).json({ message: "Wrong password" });
		return;
	}

	const accessToken = await generateAccessToken(user.id);
	const refreshToken = await generateRefreshToken(user.id).catch((err) => {
		logger.error("Failed to generate refresh token", err);
	});

	if (!refreshToken) {
		res.status(500).json({ message: "Unknown error occurred" });
		return;
	}

	res
		.status(200)
		.cookie("REFRESH_TOKEN", refreshToken, {
			httpOnly: true,
			secure: process.env["NODE_ENV"] === "production",
			sameSite: true,
			maxAge:
				resolveExpirationSec(process.env["JWT_REFRESH_TOKEN_EXP"]!)! * 1000,
			signed: true
		})
		.json({
			message: "Successfully logged in",
			data: { accessToken }
		});
}

export async function logoutUser(req: Request, res: Response) {
	const refreshToken = req.signedCookies["REFRESH_TOKEN"];

	if (!refreshToken) {
		res.status(401).json({ message: "You're not logged in" });
		return;
	}

	await redisClient.del(`refresh_token:${refreshToken}`);
	res
		.clearCookie("REFRESH_TOKEN")
		.status(200)
		.json({ message: "Successfully logged out" });
}

export async function refreshTokens(req: Request, res: Response) {
	const refreshToken = req.signedCookies["REFRESH_TOKEN"];

	if (!refreshToken) {
		res.status(401).json({ message: "Missing refresh token" });
		return;
	}

	const verifyPromise = verifyRefreshToken(refreshToken);
	const queryPromise = redisClient.get(`refresh_token:${refreshToken}`);
	const [jwtPayload, userId] = await Promise.all([verifyPromise, queryPromise]);

	if (!jwtPayload || !userId || jwtPayload.userId !== userId) {
		res
			.clearCookie("REFRESH_TOKEN")
			.status(403)
			.json({ message: "Invalid refresh token" });
		return;
	}

	await redisClient.del(`refresh_token:${refreshToken}`);

	const newAccessToken = await generateAccessToken(userId);
	const newRefreshToken = await generateRefreshToken(userId);

	res
		.cookie("REFRESH_TOKEN", newRefreshToken, {
			httpOnly: true,
			secure: process.env["NODE_ENV"] === "production",
			sameSite: true,
			maxAge:
				resolveExpirationSec(process.env["JWT_REFRESH_TOKEN_EXP"]!)! * 1000,
			signed: true
		})
		.status(200)
		.json({
			message: "Successfully refreshed tokens",
			data: { accessToken: newAccessToken }
		});
}
