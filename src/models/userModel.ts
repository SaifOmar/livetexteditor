import {int, sqliteTable, text} from "drizzle-orm/sqlite-core";

export const Users = sqliteTable("users_table", {
	id: int().primaryKey({autoIncrement: true}),
	clientId: text().notNull().default("default"),
	name: text().notNull(),
	age: int().notNull(),
	email: text().notNull().unique(),
	password: text().notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});
