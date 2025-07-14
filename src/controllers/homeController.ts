import {Request, Response, NextFunction} from "express";
import {db} from "../helpers/db/dbHelpers";

export const home = (req: Request, res: Response, next: NextFunction) => {
	try {
		res.json(db);
	} catch (error) {
		next(error);
	}
};
