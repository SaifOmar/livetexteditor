import {Server} from "socket.io";
import {Operation} from "./crdts/main";

const setUpSocket = (io: Server) => {
	io.on("connection", (socket) => {
		console.log("A user connected");

		socket.on("join-doc", (uuid: string) => {
			const roomName = `doc-${uuid}`;
			socket.join(roomName);
			console.log(`User ${socket.id} joined room ${roomName}`);
			// Optional: notify other users in the room that someone joined
			socket.to(roomName).emit("user-joined", {userId: socket.id});
		});

		/// this will be called when the client sends operations to the server
		/// the server should authenticate the client
		/// then process the operation and send the updates to the clients joining the room
		socket.on("update-doc-client", (doc: any, operation: Operation) => {
			const roomName = `doc-${doc.uuid}`;
			// This only sends to OTHER users in the room (not the sender)
			socket.to(roomName).emit("update-doc-server", doc);
			console.log(`User ${socket.id} updated document in room ${roomName}`);
		});

		socket.on("disconnect", () => {
			console.log(`User ${socket.id} disconnected`);
			// Socket.IO automatically removes the user from all rooms on disconnect
		});
	});
};

export default setUpSocket;
