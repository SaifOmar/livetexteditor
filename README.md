# LiveTextEditor
- This project is a live text editor that allows more than one user to edit the same file at the same time. 
- The project is built using Typescript, Express, Drizzle, socket.io.

## Tech Stack
- Typescript
- Express
- Drizzle
- socket.io

## How it works
- I keep track of the changes made by each user in a CRDT (Conflict-free Replicated Data Type) called Doc.
- Each doc has an array of characters that represents all characters of the document.
- When a change is made, we send update messages to the server, then the server updates the CRDT based on all update messages coming from clients
- Then the server sends the updated parts of the document to all connected clients.
- The clients then update their local document based on the server's update messages.

## Plans
- [-] I am planning on adding vim keybindings to the editor.
- [-] Also I think it would be cool if I could made it into a live markdown editor.
- [-] I have also though of making it possible to have private documents, where only the users that have access to the document can edit it.
