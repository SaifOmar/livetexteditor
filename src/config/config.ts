import dotenv from "dotenv";

dotenv.config();

interface Config {
	port: number;
	nodeEnv: string;
	jwtSecret: string;
	dbFileName: string;
}

const config: Config = {
	port: Number(process.env.PORT) || 3000,
	nodeEnv: process.env.NODE_ENV || "development",
	jwtSecret: process.env.JWT_SECRET || "supersecretkey",
	dbFileName: process.env.DB_FILE_NAME || "file:database.db",
};

export default config;
