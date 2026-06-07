import pool from '../config/db.js';

export const getStudentsBySemester = async (type, yearOffset, semester) => {
    const currentYear = new Date().getFullYear();
    const batchEndOffset = (type === 'mtech' ? 2 : 4) - yearOffset;
    const targetBatchEndYear = currentYear + batchEndOffset;

    const studentTable = type === 'mtech' ? 'mtech_students' : 'btech_students';
    const historyTable = type === 'mtech' ? 'mtech_students_bus_fee_history' : 'btech_students_bus_fee_history';

    const query = `
        SELECT 
            s.s_id, s.roll_id, s.s_name, s.branch_id,
            s.admission_year, s.batch_start_year, s.batch_end_year,
            b.branch_name,
            COALESCE(h.semester, $2) as semester, 
            COALESCE(h.amount_paid, 0) as amount_paid, 
            COALESCE(h.concession, s.concession, 0) as concession, 
            h.payment_mode, h.payment_date,
            COALESCE(stop.stop_name, def_stop.stop_name) as stop_name,
            COALESCE(stop.stop_id, def_stop.stop_id) as stop_id,
            sf.fee as total_fee
        FROM ${studentTable} s
        JOIN branch b ON s.branch_id = b.brnach_id
        LEFT JOIN ${historyTable} h ON s.s_id = h.s_id AND h.semester = $2
        LEFT JOIN stoppings stop ON h.stop_id = stop.stop_id
        LEFT JOIN stoppings def_stop ON s.stop_id = def_stop.stop_id
        LEFT JOIN (
            SELECT stop_id, fee FROM stopping_fees 
            WHERE fee_id IN (SELECT MAX(fee_id) FROM stopping_fees GROUP BY stop_id)
        ) sf ON sf.stop_id = COALESCE(stop.stop_id, def_stop.stop_id)
        WHERE s.batch_end_year = $1
        ORDER BY s.roll_id;
    `;

    const result = await pool.query(query, [targetBatchEndYear, semester]);
    return result.rows;
};

export const updateStudent = async (type, s_id, studentData) => {
    const studentTable = type === 'mtech' ? 'mtech_students' : 'btech_students';
    const { 
        roll_id, s_name, branch_id, 
        admission_year, batch_start_year, batch_end_year, 
        stop_id, concession 
    } = studentData;

    const query = `
        UPDATE ${studentTable} 
        SET roll_id = $1, s_name = $2, branch_id = $3, 
            admission_year = $4, batch_start_year = $5, batch_end_year = $6, 
            stop_id = $7, concession = $8
        WHERE s_id = $9
        RETURNING *;
    `;

    const values = [
        roll_id, s_name, branch_id, 
        admission_year, batch_start_year, batch_end_year, 
        stop_id, concession || 0,
        s_id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const addStudent = async (type, studentData) => {
    const studentTable = type === 'mtech' ? 'mtech_students' : 'btech_students';
    const { 
        roll_id, s_name, branch_id, 
        admission_year, batch_start_year, batch_end_year, 
        stop_id, concession 
    } = studentData;

    const query = `
        INSERT INTO ${studentTable} (
            roll_id, s_name, branch_id, 
            admission_year, batch_start_year, batch_end_year, 
            stop_id, concession
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;

    const values = [
        roll_id, s_name, branch_id, 
        admission_year, batch_start_year, batch_end_year, 
        stop_id, concession || 0
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const getAllBranches = async () => {
    const result = await pool.query("SELECT brnach_id as branch_id, branch_name FROM branch ORDER BY branch_name");
    return result.rows;
};

export const recordPayment = async (type, paymentData) => {
    const historyTable = type === 'mtech' ? 'mtech_students_bus_fee_history' : 'btech_students_bus_fee_history';
    const { s_id, stop_id, payment_date, semester, amount_paid, payment_mode, concession } = paymentData;

    const query = `
        INSERT INTO ${historyTable} (s_id, stop_id, payment_date, semester, amount_paid, payment_mode, concession)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (s_id, semester) DO UPDATE SET
            stop_id = EXCLUDED.stop_id,
            payment_date = EXCLUDED.payment_date,
            amount_paid = ${historyTable}.amount_paid + EXCLUDED.amount_paid,
            payment_mode = EXCLUDED.payment_mode,
            concession = EXCLUDED.concession
        RETURNING *;
    `;

    const values = [s_id, stop_id, payment_date, semester, amount_paid, payment_mode, concession || 0];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const getArchiveBatches = async (type) => {
    const studentTable = type === 'mtech' ? 'mtech_students' : 'btech_students';
    const currentYear = new Date().getFullYear();

    const query = `
        SELECT DISTINCT batch_start_year, batch_end_year
        FROM ${studentTable}
        WHERE batch_end_year < $1
        ORDER BY batch_end_year DESC;
    `;

    const result = await pool.query(query, [currentYear]);
    return result.rows;
};

export const getArchiveStudentsByBatch = async (type, batchStart, batchEnd) => {
    const studentTable = type === 'mtech' ? 'mtech_students' : 'btech_students';
    const historyTable = type === 'mtech' ? 'mtech_students_bus_fee_history' : 'btech_students_bus_fee_history';

    const query = `
        SELECT 
            s.s_id, s.roll_id, s.s_name, 
            b.branch_name,
            SUM(COALESCE(h.amount_paid, 0)) as total_paid,
            SUM(CASE WHEN h.amount_paid IS NULL THEN 1 ELSE 0 END) as pending_semesters
        FROM ${studentTable} s
        JOIN branch b ON s.branch_id = b.brnach_id
        LEFT JOIN ${historyTable} h ON s.s_id = h.s_id
        WHERE s.batch_start_year = $1 AND s.batch_end_year = $2
        GROUP BY s.s_id, s.roll_id, s.s_name, b.branch_name
        ORDER BY s.roll_id;
    `;

    const result = await pool.query(query, [batchStart, batchEnd]);
    return result.rows;
};

export const getStudentPaymentHistory = async (type, sId) => {
    const historyTable = type === 'mtech' ? 'mtech_students_bus_fee_history' : 'btech_students_bus_fee_history';

    const query = `
        SELECT 
            h.fee_id, h.semester, h.amount_paid, h.concession, 
            h.payment_mode, h.payment_date,
            stop.stop_name
        FROM ${historyTable} h
        JOIN stoppings stop ON h.stop_id = stop.stop_id
        WHERE h.s_id = $1
        ORDER BY h.semester DESC;
    `;

    const result = await pool.query(query, [sId]);
    return result.rows;
};

export const getStudentCounts = async () => {
    const currentYear = new Date().getFullYear();

    // Counts for BTech years
    const btechCounts = await pool.query(`
        SELECT batch_end_year, COUNT(*) as count 
        FROM btech_students 
        WHERE batch_end_year >= $1
        GROUP BY batch_end_year
    `, [currentYear]);

    // Count for Archive
    const archiveCount = await pool.query(`
        SELECT COUNT(*) as count 
        FROM (
            SELECT s_id FROM btech_students WHERE batch_end_year < $1
        ) as archive
    `, [currentYear]);

    return {
        btech: btechCounts.rows,
        mtech: 0,
        archive: archiveCount.rows[0].count
    };
};

export const getRouteStudentBreakdown = async (routeId) => {
    const currentYear = new Date().getFullYear();
    const query = `
        SELECT 
            s.stop_id, 
            s.stop_name,
            COUNT(CASE WHEN st.batch_end_year = $1 THEN 1 END) as year4,
            COUNT(CASE WHEN st.batch_end_year = $1 + 1 THEN 1 END) as year3,
            COUNT(CASE WHEN st.batch_end_year = $1 + 2 THEN 1 END) as year2,
            COUNT(CASE WHEN st.batch_end_year = $1 + 3 THEN 1 END) as year1,
            COUNT(st.s_id) as total
        FROM stoppings s
        LEFT JOIN btech_students st ON s.stop_id = st.stop_id
        WHERE s.route_id = $2
        GROUP BY s.stop_id, s.stop_name
        ORDER BY s.stop_name;
    `;
    const result = await pool.query(query, [currentYear, routeId]);
    return result.rows;
};
