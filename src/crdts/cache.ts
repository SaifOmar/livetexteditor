import {Doc} from "../crdts/main";

const cachedDocs: Map<string, Doc> = new Map();

export const addDocToCache = (doc: Doc): Doc => {
	cachedDocs.set(doc.uuid, doc);
	return doc;
};
export const getDocFromCache = (uuid: string): Doc | undefined => {
	return cachedDocs.get(uuid);
};
export const deleteDocFromCache = (uuid: string): void => {
	cachedDocs.delete(uuid);
};
