import pool from './src/config/db.js';

async function migrate() {
    try {
        console.log("Adding student profile columns (stop_id and concession)...");
        
        // 1. Update btech_students
        await pool.query(`
            ALTER TABLE btech_students 
            ADD COLUMN IF NOT EXISTS stop_id INT REFERENCES stoppings(stop_id),
            ADD COLUMN IF NOT EXISTS concession NUMERIC(10, 2) DEFAULT 0;
        `);
        console.log("- btech_students table updated.");

        // 2. Update mtech_students
        await pool.query(`
            ALTER TABLE mtech_students 
            ADD COLUMN IF NOT EXISTS stop_id INT REFERENCES stoppings(stop_id),
            ADD COLUMN IF NOT EXISTS concession NUMERIC(10, 2) DEFAULT 0;
        `);
        console.log("- mtech_students table updated.");

        console.log("Migration completed successfully.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        await pool.end();
    }
}

migrate();
