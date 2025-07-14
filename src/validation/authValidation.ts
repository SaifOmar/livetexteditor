import {z} from "zod";

export const loginSchema = z.object({
	email: z.email().min(1).max(100),
	password: z.string().min(6).max(100),
});

export const registerSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.email().min(1).max(100),
	age: z.number().min(1).max(100),
	password: z.string().min(6).max(100),
	confirmPassword: z.string().min(6).max(100),
});
