import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(__dirname, '../data/database.sqlite');
const sqlFilePath = path.resolve(__dirname, '../data/setup.sql');

// Create or connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err);
    } else {
        console.log("Connected to SQLite database.");

        // Read the SQL file
        fs.readFile(sqlFilePath, 'utf-8', (err, data) => {
            if (err) {
                console.error("Error reading SQL file:", err);
                return;
            }

            // Split SQL file into individual statements (in case there are multiple queries)
            const queries = data.split('\n').filter(query => query.trim()); // Filter empty lines

            // Execute each query sequentially
            queries.forEach((query, index) => {
                db.run(query, (err) => {
                    if (err) {
                        console.error(`Error executing query ${index + 1}:`, err);
                    } else {
                        console.log(`Query ${index + 1} executed successfully.`);
                    }
                });
            });
        });
    }
});

export default db;