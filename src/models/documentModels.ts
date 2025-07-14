import {int, sqliteTable, text} from "drizzle-orm/sqlite-core";

export const Documents = sqliteTable("documents_table", {
	id: int().primaryKey({autoIncrement: true}),
	uuid: text().notNull(),
	text: text().notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});
