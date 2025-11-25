const express = require("express");
const mongoose = require("./db/connection");
const cors = require("cors");
const Authapi = require("./routes/auth");
const Schoolapi = require("./routes/superadmin");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();



const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const PORT = process.env.PORT;

// Middlewares
app.use(
  cors({
   credentials: true,
  })
);

app.use(cookieParser());


// Routes
app.use("/api/auth", Authapi);
app.use("/api/superadmin", Schoolapi);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
