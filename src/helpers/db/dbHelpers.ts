import {createClient} from "@libsql/client";
import config from "../../config/config";
import {drizzle} from "drizzle-orm/libsql";
import {Documents} from "../../models/documentModels";
import {Users} from "../../models/userModel";
import {eq} from "drizzle-orm";
import jwt from "jsonwebtoken";

export const client = createClient({url: config.dbFileName});
export const db = drizzle({client});
export const saveDocument = async (saveToDatabase: Function, updateCache: Function, doc: typeof Documents) => {
	try {
		updateCache(doc);
		const result = await saveToDatabase(doc);
		if (result.rowsAffected === 1) {
			return result;
		}
	} catch (error) {
		console.log("Error saving document: ", error);
		throw error;
	}
};

export const getUserFromToken = async (token: string) => {
	try {
		const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
		return getUserFromDecodedToken(decodedToken);
	} catch (error) {
		console.log("Error getting user from token: ", error);
		throw error;
	}
};

export const getUserFromDecodedToken = async (decodedToken: any) => {
	const [user] = await db.select().from(Users).where(eq(Users.email, decodedToken.email)).limit(1);
	return user;
};
