require("dotenv").config();
const db = require("./database");

const migrate = async () => {
  try {
    console.log("Starting products table migration...");
    
    // Add size column
    try {
      await db.promise().query("ALTER TABLE products ADD COLUMN size VARCHAR(50) DEFAULT 'N/A'");
      console.log("Added size column");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("size column already exists");
      else throw err;
    }

    // Add buy_price column
    try {
      await db.promise().query("ALTER TABLE products ADD COLUMN buy_price DECIMAL(10,2) DEFAULT 0.00");
      console.log("Added buy_price column");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("buy_price column already exists");
      else throw err;
    }

    // Ensure 'stock' column exists (renaming quantity to stock or adding it)
    // Looking at index.js, it seems 'quantity' is the primary column, but some queries use 'stock'.
    // Let's check if 'stock' exists.
    try {
      await db.promise().query("ALTER TABLE products ADD COLUMN stock INT DEFAULT 0");
      console.log("Added stock column");
      // Sync stock with quantity if quantity exists
      await db.promise().query("UPDATE products SET stock = quantity WHERE quantity IS NOT NULL");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("stock column already exists");
      else throw err;
    }

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
