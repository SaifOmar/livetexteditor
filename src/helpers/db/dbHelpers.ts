import { createClient } from "@libsql/client";
import config from "../../config/config";
import { drizzle } from "drizzle-orm/libsql";

export const client = createClient({ url: config.dbFileName });
export const db = drizzle({ client });
