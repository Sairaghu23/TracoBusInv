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
    const distance = (parseInt(new_reading) || 0) - (parseInt(old_reading) || 0);
    try {
        const result = await pool.query(`
            INSERT INTO bus_readings (bus_id, start_date, end_date, old_reading, new_reading, distance)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [bus_id, start_date, end_date, old_reading, new_reading, distance]);
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
            SELECT 
                b.bus_id, 
                b.rc_plate_number, 
                b.bus_no, 
                r.new_reading as last_reading, 
                TO_CHAR(r.end_date, 'YYYY-MM-DD') as last_end_date,
                r.created_at as last_created_at,
                TO_CHAR(r.created_at, 'DD Mon YYYY, HH12:MI AM') as last_logged_timestamp
            FROM buses b
            LEFT JOIN (
                SELECT DISTINCT ON (bus_id) bus_id, new_reading, end_date, created_at
                FROM bus_readings
                ORDER BY bus_id, end_date DESC, reading_id DESC
            ) r ON b.bus_id = r.bus_id
            ORDER BY b.bus_no ASC NULLS LAST, b.rc_plate_number ASC;
        `);
        return result.rows;
    } catch (error) {
        console.error("Error in getAllFleetReadings query:", error.message);
        throw error;
    }
};

// Get fleet readings for a specific date (shows logged entries and previous readings)
export const getFleetReadingsByDate = async (date) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.bus_id, 
                b.rc_plate_number, 
                b.bus_no,
                r.reading_id,
                r.new_reading,
                r.old_reading,
                COALESCE(r.distance, r.new_reading - r.old_reading) as distance,
                TO_CHAR(r.end_date, 'YYYY-MM-DD') as reading_date,
                (r.reading_id IS NOT NULL) as is_logged,
                COALESCE(lr.new_reading, r.old_reading, 0) as last_reading,
                COALESCE(TO_CHAR(lr.end_date, 'YYYY-MM-DD'), TO_CHAR(r.start_date, 'YYYY-MM-DD')) as last_end_date,
                COALESCE(lr.created_at, r.created_at) as last_created_at,
                TO_CHAR(COALESCE(lr.created_at, r.created_at), 'DD Mon YYYY, HH12:MI AM') as last_logged_timestamp
            FROM buses b
            LEFT JOIN (
                SELECT DISTINCT ON (bus_id) bus_id, reading_id, new_reading, old_reading, distance, end_date, start_date, created_at
                FROM bus_readings
                WHERE end_date = $1
                ORDER BY bus_id, reading_id DESC
            ) r ON b.bus_id = r.bus_id
            LEFT JOIN (
                SELECT DISTINCT ON (bus_id) bus_id, new_reading, end_date, created_at
                FROM bus_readings
                WHERE end_date < $1
                ORDER BY bus_id, end_date DESC, reading_id DESC
            ) lr ON b.bus_id = lr.bus_id
            ORDER BY b.bus_no ASC NULLS LAST, b.rc_plate_number ASC;
        `, [date]);
        return result.rows;
    } catch (error) {
        console.error("Error in getFleetReadingsByDate query:", error.message);
        throw error;
    }
};

// Get recent fleet readings across all buses
export const getRecentFleetReadings = async (limit = 25) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.reading_id,
                r.bus_id,
                b.bus_no,
                b.rc_plate_number,
                TO_CHAR(r.start_date, 'YYYY-MM-DD') as start_date,
                TO_CHAR(r.end_date, 'YYYY-MM-DD') as end_date,
                r.old_reading,
                r.new_reading,
                COALESCE(r.distance, r.new_reading - r.old_reading) as distance,
                r.created_at,
                TO_CHAR(r.created_at, 'DD Mon YYYY, HH12:MI AM') as created_at_formatted
            FROM bus_readings r
            JOIN buses b ON r.bus_id = b.bus_id
            ORDER BY r.end_date DESC, r.reading_id DESC
            LIMIT $1;
        `, [limit]);
        return result.rows;
    } catch (error) {
        console.error("Error in getRecentFleetReadings query:", error.message);
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
            const distance = (parseInt(new_reading) || 0) - (parseInt(old_reading) || 0);
            const res = await client.query(`
                INSERT INTO bus_readings (bus_id, start_date, end_date, old_reading, new_reading, distance)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [bus_id, start_date, end_date, old_reading, new_reading, distance]);
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

// Delete a reading and safely cascade-delete any dependent diesel or oil logs
export const deleteReading = async (reading_id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Delete any dependent diesel logs linked to this reading
        await client.query('DELETE FROM diesel_logs WHERE reading_id = $1', [reading_id]);

        // Delete any dependent oil logs linked to this reading (if any)
        await client.query('DELETE FROM oil_logs WHERE reading_id = $1', [reading_id]);

        // Delete the reading itself
        const res = await client.query('DELETE FROM bus_readings WHERE reading_id = $1 RETURNING *', [reading_id]);

        await client.query('COMMIT');
        return res.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in deleteReading query:", error.message);
        throw error;
    } finally {
        client.release();
    }
};