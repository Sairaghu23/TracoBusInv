import pool from './src/config/db.js';

const migrate = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stopping_points (
                stop_id SERIAL PRIMARY KEY,
                route_id INT REFERENCES routes ON DELETE CASCADE,
                stop_name VARCHAR(255) NOT NULL,
                fee NUMERIC(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table stopping_points created successfully");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
