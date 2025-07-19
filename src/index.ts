// this will be the file that will be compiled to js
import io from "socket.io-client";
import {Character, Doc} from "./crdts/main";

type DocChar = {
	id: string;
	value: string;
};

const domain = "http://localhost:3000";
const docId = "06bjpwbu";
const editor = document.getElementById("editor")!;
const socket = io(domain);

async function loadDOC() {
	const url = `${domain}/docs/${docId}`;
	try {
		await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFsaWVuc2FpZjcyMkBnbWFpbC5jb20iLCJpZCI6MSwiaWF0IjoxNzUyNjc2MjkwfQ.F2PrVwN1HVc6KoPe2s42qSNXl1Ay79yD6Py4EG5svhY",
			},
		})
			.then((res) => res.json())
			.then((doc) => {
				console.log("text", doc.text);
				updateFromServer(doc.text);
			});
	} catch (error) {
		console.error("Failed to load document:", error);
	}
}

loadDOC();
let previousText = editor.textContent || "";
let docChars: DocChar[] = [];
let isUpdatingFromServer = false;

socket.on("connect", () => {
	console.log("Connected:", socket.id);
	socket.emit("join-doc", docId);
});

socket.on("user-joined", (data: any) => {
	console.log("user-joined", data);
});

socket.on("joined-room", (roomId: string) => {
	console.log("Joined room:", roomId);
});

socket.on("disconnect", () => {
	console.log("Disconnected");
});

socket.on("update-doc-server", (doc: Doc) => {
	console.log("update-doc-server", doc);
	updateFromServer(doc.text);
});

function updateFromServer(textArray: Character[]) {
	isUpdatingFromServer = true;

	docChars = textArray
		.filter((char) => !char.deleted)
		.map((char) => ({
			id: char.id || "",
			value: char.value || "",
		}));

	const plainText = docChars.map((char) => char.value).join("");

	// Preserve cursor position when updating from server
	const selection = window.getSelection();
	const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
	const cursorOffset = range ? range.startOffset : 0;

	editor.textContent = plainText;

	// Restore cursor position
	if (range && editor.firstChild) {
		try {
			const newRange = document.createRange();
			const textNode = editor.firstChild;
			const maxOffset = Math.min(cursorOffset, textNode.textContent?.length || 0);
			newRange.setStart(textNode, maxOffset);
			newRange.collapse(true);
			selection?.removeAllRanges();
			selection?.addRange(newRange);
		} catch (e) {
			// Cursor restoration failed, continue without it
			console.warn("Could not restore cursor position:", e);
		}
	}

	previousText = plainText;

	// Small delay to ensure DOM updates complete before allowing new input events
	setTimeout(() => {
		isUpdatingFromServer = false;
	}, 10);
}

editor.addEventListener("input", (event) => {
	// Prevent processing our own server updates
	if (isUpdatingFromServer) {
		return;
	}

	const newText = normalizeSpaces(editor.textContent || "");
	const change = getDiff(previousText, newText);

	console.log("Detected change:", change);

	if (change?.type === "insert") {
		socket.emit("update-doc-client", docId, change.insertedChar, change.index);
	} else if (change?.type === "delete") {
		const charMeta = docChars[change.index];
		if (charMeta) {
			socket.emit("update-doc-client", docId, charMeta.id, null);
		} else {
			console.warn("Could not find character to delete at index:", change.index);
		}
	}

	previousText = newText;
});

function getDiff(oldStr: string, newStr: string) {
	oldStr = normalizeSpaces(oldStr);
	newStr = normalizeSpaces(newStr);

	// Handle empty strings
	if (oldStr === "" && newStr === "") {
		return null;
	}

	if (oldStr === "" && newStr.length > 0) {
		return {
			type: "insert",
			index: 0,
			insertedChar: newStr[0],
		};
	}

	if (newStr === "" && oldStr.length > 0) {
		return {
			type: "delete",
			index: 0,
			deletedChar: oldStr[0],
		};
	}

	const minLength = Math.min(oldStr.length, newStr.length);
	let index = 0;

	// Find first difference
	while (index < minLength && oldStr[index] === newStr[index]) {
		index++;
	}

	if (oldStr.length > newStr.length) {
		return {
			type: "delete",
			index,
			deletedChar: oldStr[index],
		};
	} else if (oldStr.length < newStr.length) {
		return {
			type: "insert",
			index,
			insertedChar: newStr[index],
		};
	}

	return null;
}

/**
 * Utility: Normalize invisible non-breaking spaces and other whitespace issues.
 */
function normalizeSpaces(str: string): string {
	return str
		.replace(/\u00A0/g, " ") // Non-breaking spaces
		.replace(/\u200B/g, "") // Zero-width spaces
		.replace(/\uFEFF/g, ""); // Byte order marks
}
