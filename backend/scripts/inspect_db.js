import pool from '../config/db.js';

const listTables = async () => {
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables in database:", result.rows.map(r => r.table_name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listTables();
