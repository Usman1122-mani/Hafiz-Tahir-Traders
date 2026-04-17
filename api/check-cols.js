require('dotenv').config();
const db = require('./database');

db.query("DESCRIBE products", (err, results) => {
  if (err) console.error("Error:", err);
  else console.log(results.map(r => r.Field));
  process.exit();
});
