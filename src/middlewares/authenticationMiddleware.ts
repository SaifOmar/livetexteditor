import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers.authorization;
	if (token) {
		jwt.verify(token, process.env.JWT_SECRET!, (err, _) => {
			if (err) {
				res.status(401).json("Unauthorized");
			} else {
				next();
			}
		});
	}
};
