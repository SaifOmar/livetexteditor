import {z} from "zod";

// need to create a custom object type for char
export const updateCrdtSchema = z.object({
	type: z.string(),
	clientId: z.string(),
	char: z.object({
		id: z.string(),
		value: z.string(),
		afterId: z.string().nullable(),
		timestamp: z.string(),
		deleted: z.boolean(),
	}),
	afterId: z.string().nullable,
	timestamp: z.string(),
});
