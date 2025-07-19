// Test suite for CRDT implementation
// This shows expected outputs for various operations

import {Doc, Character, Operation, loadDoc, loadCharacters, computeId} from "../src/crdts/main";

// Mock the helper function
const createRandomDocId = () => `doc-${Date.now()}`;

console.log("=== CRDT Test Suite ===\n");

// Test 1: Basic Document Creation
console.log("TEST 1: Basic Document Creation");
const doc1 = loadDoc("test-doc", "Hello", "client1");
console.log("Initial text:", `"${doc1.toString()}"`);
console.log("Length:", doc1.getLength());
console.log("Characters count:", doc1.text.length);
console.log("Expected: 'Hello', length 5, 5 characters\n");

// Test 2: Position Generation
console.log("TEST 2: Position Generation");
const chars = loadCharacters("ABC", "client1");
chars.forEach((char, i) => {
	console.log(`Char ${i}: "${char.value}" at position "${char.position}"`);
});
console.log("Expected: Positions should be in ascending order (e.g., 'm', 'mm', 'mmm' or similar)\n");

// Test 3: Insert Operations
console.log("TEST 3: Insert Operations");
const doc2 = loadDoc("test-doc2", "Hello", "client1");
console.log("Before insert:", `"${doc2.toString()}"`);

// Insert 'X' at position 0 (beginning)
doc2.insert("X", 0);
doc2.updateDoc();
console.log("After inserting 'X' at position 0:", `"${doc2.toString()}"`);
console.log("Expected: 'XHello'\n");

// Insert 'Y' at position 3 (middle)
doc2.insert("Y", 3);
doc2.updateDoc();
console.log("After inserting 'Y' at position 3:", `"${doc2.toString()}"`);
console.log("Expected: 'XHeYllo'\n");

// Insert 'Z' at end
doc2.insert("Z", doc2.getLength());
doc2.updateDoc();
console.log("After inserting 'Z' at end:", `"${doc2.toString()}"`);
console.log("Expected: 'XHeYlloZ'\n");

// Test 4: Delete Operations
console.log("TEST 4: Delete Operations");
const doc3 = loadDoc("test-doc3", "Hello", "client1");
console.log("Before delete:", `"${doc3.toString()}"`);

// Delete first character
const firstChar = doc3.text.find((char) => !char.deleted);
if (firstChar) {
	doc3.delete(firstChar.id);
	doc3.updateDoc();
	console.log("After deleting first char:", `"${doc3.toString()}"`);
	console.log("Expected: 'ello'\n");
}

// Test 5: Concurrent Operations Simulation
console.log("TEST 5: Concurrent Operations Simulation");
const doc4 = loadDoc("test-doc4", "AB", "client1");
console.log("Initial:", `"${doc4.toString()}"`);

// Simulate two clients inserting at the same position
const op1: Operation = {
	type: "insert",
	payload: "X",
	clientId: "client1",
	prevPosition: null,
	nextPosition: doc4.text[0].position,
	timestamp: new Date(Date.now() + 1),
	commited: false,
};

const op2: Operation = {
	type: "insert",
	payload: "Y",
	clientId: "client2",
	prevPosition: null,
	nextPosition: doc4.text[0].position,
	timestamp: new Date(Date.now() + 2),
	commited: false,
};

doc4.sendNewUpdate(op1);
doc4.sendNewUpdate(op2);
doc4.updateDoc();
console.log("After concurrent inserts at beginning:", `"${doc4.toString()}"`);
console.log("Expected: 'XYAB' (X comes before Y due to earlier timestamp)\n");

// Test 6: Operation Log
console.log("TEST 6: Operation Log");
const doc5 = new Doc([]);
doc5.insert("A", 0);
doc5.insert("B", 1);
console.log("Operations before update:", doc5.getOpLog().length);
console.log("Expected: 2 operations\n");

doc5.updateDoc();
console.log("Operations after update:", doc5.getOpLog().length);
console.log("Expected: 0 operations (all committed)\n");

// Test 7: Tombstone Handling
console.log("TEST 7: Tombstone Handling");
const doc6 = loadDoc("test-doc6", "Hello", "client1");
const charToDelete = doc6.text[1]; // Delete 'e'
console.log("Before delete:", `"${doc6.toString()}"`);
console.log("Character to delete:", charToDelete.value);

doc6.delete(charToDelete.id);
doc6.updateDoc();
console.log("After delete:", `"${doc6.toString()}"`);
console.log("Total characters (including tombstones):", doc6.text.length);
console.log("Visible length:", doc6.getLength());
console.log("Expected: 'Hllo', 5 total chars, 4 visible\n");

// Test 8: Position Ordering
console.log("TEST 8: Position Ordering");
const doc7 = new Doc([]);
// Insert characters in reverse order
doc7.insert("C", 0);
doc7.updateDoc();
doc7.insert("B", 0);
doc7.updateDoc();
doc7.insert("A", 0);
doc7.updateDoc();
console.log("After inserting C, B, A at beginning:", `"${doc7.toString()}"`);
console.log("Expected: 'ABC' (proper ordering maintained)\n");

// Test 9: Edge Cases
console.log("TEST 9: Edge Cases");
const emptyDoc = new Doc([]);
console.log("Empty document:", `"${emptyDoc.toString()}"`);
console.log("Empty document length:", emptyDoc.getLength());
console.log("Expected: '', length 0\n");

// Insert into empty document
emptyDoc.insert("X", 0);
emptyDoc.updateDoc();
console.log("After inserting into empty doc:", `"${emptyDoc.toString()}"`);
console.log("Expected: 'X'\n");

// Test 10: Complex Scenario
console.log("TEST 10: Complex Scenario");
const doc8 = loadDoc("test-doc8", "Hello World", "client1");
console.log("Initial:", `"${doc8.toString()}"`);

// Multiple operations
doc8.insert("!", doc8.getLength()); // Add exclamation at end
doc8.updateDoc();
console.log("After adding '!':", `"${doc8.toString()}"`);

// Delete space
const spaceChar = doc8.text.find((char) => char.value === " " && !char.deleted);
if (spaceChar) {
	doc8.delete(spaceChar.id);
	doc8.updateDoc();
	console.log("After deleting space:", `"${doc8.toString()}"`);
}

// Insert at middle
doc8.insert("_", 5);
doc8.updateDoc();
console.log("After inserting '_' at position 5:", `"${doc8.toString()}"`);
console.log("Expected: 'Hello_World!' (or similar based on space deletion)\n");

console.log("=== Test Suite Complete ===");
console.log("\nKey Expected Behaviors:");
console.log("1. toString() should return only non-deleted characters in position order");
console.log("2. getLength() should return count of visible characters only");
console.log("3. Positions should maintain total ordering");
console.log("4. Concurrent operations should be handled deterministically");
console.log("5. Tombstones should be preserved but not displayed");
console.log("6. Operation log should be cleared after updateDoc()");
console.log("7. Character positions should allow infinite insertions between any two points");
