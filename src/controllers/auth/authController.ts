import {Request, Response, NextFunction} from "express";
import {loginSchema, registerSchema} from "../../validation/authValidation";
import {createToken} from "../../helpers/auth/authHelpers";
import {db} from "../../helpers/db/dbHelpers";
import {Users} from "../../models/userModel";
import {eq} from "drizzle-orm";

export const login = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const loginData = loginSchema.parse(req.body);
		const [user] = await db.select().from(Users).where(eq(Users.email, loginData.email)).limit(1);
		if (!user) {
			res.status(401).json({message: "Invalid email or password"});
			return;
		}
		const token = createToken({email: user.email, id: user.id});
		res.status(200).json({message: "Login successful", access: token});
	} catch (error) {
		next(error);
	}
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const registerData = registerSchema.parse(req.body);
		const oldUser = await db.select().from(Users).where(eq(Users.email, registerData.email)).limit(1);
		if (oldUser) {
			res.status(400).json({message: "A user with this email already exists"});
			return;
		}
		const user: typeof Users.$inferInsert = {
			name: registerData.name,
			// generate a random text clientId of 6 digits and characters
			clientId: Math.random().toString(36).substring(2, 8),
			age: registerData.age,
			email: registerData.email,
			password: registerData.password,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		const result = await db.insert(Users).values(user);
		if (result.rowsAffected === 1) {
			const token = createToken({email: user.email, id: user.id});
			res.status(201).json({message: "Register successful", access: token});
		}
		res.status(400).json({message: "Register failed"});
	} catch (error) {
		next(error);
	}
};
