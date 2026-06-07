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
        runMigrations();
    }
});

const runMigrations = async () => {
    try {
        console.log("Running self-healing database migrations...");
        
        // 1. Ensure buses table has bus_no column
        await pool.query(`
            ALTER TABLE buses ADD COLUMN IF NOT EXISTS bus_no VARCHAR(50);
        `).catch(err => console.log("buses.bus_no column check:", err.message));

        // 2. Clean up duplicate fuel_rates dates (if any)
        await pool.query(`
            DELETE FROM fuel_rates a USING fuel_rates b 
            WHERE a.rate_id < b.rate_id AND a.rate_date = b.rate_date;
        `).catch(err => console.log("fuel_rates duplicate cleanup check:", err.message));

        // 3. Ensure UNIQUE constraint on fuel_rates(rate_date)
        await pool.query(`
            ALTER TABLE fuel_rates ADD CONSTRAINT fuel_rates_rate_date_key UNIQUE (rate_date);
        `).catch(err => {
            if (!err.message.includes("already exists")) {
                console.log("Adding fuel_rates_rate_date_key constraint error:", err.message);
            }
        });

        // 4. Ensure UNIQUE constraint on diesel_logs(reading_id)
        await pool.query(`
            ALTER TABLE diesel_logs ADD CONSTRAINT diesel_logs_reading_id_key UNIQUE (reading_id);
        `).catch(err => {
            if (!err.message.includes("already exists")) {
                console.log("Adding diesel_logs_reading_id_key constraint error:", err.message);
            }
        });

        console.log("Database self-healing migrations finished.");
    } catch (err) {
        console.error("Database self-healing migrations failed:", err.message);
    }
};

export default pool;