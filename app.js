// express is the framework being used for nodejs
const express = require("express");
const app = express();
const dotenv = require("dotenv");
var bodyParser = require("body-parser");
const useragent = require("express-useragent");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const nodemailer = require('nodemailer');

dotenv.config({ path: "./config/config.env" });

// set cors to only accept
const options = {
  origin: "http://localhost:5173",
  credentials: true
};

app.use(cookieParser());
app.use(cors(options));
app.use(bodyParser.json());
app.use(useragent.express());
// need to import the routes that we are using
const users = require("./routes/users");
const auth = require("./routes/auth");
const task = require("./routes/task");

app.use("/api/v1", auth);
app.use("/api/v1", users);
app.use("/api/v1", task);

console.log("app successfully running");

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
