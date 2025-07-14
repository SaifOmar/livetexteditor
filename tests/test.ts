import {Doc, Character} from "../src/crdts/main";

test("create a doc and add some characters check if it's correct", () => {
	const char = new Character("1-A", "h", null, new Date());
	const char2 = new Character("2-A", "e", "1-A", new Date());
	const char3 = new Character("3-A", "l", "2-A", new Date());
	const char4 = new Character("4-A", "l", "3-A", new Date());
	const char5 = new Character("5-A", "o", "4-A", new Date());
	const char6 = new Character("6-A", " ", "5-A", new Date());
	const doc = new Doc([char, char2, char3, char4, char5, char6]);

	expect(doc.toString()).toBe("hello ");
});

test("create a doc and insert some characters check if it's correct", () => {
	const doc = new Doc([]);
	doc.insert("h", "A", new Date(), null);
	doc.insert("e", "A", new Date(), "1-A");
	doc.insert("l", "A", new Date(), "2-A");
	doc.insert("l", "A", new Date(), "3-A");
	doc.insert("o", "A", new Date(), "4-A");
	doc.insert(" ", "A", new Date(), "5-A");
	doc.updateDoc();

	console.log(doc.toString());
	expect(doc.toString()).toBe("hello ");
});

test("create a doc and insert some characters check if it's correct", () => {
	const doc = new Doc([]);
	doc.insert("h", "A", new Date(), null);
	doc.insert("e", "A", new Date(), "1-A");
	doc.insert("l", "A", new Date(), "2-A");
	doc.insert("l", "A", new Date(), "3-A");
	doc.insert("o", "A", new Date(), "4-A");
	doc.insert(" ", "A", new Date(), "5-A");
	doc.updateDoc();
	doc.delete("A", new Date(), doc.getChar("1-A"));

	doc.updateDoc();

	console.log(doc.toString());
	expect(doc.toString()).toBe("ello ");
});
