const express = require('express');
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config(); 
app.use(cors({
  origin: true,
  credentials: true,
}));

const PORT = process.env.PORT

// middleware for using to converter the data into json format
app.use(express.json())
app.use(cookieParser()); 
// app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Start the server
app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
});