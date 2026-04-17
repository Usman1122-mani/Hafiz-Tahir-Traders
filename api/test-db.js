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
  if (err) throw err;
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
