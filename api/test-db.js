/**
 * test-db.js — Local debug script only. Never imported by the server.
 * Run with: node test-db.js
 */
require('dotenv').config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQLPORT) || 3306,
});

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err.message);
    return;
  }
  db.query("SELECT * FROM users", (err, result) => {
    if (err) console.error("Users error", err);
    else console.log("Users:", result);

    db.query("SELECT * FROM products LIMIT 5", (err, result) => {
      if (err) console.error("Products error", err);
      else console.log("Products:", result);
      process.exit(0);
    });
  });
});
