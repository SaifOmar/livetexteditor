import app from "./app";
import config from "./config/config";
import {Server} from "socket.io";
import setUpSocket from "./socket";

const server = app.listen(config.port, () => {
	console.log(`Server running on port ${config.port}`);
});

const io = new Server(server, {cors: {origin: "*"}});
setUpSocket(io);
export default io;
