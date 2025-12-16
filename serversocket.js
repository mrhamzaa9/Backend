const http = require("http");
const app = require("./index"); 
const { initSocket } = require("./socket");

const server = http.createServer(app);

initSocket(server); // socket attached here

server.listen(5000, () => {
  console.log("Socket server running on port 5000");
});
