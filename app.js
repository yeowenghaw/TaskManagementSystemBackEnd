// express is the framework being used for nodejs
const express = require("express");
const app = express();
const mysql = require("mysql2");

const dotenv = require("dotenv");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

// need to import the routes that we are using
const sample = require("./routes/sample");

app.use("/api/v1", sample);

console.log("app successfully running");

var con = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "SELECT * FROM user";
  con.query(sql, function (err, result) {
    if (err) throw err;
    result.forEach(element => {
      console.log(element);
    });
  });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
