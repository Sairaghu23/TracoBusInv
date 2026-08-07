import pool from '../config/db.js';

// Fetch all oil types from oil_stocks
export const getAllOilTypes = async () => {
    const result = await pool.query('SELECT * FROM oil_stocks ORDER BY oil_type ASC');
    return result.rows;
};

// Get all oil logs for a specific bus (by rc_plate_number)
export const getOilLogsByBus = async (rc_plate_number) => {
    const result = await pool.query(`
        SELECT ol.*, os.oil_type,
               (ol.new_reading - COALESCE(
                   LAG(ol.new_reading) OVER (PARTITION BY ol.bus_id ORDER BY ol.log_date ASC, ol.log_id ASC), 
                   ol.new_reading
               )) as distance
        FROM oil_logs ol
        JOIN oil_stocks os ON ol.oil_id = os.oil_id
        JOIN buses b ON ol.bus_id = b.bus_id
        WHERE b.rc_plate_number = $1
        ORDER BY ol.log_date DESC
    `, [rc_plate_number.trim().toUpperCase()]);
    return result.rows;
};

// Record a new oil log
export const recordOilLog = async (logData) => {
    const { rc_plate_number, oil_id, quantity, log_date, amount, new_reading } = logData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Lookup bus_id
        const busQuery = await client.query(
            'SELECT bus_id FROM buses WHERE rc_plate_number = $1',
            [rc_plate_number.trim().toUpperCase()]
        );
        if (busQuery.rows.length === 0) throw new Error('Vehicle not found.');
        const bus_id = busQuery.rows[0].bus_id;

        // Insert oil log
        const result = await client.query(
            'INSERT INTO oil_logs (bus_id, oil_id, quantity, log_date, amount, new_reading) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [bus_id, oil_id, quantity, log_date, amount, new_reading]
        );

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
