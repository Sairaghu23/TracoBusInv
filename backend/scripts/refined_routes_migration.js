import pool from './src/config/db.js';

const migrate = async () => {
    try {
        console.log("Starting refined routes migration...");

        // 1. Drop stopping_points first due to FK constraint
        await pool.query("DROP TABLE IF EXISTS stopping_points");
        console.log("- Dropped old stopping_points table.");

        // 2. Drop and recreate routes with refined schema
        await pool.query("DROP TABLE IF EXISTS routes");
        await pool.query(`
            CREATE TABLE routes (
                route_id SERIAL PRIMARY KEY,
                route_name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Recreated 'routes' table with route_id and UNIQUE constraint.");

        // 3. Recreate stopping_points with correct FK
        await pool.query(`
            CREATE TABLE stopping_points (
                stop_id SERIAL PRIMARY KEY,
                route_id INT REFERENCES routes(route_id) ON DELETE CASCADE,
                stop_name VARCHAR(255) NOT NULL,
                fee NUMERIC(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Recreated 'stopping_points' table referencing route_id.");

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
