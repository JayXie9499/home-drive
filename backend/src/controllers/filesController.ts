import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { connectPostgres } from "../utils/database";
import { logger } from "../utils/logger";

export async function filesUpload(req: Request, res: Response) {
	const files = req.files;
	const data = req.body["data"];

	if (!Array.isArray(files) || !files.length) {
		res
			.status(400)
			.json({ message: "Invalid file data or no files were uploaded" });
		return;
	}
	if (!Array.isArray(data) || data.length !== files.length) {
		res
			.status(400)
			.json({ message: "Body data size doesn't match number of files." });
		return;
	}

	const results = [];
	const postgres = await connectPostgres();

	for (let i = 0; i < files.length; i++) {
		const file = files[i];

		try {
			const parsedPath = path.parse(file.originalname);
			const escapedName = parsedPath.name.replace(
				/[.*+?^${}()|[\]\\]/g,
				"\\$&"
			);
			const escapedExt = parsedPath.ext.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const dupeNameExists = await postgres.query(
				`
        SELECT * FROM Items
        WHERE name ~ $1
        AND owner_id = $2
        AND (parent_id = $3 OR ($3 IS NULL AND parent_id IS NULL))
        `,
				[`^${escapedName}(?: \\(\\d+\\))?${escapedExt}$`, req.user, req.body]
			);

			if (dupeNameExists.rowCount) {
				file.originalname = `${parsedPath.name} (${dupeNameExists.rowCount})${parsedPath.ext}`;
			}

			const queryResult = await postgres.query(
				`
        INSERT INTO Items (owner_id, parent_id, name, size, mime)
        VALUES ($1, $2, $3, $4, $5)
        `,
				[
					req.user,
					data[i].parent_id,
					file.originalname,
					file.size,
					file.mimetype
				]
			);

			results.push(queryResult.rows[0]);
		} catch (err) {
			logger.error("Failed to insert uploaded file data.", err);

			if (file && file.path) {
				fs.unlink(file.path, (err) => {
					if (err) {
						logger.error(
							`Error deleting failed upload file: ${file.path}`,
							err
						);
					}
				});
			}
		}
	}

	postgres.release();

	if (results.length === files.length) {
		res
			.status(200)
			.json({ message: "Successfully uploaded all files.", uploaded: results });
	} else if (results.length) {
		res
			.status(207)
			.json({ message: "Some uploads failed.", uploaded: results });
	} else {
		res.status(400).json({ message: "Failed to uplaod files." });
	}
}
