/**
 * check-customers.js — Local debug script only. Never imported by the server.
 * Run with: node check-customers.js
 */
require('dotenv').config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
});

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err.message);
    return;
  }
  db.query("SELECT * FROM customers", (err, result) => {
    if (err) console.error("Customers error", err);
    else console.log("Customers Table Data:", JSON.stringify(result, null, 2));
    process.exit(0);
  });
});
