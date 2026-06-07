import pool from './src/config/db.js';

const migrate = async () => {
    try {
        console.log("Starting stopping-fees separation migration...");

        // 1. Drop old stopping_points table
        await pool.query("DROP TABLE IF EXISTS stopping_points");
        console.log("- Dropped old 'stopping_points' table.");

        // 2. Create stoppings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stoppings (
                stop_id SERIAL PRIMARY KEY,
                stop_name VARCHAR(100) NOT NULL,
                route_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE
            )
        `);
        console.log("- Created 'stoppings' table.");

        // 3. Create stopping_fees table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stopping_fees (
                fee_id SERIAL PRIMARY KEY,
                stop_id INT NOT NULL,
                fee DECIMAL(10,2) NOT NULL CHECK (fee > 0),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (stop_id) REFERENCES stoppings(stop_id) ON DELETE CASCADE
            )
        `);
        console.log("- Created 'stopping_fees' table.");

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
