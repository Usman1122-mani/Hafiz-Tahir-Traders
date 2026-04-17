const mysql = require("mysql2");

// Railway MySQL - uses Railway's auto-injected environment variables
// MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQL_DATABASE, MYSQLPORT
const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQLPORT) || 3306,
  connectTimeout: 10000,
  keepAliveInitialDelay: 10000,
  enableKeepAlive: true,
};

let db;

function createConnection() {
  db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error("Database connection failed:", err.message);
      console.error("Config used:", {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port,
      });
      // Retry after 5 seconds — do NOT crash the process
      setTimeout(createConnection, 5000);
      return;
    }
    console.log("MySQL Connected Successfully to", dbConfig.host);
  });

  db.on("error", (err) => {
    console.error("MySQL runtime error:", err.code, err.message);
    // Recoverable connection errors — reconnect silently
    if (
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT" ||
      err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
    ) {
      console.log("Reconnecting to MySQL...");
      createConnection();
    } else {
      // Non-fatal: log it but do NOT throw or crash
      console.error("Non-recoverable MySQL error (not crashing):", err);
    }
  });
}

createConnection();

// Proxy export — all callers always get the live connection object
module.exports = {
  query: (...args) => db.query(...args),
  promise: () => db.promise(),
};