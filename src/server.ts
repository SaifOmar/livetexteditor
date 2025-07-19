import app from "./app";
import {Server} from "socket.io";
import setUpSocket from "./socket";
import config from "./config/config";
import Logger from "./helpers/logger";

const server = app.listen(config.port, () => {
	console.log(`Server running on port ${config.port}`);
});

const io = new Server(server, {cors: {origin: "*"}});
setUpSocket(io);

process.on("exit", () => Logger.close());

export default io;
module.exports = io;
