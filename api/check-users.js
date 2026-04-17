require('dotenv').config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
  db.query("SELECT * FROM users", (err, result) => {
    if (err) console.error("Users error", err);
    else console.log("Users Table Data:", JSON.stringify(result, null, 2));
    process.exit(0);
  });
});
