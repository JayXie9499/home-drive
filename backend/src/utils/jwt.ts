import { SignJWT, jwtVerify } from "jose";
import * as uuid from "uuid";
import { redisClient } from "./database";
import { User } from "@shared/types/api";

const JWT_SECRET = new TextEncoder().encode(process.env["JWT_SECRET"]);
const JWT_ISS = process.env["JWT_ISS"] ?? "urn:home-drive:auth";
const JWT_AUD = process.env["JWT_AUD"] ?? "urn:home-drive:api";

export function resolveExpirationSec(exp: string) {
	const matches = exp.match(/(\d+)([smhdwy])/);

	if (!matches) {
		return;
	}

	const num = parseInt(matches[1]);
	const unit = matches[2];

	switch (unit) {
		case "m":
			return num * 60;
		case "h":
			return num * 60 * 60;
		case "d":
			return num * 24 * 60 * 60;
		case "w":
			return num * 7 * 24 * 60 * 60;
		case "y":
			return num * 365 * 24 * 60 * 60;
		default:
			return num;
	}
}

export function generateAccessToken(data: Omit<User, "password_hash">) {
	return new SignJWT(data)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuer(JWT_ISS)
		.setIssuedAt()
		.setAudience(JWT_AUD)
		.setExpirationTime(process.env["JWT_ACCESS_TOKEN_EXP"]!)
		.sign(JWT_SECRET);
}

export async function generateRefreshToken(userId: string) {
	const token = uuid.v4();
	const expTime = resolveExpirationSec(process.env["JWT_REFRESH_TOKEN_EXP"]!);

	if (!expTime) {
		throw "Invalid expiration time format.";
	}

	await redisClient.set(`refresh_token:${token}`, userId, {
		expiration: {
			type: "EX",
			value: expTime
		},
		condition: "NX"
	});
	return token;
}

export async function verifyAccessToken(token: string) {
	const result = await jwtVerify(token, JWT_SECRET, {
		issuer: JWT_ISS,
		audience: JWT_AUD
	}).catch(() => null);

	return result?.payload as Omit<User, "password_hash"> | undefined;
}
