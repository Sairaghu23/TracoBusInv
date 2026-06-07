import pool from './src/config/db.js';

const migrate = async () => {
    try {
        await pool.query(`
            ALTER TABLE bus_documents 
            ADD COLUMN IF NOT EXISTS provider VARCHAR(255)
        `);
        console.log("✅ Added 'provider' column to 'bus_documents' table.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

migrate();
