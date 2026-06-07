import pool from '../config/db.js';

export const getAllRoutesWithStops = async () => {
    const query = `
        SELECT r.route_id, r.route_name, 
               s.stop_id, s.stop_name, s.stop_fee as fee,
               rm.map_id
        FROM routes r
        LEFT JOIN route_stop_map rm ON r.route_id = rm.route_id
        LEFT JOIN stoppings s ON rm.stop_id = s.stop_id
        ORDER BY r.route_id, s.stop_name;
    `;
    try {
        const result = await pool.query(query);
        // Group by route
        const routesMap = {};
        result.rows.forEach(row => {
            if (!routesMap[row.route_id]) {
                routesMap[row.route_id] = {
                    route_id: row.route_id,
                    route_name: row.route_name,
                    stops: []
                };
            }
            if (row.stop_id) {
                routesMap[row.route_id].stops.push({
                    id: row.map_id, // We use map_id as the primary identifier for boardings
                    stop_id: row.stop_id,
                    name: row.stop_name,
                    fee: parseFloat(row.fee)
                });
            }
        });
        return Object.values(routesMap);
    } catch (error) {
        console.error("Error in getAllRoutesWithStops:", error);
        throw error;
    }
};

export const createRoute = async (routeName) => {
    const query = 'INSERT INTO routes (route_name) VALUES ($1) RETURNING *';
    try {
        const result = await pool.query(query, [routeName.trim().toUpperCase()]);
        return result.rows[0];
    } catch (error) {
        console.error("Error creating route:", error);
        throw error;
    }
};

export const updateRouteName = async (routeId, routeName) => {
    const result = await pool.query(
        'UPDATE routes SET route_name = $1 WHERE route_id = $2 RETURNING *',
        [routeName.trim().toUpperCase(), routeId]
    );
    return result.rows[0];
};

export const deleteRouteById = async (routeId) => {
    try {
        const result = await pool.query(
            'DELETE FROM routes WHERE route_id = $1 RETURNING *',
            [routeId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error deleting route:", error);
        throw error;
    }
};
