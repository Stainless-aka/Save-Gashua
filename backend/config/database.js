const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const databaseDirectory = path.join(__dirname, "../../database");

if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, { recursive: true });
}

const databasePath = path.join(databaseDirectory, "save-gashua.db");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(
    path.join(databaseDirectory, "schema.sql"),
    "utf8"
);

db.exec(schema);

console.log("SQLite database connected successfully.");

module.exports = db;