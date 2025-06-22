import { Router, json } from "express";
import * as authController from "../controllers/authController";

const router = Router();

router.post("/login", json(), authController.loginUser);

router.post("/logout", authController.logoutUser);

router.post("/refresh", authController.refreshTokens);

export default router;
