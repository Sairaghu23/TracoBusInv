import pool from '../config/db.js';

export const createStoppingWithFee = async (stopName, routeId, fee) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert into stoppings
        const stopResult = await client.query(
            'INSERT INTO stoppings (stop_name, route_id) VALUES ($1, $2) RETURNING *',
            [stopName.trim().toUpperCase(), routeId]
        );
        const newStop = stopResult.rows[0];

        // 2. Insert into stopping_fees
        const feeResult = await client.query(
            'INSERT INTO stopping_fees (stop_id, fee) VALUES ($1, $2) RETURNING *',
            [newStop.stop_id, fee]
        );

        await client.query('COMMIT');
        return { ...newStop, fee: parseFloat(feeResult.rows[0].fee) };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error in createStoppingWithFee:", error);
        throw error;
    } finally {
        client.release();
    }
};

export const getStoppingsByRoute = async (routeId) => {
    const query = `
        SELECT s.*, f.fee
        FROM stoppings s
        LEFT JOIN (
            SELECT DISTINCT ON (stop_id) stop_id, fee, created_at
            FROM stopping_fees
            ORDER BY stop_id, created_at DESC
        ) f ON s.stop_id = f.stop_id
        WHERE s.route_id = $1
        ORDER BY s.created_at ASC;
    `;
    const result = await pool.query(query, [routeId]);
    return result.rows.map(row => ({
        ...row,
        fee: parseFloat(row.fee)
    }));
};

export const updateStop = async (stopId, stopName, fee) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Update stop name
        await client.query(
            'UPDATE stoppings SET stop_name = $1 WHERE stop_id = $2',
            [stopName.trim().toUpperCase(), stopId]
        );
        // Insert new fee record (history preserved)
        await client.query(
            'INSERT INTO stopping_fees (stop_id, fee) VALUES ($1, $2)',
            [stopId, parseFloat(fee)]
        );
        await client.query('COMMIT');
        return { stop_id: stopId, stop_name: stopName.trim().toUpperCase(), fee: parseFloat(fee) };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

