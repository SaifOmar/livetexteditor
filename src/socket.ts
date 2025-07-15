import {Server} from "socket.io";
const setUpSocket = (io: Server) => {
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
};
export default setUpSocket;
