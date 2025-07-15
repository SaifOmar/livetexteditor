import {createClient} from "@libsql/client";
import config from "../../config/config";
import {drizzle} from "drizzle-orm/libsql";
import {Documents} from "../../models/documentModels";

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
