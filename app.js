// express is the framework being used for nodejs
const express = require("express");
const app = express();
const dotenv = require("dotenv");
var bodyParser = require("body-parser");
const useragent = require("express-useragent");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

//  origin: "http://localhost:5173",

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
const groups = require("./routes/groups");
const auth = require("./routes/auth");

app.use("/api/v1", auth);
app.use("/api/v1", users);
app.use("/api/v1", groups);

console.log("app successfully running");

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
