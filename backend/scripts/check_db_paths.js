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
        const res = await pool.query("SELECT file_path FROM bus_documents LIMIT 5");
        console.log("DB File Paths:", res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
run();
