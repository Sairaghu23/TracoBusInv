import pool from '../config/db.js';

// Fetch all oil types from oil_stocks
export const getAllOilTypes = async () => {
    const result = await pool.query('SELECT * FROM oil_stocks ORDER BY oil_type ASC');
    return result.rows;
};

// Get all oil logs for a specific bus (by rc_plate_number)
export const getOilLogsByBus = async (rc_plate_number) => {
    const result = await pool.query(`
        SELECT ol.*, os.oil_type, r.old_reading, r.new_reading
        FROM oil_logs ol
        JOIN oil_stocks os ON ol.oil_id = os.oil_id
        JOIN buses b ON ol.bus_id = b.bus_id
        LEFT JOIN bus_readings r ON ol.bus_id = r.bus_id AND ol.log_date::DATE = r.end_date::DATE
        WHERE b.rc_plate_number = $1
        ORDER BY ol.log_date DESC
    `, [rc_plate_number.trim().toUpperCase()]);
    return result.rows;
};

// Record a new oil log
export const recordOilLog = async (logData) => {
    const { rc_plate_number, oil_id, quantity, log_date, amount } = logData;
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

        // Lookup reading_id
        const readingQuery = await client.query(
            'SELECT reading_id FROM bus_readings WHERE bus_id = $1 AND end_date::DATE = $2::DATE LIMIT 1',
            [bus_id, log_date]
        );
        if (readingQuery.rows.length === 0) throw new Error('Odometer reading missing for this date.');
        const reading_id = readingQuery.rows[0].reading_id;

        // Insert oil log
        const result = await client.query(
            'INSERT INTO oil_logs (bus_id, oil_id, quantity, log_date, amount, reading_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [bus_id, oil_id, quantity, log_date, amount, reading_id]
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
