const http = require("http");
const { initSocket } = require("./socket"); // your socket.js
require("dotenv").config();

const PORT = process.env.SOCKET_PORT || 5000;

// create a simple HTTP server
const server = http.createServer(); 

// initialize socket.io on this server
initSocket(server);

server.listen(PORT, () => {
  console.log(`Socket.IO running on port ${PORT}`);
});
