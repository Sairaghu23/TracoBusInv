import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const { Pool } = pkg;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    password: process.env.DB_PASSWORD,
});

async function run() {
    try {
        console.log("Updating document paths...");
        // Prepend /api to paths that start with /uploads
        const res = await pool.query(`
            UPDATE bus_documents 
            SET file_path = REPLACE(file_path, '/uploads/', '/api/uploads/') 
            WHERE file_path LIKE '/uploads/%'
        `);
        console.log(`Updated ${res.rowCount} records.`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
