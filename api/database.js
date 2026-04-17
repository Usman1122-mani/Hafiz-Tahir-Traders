const mysql = require("mysql2");

/**
 * Railway MySQL Configuration
 * Strictly uses Railway's auto-injected environment variables:
 * MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQL_DATABASE, MYSQLPORT
 */
const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQLPORT, // No fallback to 3306
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

let db;

function createConnection() {
  // 🚫 STRICT GUARD: Prevent falling back to localhost or 127.0.0.1
  // If host is undefined, mysql2 defaults to localhost. We must block this.
  if (!dbConfig.host || dbConfig.host === "localhost" || dbConfig.host === "127.0.0.1") {
    console.error("FATAL: Railway Database variables are missing or invalid.");
    console.error("Current config:", {
      host: dbConfig.host || "UNDEFINED",
      user: dbConfig.user || "UNDEFINED",
      database: dbConfig.database || "UNDEFINED",
      port: dbConfig.port || "UNDEFINED",
    });
    console.error("Application will NOT connect to 127.0.0.1. Please check Railway Env Vars.");
    return; // Stop execution
  }

  console.log(`Attempting connection to Railway DB: ${dbConfig.host}`);
  
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error("Database connection failed:", err.message);
      // Retry after 5 seconds
      setTimeout(createConnection, 5000);
      return;
    }
    console.log("✅ MySQL Connected Successfully to", dbConfig.host);
  });

  db.on("error", (err) => {
    console.error("MySQL runtime error:", err.code, err.message);
    if (
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT" ||
      err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
    ) {
      console.log("Reconnecting to MySQL...");
      createConnection();
    }
  });
}

createConnection();

// Proxy export to handle late initialization
module.exports = {
  query: (...args) => {
    if (!db) {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        return callback(new Error("Database connection not initialized"));
      }
      return Promise.reject(new Error("Database connection not initialized"));
    }
    return db.query(...args);
  },
  promise: () => {
    if (!db) return { query: () => Promise.reject(new Error("Database connection not initialized")) };
    return db.promise();
  },
};