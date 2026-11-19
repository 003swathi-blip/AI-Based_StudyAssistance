const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "study_assistance",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
db.getConnection((err, connection) => {
    if (err) {
        console.log("Database Connection Failed");
        console.log(err);
    } else {
        console.log("MySQL Connected Successfully");
        connection.release(); // Return connection to the pool
    }
});

module.exports = db;