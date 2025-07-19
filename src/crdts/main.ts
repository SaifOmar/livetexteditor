import {createRandomDocId} from "../helpers/helper";

interface Operation {
	type: string;
	payload: Character | string;
	clientId: string;
	prevPosition: string | null;
	nextPosition: string | null;
	timestamp: Date;
	commited: boolean;
}

class Character {
	constructor(
		// id is an id of the character with the first part of it being the index and the second part is the client id
		public id: string,
		public value: string,
		// position is the fractional position string used for ordering
		public position: string,
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
		// Filter out deleted characters and sort by position
		return this.text
			.filter((char) => !char.deleted)
			.sort((a, b) => a.position.localeCompare(b.position))
			.map((char) => char.toString())
			.join("");
	}
	// public recievedOperations(operations: Operation[]): Doc {
	// 	operations.forEach((op) => {
	// 		if (op.type === "insert") {
	// 			this.insert(op.payload, op.nextPosition);
	// 			this.updateDoc();
	// 		} else if (op.type === "delete") {
	// 			this.delete(op.payload);
	// 			this.updateDoc();
	// 		}
	// 	});
	// 	return this;
	// }

	// return the number of characters in the document counting white space too
	public getLength() {
		return this.text.filter((char) => !char.deleted).length;
	}

	public getChar(id: string): Character {
		const char = this.text.find((char) => char.id === id);
		if (!char) throw new Error("Character not found");
		return char;
	}

	/**
	 * Inserts a character at the given index, by createing a unique ID for the character and computing the correct position.
	 * If the index is out of bounds, it will insert at the end.
	 * @param charValue The value of the character to insert.
	 * @param index The index at which to insert the character.
	 */
	public insert(charValue: string, index: number) {
		// Get the sorted, non-deleted characters to find correct positions
		const visibleChars = this.text.filter((char) => !char.deleted).sort((a, b) => a.position.localeCompare(b.position));

		// Find the prev and next positions at the given index
		const prev = index > 0 ? visibleChars[index - 1] : null;
		const next = index < visibleChars.length ? visibleChars[index] : null;

		const operation: Operation = {
			type: "insert",
			payload: charValue,
			clientId: "default", // Should be passed as parameter in real implementation
			prevPosition: prev ? prev.position : null,
			nextPosition: next ? next.position : null,
			timestamp: new Date(),
			commited: false,
		};

		this.opLog.push(operation);
		this.changed = true;

		// Apply operation immediately for synchronous behavior
		this.updateDoc();
		return this;
	}
	/**
	 * Deletes the character with the given ID.
	 * @param charId The ID of the character to delete.
	 */
	public delete(charId: string) {
		const operation: Operation = {
			type: "delete",
			payload: charId, // Should be the character ID, not the character object
			clientId: "default",
			prevPosition: null, // Not needed for delete operations
			nextPosition: null, // Not needed for delete operations
			timestamp: new Date(),
			commited: false,
		};

		this.opLog.push(operation);
		this.changed = true;

		// Apply operation immediately for synchronous behavior
		this.updateDoc();
		return this;
	}

	public sendNewUpdate(operation: Operation) {
		this.changed = true;
		this.opLog.push(operation);
		return this;
	}

	public getOpLog(): Operation[] {
		return this.opLog;
	}

	public updateDoc() {
		if (this.opLog.length === 0) return this;

		// Sort by timediff first, if no timediff resort to clientId
		const opLog = this.getOpLog().sort((a, b) => {
			const timeDiff = a.timestamp.getTime() - b.timestamp.getTime();
			if (timeDiff === 0) return a.clientId.localeCompare(b.clientId);
			return timeDiff;
		});

		const newChars: Character[] = [];
		opLog.forEach((op) => {
			if (op.type === "insert") {
				const [newChar, result] = generateCharWithId(op);
				if (result === "generated" && newChar) {
					// Check if character already exists to avoid duplicates
					const existingChar = this.text.find((char) => char.id === newChar.id);
					if (!existingChar) {
						newChars.push(newChar);
						this.addChange(newChar);
					}
				} else if (result === "error") {
					return this;
					// TODO: Handle error
				}
				op.commited = true;
			} else if (op.type === "delete") {
				const [_, result] = deleteOperation(op, this.text);
				if (result === "deleted") {
					op.commited = true;
				} else {
					return this;
					// TODO: Handle error
				}
			}
		});

		// Add all the newly created characters to the main text array
		this.text.push(...newChars);

		// Remove committed operations
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

function generateCharWithId(op: Operation): [Character | null, string] {
	try {
		const newPosition = computePosition(op.prevPosition, op.nextPosition);
		const uniqueId = `${op.timestamp.getTime()}-${op.clientId}-${Math.random().toString(36).substr(2, 9)}`;
		const char = new Character(uniqueId, op.payload as string, newPosition, op.timestamp);
		return [char, "generated"];
	} catch (e) {
		return [null, "error"];
	}
}

// The payload of a delete operation should be the Character's unique ID
function deleteOperation(op: Operation, text: Character[]): [Character[], string] {
	// op.payload should be the uniqueId of the character to delete
	const charToDelete = text.find((char) => char.id === op.payload);
	if (charToDelete) {
		charToDelete.deleted = true; // Set the tombstone
		return [text, "deleted"];
	}
	return [text, "not_found"];
}

function computeId(timestamp: Date, clientId: string): string {
	return `${timestamp.getTime()}-${clientId}`;
}

function loadCharacters(text: string, clientId: string): Character[] {
	const characters: Character[] = [];
	let lastPosition: string | null = null;

	for (let i = 0; i < text.length; i++) {
		const position = computePosition(lastPosition, null);
		const charValue = text[i];
		const uniqueId = `${Date.now() + i}-${clientId}`; // Ensure unique IDs

		const char = new Character(uniqueId, charValue, position, new Date());
		characters.push(char);
		lastPosition = position;
	}
	return characters;
}

function loadDoc(uuid: string, text: string, clientId: string): Doc {
	const docText = loadCharacters(text, clientId);
	return new Doc(docText, uuid);
}

// A base set of characters to generate positions from.
// const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/**
 * Generates a new position string between two existing positions.
 * @param prevPosition The position of the character before the insertion point.
 * @param nextPosition The position of the character after the insertion point.
 */
function computePosition(prevPosition: string | null, nextPosition: string | null): string {
	// Case 1: Inserting at the beginning of the document
	if (prevPosition === null && nextPosition === null) {
		return "m"; // Start with middle of alphabet
	}

	// Case 2: Inserting at the beginning
	if (prevPosition === null) {
		// Generate a position that comes before nextPosition
		const firstChar = nextPosition![0];
		if (firstChar > "a") {
			// Can insert between 'a' and firstChar
			const prevChar = String.fromCharCode(firstChar.charCodeAt(0) - 1);
			return prevChar;
		} else {
			// Need to go deeper
			return "a" + computePosition(null, nextPosition!.slice(1) || null);
		}
	}

	// Case 3: Inserting at the end
	if (nextPosition === null) {
		// Generate a position that comes after prevPosition
		const lastChar = prevPosition[prevPosition.length - 1];
		if (lastChar < "z") {
			const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
			return prevPosition.slice(0, -1) + nextChar;
		} else {
			// Need to extend the string
			return prevPosition + "m";
		}
	}

	// Case 4: Inserting in the middle
	const commonPrefix = getCommonPrefix(prevPosition, nextPosition);
	const prevSuffix = prevPosition.slice(commonPrefix.length);
	const nextSuffix = nextPosition.slice(commonPrefix.length);

	const prevChar = prevSuffix[0] || "a";
	const nextChar = nextSuffix[0] || "z";

	if (nextChar.charCodeAt(0) - prevChar.charCodeAt(0) > 1) {
		// Can insert between these characters
		const midChar = String.fromCharCode(prevChar.charCodeAt(0) + Math.floor((nextChar.charCodeAt(0) - prevChar.charCodeAt(0)) / 2));
		return commonPrefix + midChar;
	} else {
		// Need to go deeper
		return commonPrefix + prevChar + "m";
	}
}

function getCommonPrefix(str1: string, str2: string): string {
	let i = 0;
	while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
		i++;
	}
	return str1.slice(0, i);
}

export {Doc, Character, Operation, loadDoc, loadCharacters, computeId};
