import pool from '../config/db.js';

// Fee analytics grouped by batch_end_year (passing year)
export const getFeeAnalyticsByYear = async (semester) => {
    let semCondition = '';
    const params = [];
    if (semester && semester !== 'all') {
        semCondition = 'AND h.semester = $1';
        params.push(semester);
    }

    const btechQuery = `
        SELECT 
            s.batch_end_year,
            'btech' as type,
            COUNT(DISTINCT s.s_id) as total_students,
            COUNT(DISTINCT h.s_id) as paid_students,
            COUNT(DISTINCT s.s_id) - COUNT(DISTINCT h.s_id) as unpaid_students,
            COALESCE(SUM(h.amount_paid), 0) as total_collected
        FROM btech_students s
        LEFT JOIN btech_students_bus_fee_history h 
            ON s.s_id = h.s_id ${semCondition}
        WHERE s.batch_end_year >= EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY s.batch_end_year
        ORDER BY s.batch_end_year ASC
    `;

    const mtechQuery = `
        SELECT 
            s.batch_end_year,
            'mtech' as type,
            COUNT(DISTINCT s.s_id) as total_students,
            COUNT(DISTINCT h.s_id) as paid_students,
            COUNT(DISTINCT s.s_id) - COUNT(DISTINCT h.s_id) as unpaid_students,
            COALESCE(SUM(h.amount_paid), 0) as total_collected
        FROM mtech_students s
        LEFT JOIN mtech_students_bus_fee_history h 
            ON s.s_id = h.s_id ${semCondition}
        WHERE s.batch_end_year >= EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY s.batch_end_year
        ORDER BY s.batch_end_year ASC
    `;

    const [btech, mtech] = await Promise.all([
        pool.query(btechQuery, params),
        pool.query(mtechQuery, params)
    ]);

    return [...btech.rows, ...mtech.rows];
};

// Diesel analytics by month and year
export const getDieselAnalytics = async (month, year) => {
    const result = await pool.query(`
        SELECT
            b.bus_no,
            b.rc_plate_number,
            COALESCE(SUM(dl.liters), 0) AS quantity,
            COALESCE(SUM(dl.liters * fr.fuel_rate), 0) AS amount
        FROM diesel_logs dl
        LEFT JOIN fuel_rates fr ON dl.rate_id = fr.rate_id
        JOIN buses b ON dl.bus_id = b.bus_id
        WHERE EXTRACT(MONTH FROM dl.created_at) = $1
          AND EXTRACT(YEAR FROM dl.created_at) = $2
        GROUP BY b.bus_id, b.bus_no, b.rc_plate_number
        ORDER BY b.bus_no ASC
    `, [month, year]);
    return result.rows;
};

// Oil analytics by month and year
export const getOilAnalytics = async (month, year) => {
    const result = await pool.query(`
        SELECT
            b.bus_no,
            b.rc_plate_number,
            SUM(ol.quantity) AS quantity,
            SUM(ol.amount) AS amount
        FROM oil_logs ol
        JOIN buses b ON ol.bus_id = b.bus_id
        WHERE EXTRACT(MONTH FROM ol.log_date) = $1
          AND EXTRACT(YEAR FROM ol.log_date) = $2
        GROUP BY b.bus_id, b.bus_no, b.rc_plate_number
        ORDER BY b.bus_no ASC
    `, [month, year]);
    return result.rows;
};

// Spare analytics by month and year
export const getSpareAnalytics = async (month, year) => {
    const result = await pool.query(`
        SELECT
            b.bus_no,
            b.rc_plate_number,
            SUM(su.quantity) AS quantity,
            SUM(su.spare_cost + su.service_charge) AS amount
        FROM spare_usage su
        JOIN buses b ON su.bus_id = b.bus_id
        WHERE EXTRACT(MONTH FROM su.usage_date) = $1
          AND EXTRACT(YEAR FROM su.usage_date) = $2
        GROUP BY b.bus_id, b.bus_no, b.rc_plate_number
        ORDER BY b.bus_no ASC
    `, [month, year]);
    return result.rows;
};
