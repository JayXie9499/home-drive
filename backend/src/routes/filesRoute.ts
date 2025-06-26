import { Router } from "express";
import multer from "multer";
import { randomBytes } from "crypto";
import { authenticateToken } from "src/middlewares/authenticate";
import * as filesController from "../controllers/filesController";

const router = Router();
const upload = multer({
	storage: multer.diskStorage({
		filename: (_req, file, cb) =>
			cb(null, randomBytes(16).toString("hex") + file.originalname),
		destination: process.env["TEMP_STORAGE"]
	})
});

router.use(authenticateToken);

router.post(
	"/upload",
	upload.array("files", 10),
	filesController.filesUpload
);

export default router;
