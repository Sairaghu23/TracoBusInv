import pool from './src/config/db.js';

const migrate = async () => {
    try {
        console.log("Adding route_id to buses table...");

        // 1. Add column if it doesn't exist
        await pool.query(`
            ALTER TABLE buses 
            ADD COLUMN IF NOT EXISTS route_id INT REFERENCES routes(route_id) ON DELETE SET NULL
        `);
        console.log("- Added 'route_id' column with FK constraint.");

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
