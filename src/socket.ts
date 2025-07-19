import {Server} from "socket.io";
import {getDocFromCache} from "./crdts/cache";
import Logger from "./helpers/logger";

import config from "./config/config";

const logger = Logger.getInstance(config.logFile);

const setUpSocket = (io: Server) => {
	io.on("connection", (socket) => {
		console.log("A user connected");

		socket.on("join-doc", (uuid: string) => {
			const roomName = `doc-${uuid}`;
			socket.join(roomName);
			// console.log(`User ${socket.id} joined room ${roomName}`);
			logger.info(`User ${socket.id} joined room ${roomName}`);
			// Optional: notify other users in the room that someone joined
			socket.to(roomName).emit("user-joined", {userId: socket.id});
		});
		/// this will be called when the client sends operations to the server
		/// the server should authenticate the client
		/// then process the operation and send the updates to the clients joining the room
		socket.on("update-doc-client", (uuid: string, charArg: string, index: number | null) => {
			const roomName = `doc-${uuid}`;
			const doc = getDocFromCache(uuid);
			if (!doc) {
				logger.error(`User ${socket.id} tried to update document ${uuid} but it was not found in cache`);
				// console.log(`User ${socket.id} tried to update document ${uuid} but it was not found in cache`);
				socket.to(roomName).emit("server-error", {message: "Document not found"});
			}
			// delete case
			if (index === null) {
				doc!.delete(charArg);
				logger.info(`User ${socket.id} deleted char ${doc?.getChar(charArg)} from document ${uuid}`);
				logger.info(`Doc ${uuid} updated`);
				logger.info(`Doc ${uuid} changes: ${doc!.getChanges()}`);
				logger.info(`Doc text is now ${doc!.toString()}`);
				socket.to(roomName).emit("update-doc-server", doc);
				// insert case
			} else if (typeof index === "number") {
				doc!.insert(charArg, index);
				logger.info(`User ${socket.id} inserted char ${charArg} at index ${index} in document ${uuid}`);
				logger.info(`Doc ${uuid} updated`);
				logger.info(`Doc ${uuid} changes: ${doc!.getChanges()}`);
				logger.info(`Doc text is now ${doc!.toString()}`);
				socket.to(roomName).emit("update-doc-server", doc);
			}
		});

		socket.on("disconnect", () => {
			logger.info(`User ${socket.id} disconnected`);
			// console.log(`User ${socket.id} disconnected`);
			// Socket.IO automatically removes the user from all rooms on disconnect
		});
	});
};

export default setUpSocket;
