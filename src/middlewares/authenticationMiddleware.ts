import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({message: "No token provided"});
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!);

		if (!decoded) {
			console.log("decoded is false");
			return res.status(401).json({message: "Invalid token"});
		}
		next();
	} catch (err) {
		return res.status(403).json({message: "Invalid or expired token"});
	}
};
