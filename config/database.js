const dotenv = require("dotenv");
const mysql = require("mysql2");

// config.env file variables
// show the path that stores our config variables
dotenv.config({ path: "./config/config.env" });

// Function to connect to database and execute statement asynchronously
const connectDatabase = async (statement, param) => {
  // Create MySQL connection
  const con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
  });

  // Promisify the connect method
  const connectPromise = () => {
    return new Promise((resolve, reject) => {
      con.connect(err => {
        if (err) {
          reject(err);
        } else {
          console.log("Connected to database!");
          resolve();
        }
      });
    });
  };

  // Promisify the query method
  const queryPromise = (sql, values) => {
    return new Promise((resolve, reject) => {
      con.query(sql, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  try {
    // Connect to database
    await connectPromise();

    // Execute statement and return result
    const sql = statement;
    console.log("Executing statement:", statement);
    const result = await queryPromise(sql, param);
    console.log("Query result:", result);
    return result;
  } catch (error) {
    throw error; // Rethrow the error to be handled by the caller
  } finally {
    // Close the connection
    con.end();
    console.log("Connection closed.");
  }
};

module.exports = connectDatabase;
