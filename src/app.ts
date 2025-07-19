import express from "express";
import mainRoutes from "./routes/mainRoutes";
import tryRoutes from "./routes/tryRoutes";
import {errorHandler} from "./middlewares/errorHandler";
import cors from "cors";
import config from "./config/config";
import Logger from "./helpers/logger";

const app = express();
const logger = Logger.getInstance(config.logFile);
// logg errors to the console
app.use((req, res, next) => {
	res.on("finish", () => {
		const err = res.locals.error;
		if (err) {
			logger.error(err.message);
			logger.logToConsole(err.message);
		}
	});
	next();
});
app.use((req, res, next) => {
	logger.logToConsole(`[${new Date().toUTCString()}] ${req.method} ${req.originalUrl}`);
	// console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
	next();
});

// const db = drizzle(config.dbFileName!);
app.use("/files", express.static("public"));
app.use(express.json());
app.use(cors());

// Routes
app.use("", mainRoutes);
app.use("/try", tryRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
