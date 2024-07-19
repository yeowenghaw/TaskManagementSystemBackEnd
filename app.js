// express is the framework being used for nodejs
const express = require("express");
const app = express();

const dotenv = require("dotenv");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

// need to import the routes that we are using
const sample = require("./routes/sample");

app.use("/api/v1", sample);

console.log("app successfully running");

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
