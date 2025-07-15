import {db} from "../../helpers/db/dbHelpers";
import {Documents} from "../../models/documentModels";
import {Request, Response, NextFunction} from "express";
import {eq, sql} from "drizzle-orm";
import {Doc, loadDoc} from "../../crdts/main";
import {addDocToCache, getDocFromCache, deleteDocFromCache} from "../../crdts/cache";

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

				const loadedDoc = addDocToCache(loadDoc(doc.uuid, doc.text, "A"));
				const ob = {
					uuid: loadedDoc.uuid,
					text: loadedDoc.toString(),
					changes: loadedDoc.getChanges(),
					// changed: loadedDoc.changed,
					// opLog: loadedDoc.getOpLog(),
				};

				res.json(ob);
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
	try {
		const docUUID = new Doc([]).uuid;
		const newDoc: typeof Documents.$inferInsert = {
			uuid: docUUID,
			// need a way to get the user from the request
			user_id: 1,
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
		const updated = await db.update(Documents).set({text: req.body.text, updatedAt: new Date().toISOString()}).where(eq(Documents.uuid, doc.uuid)).limit(1);
		if (updated.rowsAffected === 1) {
			res.status(200).json({message: "Document updated", doc: updated});
		}
		res.status(400).json({message: "Error updating document"});
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
