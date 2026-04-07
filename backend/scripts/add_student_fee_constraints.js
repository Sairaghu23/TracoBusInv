import pool from './src/config/db.js';

async function migrate() {
    try {
        console.log("Adding UNIQUE constraints to student fee history tables...");
        
        await pool.query(`
            ALTER TABLE btech_students_bus_fee_history 
            ADD CONSTRAINT btech_s_id_semester_unique UNIQUE (s_id, semester);
        `);
        console.log("- Added UNIQUE constraint to 'btech_students_bus_fee_history'");

        await pool.query(`
            ALTER TABLE mtech_students_bus_fee_history 
            ADD CONSTRAINT mtech_s_id_semester_unique UNIQUE (s_id, semester);
        `);
        console.log("- Added UNIQUE constraint to 'mtech_students_bus_fee_history'");

        console.log("Migration completed successfully.");
    } catch (err) {
        if (err.code === '42P16') {
            console.log("Constraints already exist.");
        } else {
            console.error("Migration failed:", err.message);
        }
    } finally {
        await pool.end();
    }
}

migrate();
