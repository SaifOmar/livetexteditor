import {createRandomDocId} from "../helpers/helper";

interface Operation {
	type: string;
	char: Character | string;
	clientId: string;
	afterId: string | null;
	timestamp: Date;
	commited: boolean;
}

class Character {
	constructor(
		// id is an id of the character with the first part of it being the index and the second part is the client id
		public id: string,
		public value: string,
		// afterId is the id of the character that this character comes after
		public afterId: string | null,
		public timestamp: Date,
		public deleted: boolean = false,
	) {}
	public toString() {
		return this.value;
	}
}

class Doc {
	constructor(
		public text: Character[],
		public uuid: string = createRandomDocId(),
		public changed: boolean = false,
		private opLog: Operation[] = [],
		private changes: Character[] = [],
	) {}
	public toString() {
		return this.text.map((char) => char.toString()).join("");
	}
	// return the number of characters in the document counting white space too
	public getLength() {
		return this.text.length;
	}
	public getChar(id: string): Character {
		const char = this.text.find((char) => char.id === id);
		if (!char) throw new Error("Character not found");
		return char;
	}
	public insert(operation: Operation) {
		this.changed = true;
		this.opLog.push(operation);
		return this;
	}
	public delete(operation: Operation) {
		this.changed = true;
		this.opLog.push(operation);
		return this;
	}
	public sendNewUpdate(operation: Operation) {
		this.changed = true;
		this.opLog.push(operation);
		return this;
	}
	public getOpLog(): any[] {
		return this.opLog;
	}
	public updateDoc() {
		const opLog = this.getOpLog().sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
		opLog.forEach((op) => {
			const [text, result] = update(op, this.text);
			if (result !== "failed" || result !== "not_found") {
				this.text = text;
				op.commited = true;
				this.addChange(op.char);
			}
		});
		this.changed = false;
		this.opLog = this.opLog.filter((op) => !op.commited);
		return this;
	}
	private addChange(char: Character): void {
		this.changes.push(char);
	}
	public getChanges(): Character[] {
		return this.changes;
	}
}

function insertOperation(op: any, text: Character[]): any[] {
	const char = new Character(computeId(op.clientId, op.afterId), op.char, op.afterId, op.timestamp);
	if (text.length === 0) {
		text.push(char);
		return [text, "inserted"];
	}
	const index = text.findIndex((char) => char.id === op.afterId);
	if (index === -1) return [text, "not_found"];
	text.splice(index + 1, 0, char);
	return [text, "inserted"];
}

function deleteOperation(op: any, text: Character[]): any[] {
	const char = text.find((char) => char.id === op.char.id);
	if (char) {
		char.deleted = true; // tombstone
		text.splice(text.indexOf(char), 1);
		return [text, "deleted"];
	}
	return [text, "not_found"];
}

function update(op: any, text: Character[]): any[] {
	if (op.type === "insert") {
		return insertOperation(op, text);
	} else if (op.type === "delete") {
		return deleteOperation(op, text);
	}
	return [text, "failed"];
}

function computeId(clientId: string, afterId: string | null): string {
	if (afterId === null) return `1-${clientId}`;
	const [oldId, _] = afterId.split("-");
	return `${parseInt(oldId) + 1}-${clientId}`;
}

function loadChararcters(text: string, clientId: string): Character[] {
	return text.split("").map((char, index) => {
		return new Character(
			computeId(clientId, index === 0 ? null : `${index}-${clientId}`), // Use index, not index + 1
			char,
			index === 0 ? null : `${index}-${clientId}`, // Reference to actual previous ID
			new Date(),
		);
	});
}

function loadDoc(uuid: string, text: string, clientId: string): Doc {
	const docText = loadChararcters(text, clientId);
	return new Doc(docText, uuid);
}

export {Doc, Character, Operation, loadDoc, loadChararcters, computeId};
