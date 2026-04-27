const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE,
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
};

async function addColumnIfMissing(connection, table, column, definition, fkSql = null) {
  try {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`✅ Added column '${column}' to '${table}'`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log(`ℹ️  Column '${column}' already exists in '${table}' — skipping`);
    } else {
      console.error(`❌ Error adding '${column}' to '${table}':`, err.message);
    }
  }

  if (fkSql) {
    try {
      await connection.query(fkSql);
      console.log(`✅ Added foreign key for '${column}'`);
    } catch (err) {
      if (['ER_DUP_KEY', 'ER_FK_DUP_NAME', 'ER_CANT_CREATE_TABLE'].includes(err.code)) {
        console.log(`ℹ️  Foreign key for '${column}' already exists — skipping`);
      } else {
        console.error(`❌ Error adding foreign key for '${column}':`, err.message);
      }
    }
  }
}

async function runMigration() {
  let connection;
  try {
    console.log("🔌 Connecting to DB:", {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });

    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected. Starting purchases schema migration...\n");

    // 1. supplier_id
    await addColumnIfMissing(
      connection, 'purchases', 'supplier_id', 'INT NULL',
      "ALTER TABLE purchases ADD CONSTRAINT fk_purchase_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL"
    );

    // 2. unit_price
    await addColumnIfMissing(connection, 'purchases', 'unit_price', 'DECIMAL(10,2) NOT NULL DEFAULT 0');

    // 3. total_cost  (the new canonical column — replaces the old "price" column)
    await addColumnIfMissing(connection, 'purchases', 'total_cost', 'DECIMAL(10,2) NOT NULL DEFAULT 0');

    // 4. Backfill total_cost from old `price` column if it exists
    try {
      const [cols] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'price'"
      );
      if (cols.length > 0) {
        await connection.query("UPDATE purchases SET total_cost = price WHERE total_cost = 0 AND price > 0");
        console.log("✅ Backfilled total_cost from legacy 'price' column");
      }
    } catch (err) {
      console.error("❌ Error during total_cost backfill:", err.message);
    }

    // 5. Backfill unit_price from total_cost / quantity where missing
    await connection.query(`
      UPDATE purchases
      SET unit_price = CASE WHEN quantity > 0 THEN ROUND(total_cost / quantity, 2) ELSE 0 END
      WHERE unit_price = 0 AND total_cost > 0
    `);
    console.log("✅ Backfilled unit_price from total_cost / quantity where applicable");

    console.log("\n🎉 Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();

