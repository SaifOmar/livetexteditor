import express from "express";
import mainRoutes from "./routes/mainRoutes";
import tryRoutes from "./routes/tryRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import config from "./config/config";
import { drizzle } from "drizzle-orm/libsql";

// const db = drizzle(config.dbFileName!);
const app = express();

app.use(express.json());

// Routes
app.use("", mainRoutes);
app.use("/try", tryRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
