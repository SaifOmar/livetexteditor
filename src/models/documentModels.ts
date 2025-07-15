import {int, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {Users} from "./userModel";

export const Documents = sqliteTable("documents_table", {
	id: int().primaryKey({autoIncrement: true}),
	uuid: text().notNull(),
	user_id: int()
		.default(1)
		.references(() => Users.id)
		.notNull(),
	text: text().notNull(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});
