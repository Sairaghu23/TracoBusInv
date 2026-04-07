import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "bus_inventory",
    port: Number(process.env.DB_PORT) || 5432,
    password: process.env.DB_PASSWORD || "firstdb",
});

console.log("Pool config:", {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
});

pool.on("connect", () => {
    console.log("Connected to the database successfully");
});

pool.on("error", (err) => {
    console.error("Unexpected error on idle database client", err);
});

// Test the connection immediately
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error("Database connection test failed:", err.message);
    } else {
        console.log("Database connection test successful:", res.rows[0].now);
    }
});

export default pool;