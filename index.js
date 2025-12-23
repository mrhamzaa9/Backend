const express = require("express");
const http = require("http");
const mongoose = require("./db/connection");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();


// routes
const Authapi = require("./routes/Auth");
const Superadminapi = require("./routes/superadmin");
const Schoolapi = require("./routes/school");
const Courseapi = require("./routes/course");
const Enrollmentapi = require("./routes/enrollment");
const Assignmentapi = require("./routes/assignment");
const Quizapi = require("./routes/quiz")
const app = express();

// middlewares
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());


// routes
app.use("/api/auth", Authapi);
app.use("/api/school", Schoolapi);
app.use("/api/superadmin", Superadminapi);
app.use("/api/course", Courseapi);
app.use("/api/enroll", Enrollmentapi);
app.use("/api/assign", Assignmentapi);
app .use ("/api/quiz",Quizapi)

const PORT = process.env.API_PORT || 4000;
app.listen(PORT, () => {
  console.log(`API  running on ${PORT}`);
});
