const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE,
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
};

async function runMigration() {
  let connection;
  try {
    console.log("Connecting to database with config:", {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to DB, starting purchases migration...");

    // 1. Add supplier_id to purchases
    try {
      await connection.query("ALTER TABLE purchases ADD COLUMN supplier_id INT NULL");
      console.log("Added supplier_id column to purchases table");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("supplier_id already exists in purchases");
      else console.error("Migration error (supplier_id):", err.message);
    }

    // 2. Add unit_price to purchases
    try {
      await connection.query("ALTER TABLE purchases ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0");
      console.log("Added unit_price column to purchases table");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log("unit_price already exists in purchases");
      else console.error("Migration error (unit_price):", err.message);
    }

    // 3. Add Foreign Key for supplier_id
    try {
      await connection.query("ALTER TABLE purchases ADD CONSTRAINT fk_purchase_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL");
      console.log("Added foreign key fk_purchase_supplier to purchases table");
    } catch (err) {
      if (err.code === 'ER_DUP_KEY' || err.code === 'ER_FK_DUP_NAME' || err.code === 'ER_CANT_CREATE_TABLE') {
        console.log("Foreign key might already exist or cannot be created (possibly missing suppliers table).");
      }
      else console.error("Migration error (foreign key):", err.message);
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
