import {db, getUserFromDecodedToken} from "../../helpers/db/dbHelpers";
import {Documents} from "../../models/documentModels";
import {Request, Response, NextFunction} from "express";
import {eq, sql} from "drizzle-orm";
import {Doc, loadDoc, Operation} from "../../crdts/main";
import {addDocToCache, getDocFromCache, deleteDocFromCache} from "../../crdts/cache";
import {decodeToken} from "../../helpers/auth/authHelpers";
import io from "../../server";

export const getDocs = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const docs = await db
			.select({
				uuid: Documents.uuid,
				createdAt: Documents.createdAt,
				updatedAt: Documents.updatedAt,
			})
			.from(Documents)
			.limit(10);
		res.json(docs);
	} catch (error) {
		next(error);
	}
};

export const getDocByUUID = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const token = req.headers.authorization;
		const decodedToken = decodeToken(token!.split(" ")[1]);
		const user = await getUserFromDecodedToken(decodedToken);
		if (!user) {
			res.status(401).json({message: "Unauthorized"});
			return;
		}
		try {
			const cachedDoc = getDocFromCache(req.params.uuid);
			if (cachedDoc !== undefined) {
				const ob = {
					uuid: cachedDoc.uuid,
					text: cachedDoc.toString(),
					changes: cachedDoc.getChanges(),
					// changed: loadedDoc.changed,
					// opLog: loadedDoc.getOpLog(),
				};
				res.json(ob);
				io.emit("join-doc", ob.uuid);
				return;
			} else {
				const [doc] = await db
					.select()
					.from(Documents)
					.where(sql`${Documents.uuid} ==${req.params.uuid}`)
					.limit(1);

				if (!doc) {
					res.status(404).json({message: "Document not found"});
					return;
				}

				const loadedDoc = addDocToCache(loadDoc(doc.uuid, doc.text, user.clientId));
				const ob = {
					uuid: loadedDoc.uuid,
					text: loadedDoc.toString(),
					changes: loadedDoc.getChanges(),
					// changed: loadedDoc.changed,
					// opLog: loadedDoc.getOpLog(),
				};

				res.json(ob);
				io.emit("join-doc", ob.uuid);
				return;
			}
		} catch (error) {
			next(error);
		}
		res.status(404).json({message: "Document not found"});
	} catch (error) {
		next(error);
	}
};
export const storeDoc = async (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers.authorization;
	const decodedToken = decodeToken(token!.split(" ")[1]);
	const user = await getUserFromDecodedToken(decodedToken);
	if (!user) {
		res.status(401).json({message: "Unauthorized"});
		return;
	}
	try {
		const docUUID = new Doc([]).uuid;
		const newDoc: typeof Documents.$inferInsert = {
			uuid: docUUID,
			// need a way to get the user from the request
			user_id: user.id,
			text: "",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		const doc = await db.insert(Documents).values(newDoc);
		if (doc.rowsAffected === 1) {
			const [restultDoc] = await db.select().from(Documents).where(eq(Documents.uuid, docUUID)).limit(1);
			res.status(201).json({message: "Document stored", doc: restultDoc});
			return;
		}
		res.status(400).json({message: "Error storing document"});
	} catch (error) {
		next(error);
	}
};
export const updateDoc = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const token = req.headers.authorization;
		const decodedToken = decodeToken(token!.split(" ")[1]);
		const user = await getUserFromDecodedToken(decodedToken);
		const cachedDoc = getDocFromCache(req.params.uuid);
		console.log("user.client id : ", user.clientId);

		if (cachedDoc !== undefined) {
			console.log("cache hit");
			const operation: Operation = {
				type: "insert",
				char: "l",
				clientId: user.clientId,
				afterId: "2-default",
				timestamp: new Date(),
				commited: false,
			};
			const updatedCachedDoc = cachedDoc.sendNewUpdate(operation).updateDoc();
			io.emit("update-doc-server", updatedCachedDoc, req.body.text);
			await db.insert(Documents).values({uuid: updatedCachedDoc.uuid, text: updatedCachedDoc.toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()});
			res.status(200).json({message: "Document updated", doc: {uuid: updatedCachedDoc.uuid, text: updatedCachedDoc.toString(), changes: updatedCachedDoc.getChanges()}});
			return;
		} else {
			console.log("cache miss");

			// load the doc from the db and add it  to the cache then update it and return updated to socket
			//
			const [doc] = await db
				.select({
					uuid: Documents.uuid,
					text: Documents.text,
					createdAt: Documents.createdAt,
					updatedAt: Documents.updatedAt,
				})
				.from(Documents)
				.where(eq(Documents.uuid, req.params.uuid))
				.limit(1);
			if (!doc) {
				res.status(404).json({message: "Document not found"});
				return;
			}
			const cachedDoc = addDocToCache(loadDoc(doc.uuid, doc.text, user.clientId));
			io.emit("update-doc-server", doc, req.body.text);
			res.status(200).json({message: "Document updated", doc: {uuid: cachedDoc.uuid, text: cachedDoc.toString(), changes: cachedDoc.getChanges()}});
			return;
		}
		// res.status(400).json({message: "Error updating document"});
	} catch (error) {
		next(error);
	}
};
export const deleteDoc = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const [doc] = await db
			.select({
				uuid: Documents.uuid,
				createdAt: Documents.createdAt,
				updatedAt: Documents.updatedAt,
			})
			.from(Documents)
			.where(eq(Documents.uuid, req.params.uuid))
			.limit(1);
		if (!doc) {
			res.status(404).json({message: "Document not found"});
			return;
		}
		const deleted = await db.delete(Documents).where(eq(Documents.uuid, doc.uuid)).limit(1);
		if (deleted.rowsAffected === 1) {
			deleteDocFromCache(req.params.uuid);
			res.status(200).json({message: "Document deleted", doc: deleted});
		}
		res.status(400).json({message: "Error deleting document"});
	} catch (error) {
		next(error);
	}
};
