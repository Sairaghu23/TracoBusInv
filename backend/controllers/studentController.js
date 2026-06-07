import * as studentModel from '../models/studentModel.js';

export const getStudentsBySemesterController = async (req, res) => {
    const { type, year, semester } = req.params;
    try {
        const students = await studentModel.getStudentsBySemester(type, parseInt(year), parseInt(semester));
        res.status(200).json({ status: true, data: students });
    } catch (err) {
        console.error("Error fetching students by semester:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

export const getArchiveBatchesController = async (req, res) => {
    const { type } = req.params;
    try {
        const batches = await studentModel.getArchiveBatches(type);
        res.status(200).json({ status: true, data: batches });
    } catch (err) {
        console.error("Error fetching archive batches:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

export const getArchiveStudentsByBatchController = async (req, res) => {
    const { type, batch_start, batch_end } = req.params;
    try {
        const students = await studentModel.getArchiveStudentsByBatch(type, parseInt(batch_start), parseInt(batch_end));
        res.status(200).json({ status: true, data: students });
    } catch (err) {
        console.error("Error fetching archive students by batch:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

export const getStudentPaymentHistoryController = async (req, res) => {
    const { type, s_id } = req.params;
    try {
        const history = await studentModel.getStudentPaymentHistory(type, parseInt(s_id));
        res.status(200).json({ status: true, data: history });
    } catch (err) {
        console.error("Error fetching student payment history:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

export const getStudentCountsController = async (req, res) => {
    try {
        const counts = await studentModel.getStudentCounts();
        res.status(200).json({ status: true, data: counts });
    } catch (err) {
        console.error("Error fetching student counts:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

export const recordPaymentController = async (req, res) => {
    const { type } = req.params;
    const paymentData = req.body;
    try {
        const result = await studentModel.recordPayment(type, paymentData);
        res.status(200).json({ status: true, data: result, message: "Payment recorded successfully" });
    } catch (err) {
        console.error("Error recording student payment:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

export const updateStudentController = async (req, res) => {
    const { type, s_id } = req.params;
    const studentData = req.body;
    try {
        const result = await studentModel.updateStudent(type, parseInt(s_id), studentData);
        res.status(200).json({ status: true, data: result, message: "Student updated successfully" });
    } catch (err) {
        console.error("Error updating student:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

export const addStudentController = async (req, res) => {
    const { type } = req.params;
    const studentData = req.body;
    try {
        const result = await studentModel.addStudent(type, studentData);
        res.status(201).json({ status: true, data: result, message: "Student registered successfully" });
    } catch (err) {
        console.error("Error adding student:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

export const getBranchesController = async (req, res) => {
    try {
        const branches = await studentModel.getAllBranches();
        res.status(200).json({ status: true, data: branches });
    } catch (err) {
        console.error("Error fetching branches:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

export const getRouteStudentBreakdownController = async (req, res) => {
    const { id } = req.params;
    try {
        const breakdown = await studentModel.getRouteStudentBreakdown(parseInt(id));
        res.status(200).json({ status: true, data: breakdown });
    } catch (err) {
        console.error("Error fetching route student breakdown:", err.message);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};
