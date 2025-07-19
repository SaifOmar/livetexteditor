import fs from "fs";
import path from "path";

class Logger {
	private readonly filePath: string;
	private file: fs.WriteStream;
	public static instance: Logger;

	constructor(fileName: string) {
		if (fileName.includes(".log")) {
			fileName = fileName.replace(".log", "");
		}
		this.filePath = `${process.cwd()}/logs/${fileName}.log`;
		this.file = this.createFile();
	}
	public static getInstance(fileName: string): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger(fileName);
		}
		return Logger.instance;
	}

	public static close(): void {
		if (Logger.instance) {
			Logger.instance.file.close();
		}
	}
	private createFile(): fs.WriteStream {
		const dir = path.dirname(this.filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, {recursive: true});
		}
		return fs.createWriteStream(this.filePath, {flags: "a"});
	}
	public info(message: string): void {
		this.file.write(this.format(message, "INFO"));
	}
	public debug(message: string): void {
		this.file.write(this.format(message, "DEBUG"));
	}
	public log(message: string): void {
		this.file.write(this.format(message, "LOG"));
	}
	private format(message: string, level: string): string {
		return `${new Date().toISOString()} ${level}: ${message}\n`;
	}
	public error(message: string): void {
		this.file.write(this.format(message, "ERROR"));
	}

	public json(message: string, data: any): void {
		this.file.write(this.format(`${message}: ${JSON.stringify(data, null, 2)}`, "DATA"));
	}
	public logToConsole(message: string): void {
		console.log(message);
	}
}
export default Logger;
