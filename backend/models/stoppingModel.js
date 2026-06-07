import pool from '../config/db.js';

export const createStoppingWithFee = async (stopName, routeId, fee) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert into stoppings with stop_fee
        const stopResult = await client.query(
            'INSERT INTO stoppings (stop_name, stop_fee) VALUES ($1, $2) RETURNING *',
            [stopName.trim().toUpperCase(), parseFloat(fee)]
        );
        const newStop = stopResult.rows[0];

        // 2. Insert into route_stop_map
        await client.query(
            'INSERT INTO route_stop_map (route_id, stop_id) VALUES ($1, $2)',
            [routeId, newStop.stop_id]
        );

        await client.query('COMMIT');
        return { ...newStop, fee: parseFloat(newStop.stop_fee) };
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
        SELECT s.stop_id, s.stop_name, s.stop_fee as fee, rm.map_id
        FROM stoppings s
        JOIN route_stop_map rm ON s.stop_id = rm.stop_id
        WHERE rm.route_id = $1
        ORDER BY s.stop_name ASC;
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
        // Update stop name and fee directly in stoppings
        await client.query(
            'UPDATE stoppings SET stop_name = $1, stop_fee = $2 WHERE stop_id = $3',
            [stopName.trim().toUpperCase(), parseFloat(fee), stopId]
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

export const deleteStoppingById = async (stopId) => {
    try {
        const result = await pool.query(
            'DELETE FROM stoppings WHERE stop_id = $1 RETURNING *',
            [stopId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error deleting stop:", error);
        throw error;
    }
};
