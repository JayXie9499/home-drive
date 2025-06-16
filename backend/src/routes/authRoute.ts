import { Router, json } from "express";
import * as authController from "../controllers/authController";

const router = Router();

router.post("/login", json(), authController.loginUser);

router.post("/logout", authController.logoutUser);

export default router;
