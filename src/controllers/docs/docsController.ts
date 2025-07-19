import {db, getUserFromDecodedToken} from "../../helpers/db/dbHelpers";
import {Documents} from "../../models/documentModels";
import {Request, Response, NextFunction} from "express";
import {eq, sql} from "drizzle-orm";
import {Doc, loadDoc, Operation} from "../../crdts/main";
import {addDocToCache, getDocFromCache, deleteDocFromCache} from "../../crdts/cache";
import {decodeToken} from "../../helpers/auth/authHelpers";
import io from "../../server";
import config from "../../config/config";
import Logger from "../../helpers/logger";
const logger = Logger.getInstance(config.logFile);

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
				logger.info(`Doc ${req.params.uuid} found in cache`);
				res.json(cachedDoc);
				io.emit("join-doc", cachedDoc.uuid);
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
				logger.info(`Doc ${req.params.uuid} addet to cache`);
				res.json(loadedDoc);
				io.emit("join-doc", loadedDoc.uuid);
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
		const doc = new Doc([]);
		const newDoc: typeof Documents.$inferInsert = {
			uuid: doc.uuid,
			user_id: user.id,
			text: "",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		const dbDoc = await db.insert(Documents).values(newDoc);
		if (dbDoc.rowsAffected === 1) {
			addDocToCache(doc);
			logger.info(`Doc ${doc.uuid} stored`);
			res.status(201).json({message: "Document stored", doc: doc});
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
				payload: "c",
				prevPosition: null,
				nextPosition: null,
				clientId: user.clientId,
				timestamp: new Date(),
				commited: false,
			};
			const updatedCachedDoc = cachedDoc.insert("c", 10).insert("x", 1).insert("a", 4).updateDoc();
			io.emit("update-doc-server", updatedCachedDoc, req.body.text);
			await db.insert(Documents).values({uuid: updatedCachedDoc.uuid, text: updatedCachedDoc.toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()});
			res.status(200).json({message: "Document updated", doc: {uuid: updatedCachedDoc.uuid, text: updatedCachedDoc.toString(), changes: updatedCachedDoc.getChanges()}});
			return;
		} else {
			console.log("cache miss");
			// load the doc from the db and add it  to the cache then update it and return updated to socket
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
		deleteDocFromCache(req.params.uuid);
		io.emit("doc-deleted", req.params.uuid);
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
			res.status(200).json({message: "Document deleted", doc: deleted});
		}
		res.status(400).json({message: "Error deleting document"});
	} catch (error) {
		next(error);
	}
};
