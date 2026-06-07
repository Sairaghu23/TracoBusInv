const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'bus_inventory' });

async function run() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'oil_logs'");
        console.log(res.rows);
    } catch(err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();
