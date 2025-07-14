import {db} from "../../helpers/db/dbHelpers";
import {Request, Response, NextFunction} from "express";
import {Documents} from "../../models/documentModels";
import {eq} from "drizzle-orm";
import io from "../../server";

io.on("connection", (socket) => {
	console.log("A user connected");
	socket.on("join-doc", (id: string) => {
		const roomName = `doc-${id}`;
		socket.join(roomName);
		console.log(`A user joined the room ${roomName}`);
	});
	socket.on("update-doc", (doc: any, content: string) => {
		const roomName = `doc-${doc.id}`;
		socket.to(roomName).emit("update-doc", doc);
		console.log("A user updated the document");
	});
	socket.on("disconnect", () => {
		// when a user disconnects, we remove them from the room
		console.log("A user disconnected");
	});
});

export const getDocById = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const doc = await db.select().from(Documents).where(eq(Documents.uuid, req.params.id)).limit(1);
		if (!doc) {
			res.status(404).json({message: "Document not found"});
			return;
		}
		res.json(doc);
	} catch (error) {
		next(error);
	}
};

export const getDocs = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const [docs] = await db
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
