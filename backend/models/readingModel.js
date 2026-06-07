import pool from '../config/db.js';

// Get all trip readings for a specific bus
export const getReadingsByBus = async (rc_plate_number) => {
    try {
        const result = await pool.query(`
            SELECT r.* FROM bus_readings r
            JOIN buses b ON r.bus_id = b.bus_id
            WHERE b.rc_plate_number = $1 
            ORDER BY r.start_date DESC
        `, [rc_plate_number.trim().toUpperCase()]);
        return result.rows;
    } catch (error) {
        console.error("Error in getReadingsByBus query:", error.message);
        throw error;
    }
};

// Add a new trip reading log
export const addReading = async (readingData) => {
    const { bus_id, start_date, end_date, old_reading, new_reading } = readingData;
    try {
        const result = await pool.query(`
            INSERT INTO bus_readings (bus_id, start_date, end_date, old_reading, new_reading)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [bus_id, start_date, end_date, old_reading, new_reading]);
        return result.rows[0];
    } catch (error) {
        console.error("Error in addReading query:", error.message);
        throw error;
    }
};

// Get the latest reading for a bus to pre-fill "old_reading"
export const getLatestReading = async (rc_plate_number) => {
    try {
        const result = await pool.query(`
            SELECT r.new_reading, TO_CHAR(r.end_date, 'YYYY-MM-DD') as end_date FROM bus_readings r
            JOIN buses b ON r.bus_id = b.bus_id
            WHERE b.rc_plate_number = $1 
            ORDER BY r.end_date DESC 
            LIMIT 1
        `, [rc_plate_number.trim().toUpperCase()]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

export const getReadingByDate = async (rc_plate_number, date) => {
    try {
        const result = await pool.query(`
            SELECT r.* FROM bus_readings r
            JOIN buses b ON r.bus_id = b.bus_id
            WHERE b.rc_plate_number = $1 AND r.end_date = $2
            LIMIT 1
        `, [rc_plate_number.trim().toUpperCase(), date]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

// --- BULK ENTRY SYSTEM ---

// Get the latest reading for EVERY bus in the fleet
export const getAllFleetReadings = async () => {
    try {
        const result = await pool.query(`
            SELECT b.bus_id, b.rc_plate_number, b.bus_no, r.new_reading as last_reading, TO_CHAR(r.end_date, 'YYYY-MM-DD') as last_end_date
            FROM buses b
            LEFT JOIN (
                SELECT DISTINCT ON (bus_id) bus_id, new_reading, end_date
                FROM bus_readings
                ORDER BY bus_id, end_date DESC, reading_id DESC
            ) r ON b.bus_id = r.bus_id
            ORDER BY b.bus_no ASC;
        `);
        return result.rows;
    } catch (error) {
        console.error("Error in getAllFleetReadings query:", error.message);
        throw error;
    }
};

// Add multiple readings at once (Bulk Insert)
export const addBulkReadings = async (readings) => {
    // readings is an array of { bus_id, start_date, end_date, old_reading, new_reading }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const insertedRows = [];
        for (const record of readings) {
            const { bus_id, start_date, end_date, old_reading, new_reading } = record;
            const res = await client.query(`
                INSERT INTO bus_readings (bus_id, start_date, end_date, old_reading, new_reading)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [bus_id, start_date, end_date, old_reading, new_reading]);
            insertedRows.push(res.rows[0]);
        }

        await client.query('COMMIT');
        return insertedRows;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in addBulkReadings transaction:", error.message);
        throw error;
    } finally {
        client.release();
    }
};