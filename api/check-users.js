/**
 * check-users.js — Local debug script only. Never imported by the server.
 * Run with: node check-users.js
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
    else console.log("Users Table Data:", JSON.stringify(result, null, 2));
    process.exit(0);
  });
});
