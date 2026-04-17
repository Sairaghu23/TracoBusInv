import React, { useState, useEffect } from 'react';
import { 
    Users, Search, Plus, FileText, ChevronLeft, 
    Download, GraduationCap, School, BookOpen, 
    Award, ShieldCheck, Filter, UserPlus, X, Check,
    Clock, CreditCard, MapPin, Pencil
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Students() {
    // 1. UI State
    const [view, setView] = useState('dashboard'); // 'dashboard', 'detail', 'alumni-batches', 'alumni-list'
    const [selectedYear, setSelectedYear] = useState(null); // '1st', '2nd', '3rd', '4th'
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchField, setSearchField] = useState('roll_id');
    const [searchQuery, setSearchQuery] = useState('');
     const [activeModal, setActiveModal] = useState(false); // Add Student Modal
    const [historyModal, setHistoryModal] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState('all'); // Moved here for Rules of Hooks
    
    // Data State
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [counts, setCounts] = useState({ btech: [], mtech: 0, archive: 0 });
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingStudentId, setEditingStudentId] = useState(null);

    // Payment Form State
    const [paymentForm, setPaymentForm] = useState({
        route_id: '',
        stop_id: '',
        amount_paid: '',
        payment_mode: 'Online',
        payment_date: new Date().toISOString().split('T')[0],
        concession: 0
    });

    const [studentForm, setStudentForm] = useState({
        roll_id: '',
        s_name: '',
        branch_id: '',
        admission_year: new Date().getFullYear(),
        batch_start_year: new Date().getFullYear(),
        batch_end_year: new Date().getFullYear() + 4,
        route_id: '',
        stop_id: '',
        concession: 0
    });

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const response = await fetch('/api/students/summary/counts');
                const result = await response.json();
                if (result.status) setCounts(result.data);
            } catch (error) {
                console.error("Error fetching counts:", error);
            }
        };
        fetchCounts();
        
        const fetchRoutes = async () => {
            try {
                const response = await fetch('/api/routes');
                const result = await response.json();
                if (result.status) setRoutes(result.data);
            } catch (error) {
                console.error("Error fetching routes:", error);
            }
        };

        const fetchBranches = async () => {
            try {
                const response = await fetch('/api/branches');
                const result = await response.json();
                if (result.status) setBranches(result.data);
            } catch (error) {
                console.error("Error fetching branches:", error);
            }
        };

        fetchRoutes();
        fetchBranches();
    }, []);

    // 2. Constants
    const currentYear = new Date().getFullYear();
    const years = [
        { 
            id: '1st', name: '1st Year', type: 'btech', icon: School, color: 'bg-emerald-500', 
            count: counts.btech.find(c => parseInt(c.batch_end_year) === currentYear + 3)?.count || 0 
        },
        { 
            id: '2nd', name: '2nd Year', type: 'btech', icon: BookOpen, color: 'bg-blue-500', 
            count: counts.btech.find(c => parseInt(c.batch_end_year) === currentYear + 2)?.count || 0 
        },
        { 
            id: '3rd', name: '3rd Year', type: 'btech', icon: Award, color: 'bg-orange-500', 
            count: counts.btech.find(c => parseInt(c.batch_end_year) === currentYear + 1)?.count || 0 
        },
        { 
            id: '4th', name: '4th Year', type: 'btech', icon: GraduationCap, color: 'bg-purple-500', 
            count: counts.btech.find(c => parseInt(c.batch_end_year) === currentYear)?.count || 0 
        },
        { id: 'passed-out', name: 'Passed Out Archive', type: 'all', icon: Users, color: 'bg-orange-600', count: counts.archive },
    ];

    // 3. API Fetchers
    const fetchStudents = async (type, year, semester) => {
        setLoading(true);
        try {
            const yearNum = parseInt(year);
            const response = await fetch(`/api/students/${type}/${yearNum}/semester/${semester}`);
            const result = await response.json();
            if (result.status) setStudents(result.data);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchArchiveBatches = async (type) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/students/archive/${type}/batches`);
            const result = await response.json();
            if (result.status) setBatches(result.data);
        } catch (error) {
            console.error("Error fetching archive batches:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchArchiveStudents = async (type, start, end) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/students/archive/${type}/${start}/${end}`);
            const result = await response.json();
            if (result.status) setStudents(result.data);
        } catch (error) {
            console.error("Error fetching archive students:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentHistory = async (type, sId) => {
        try {
            const response = await fetch(`/api/students/${type}/history/${sId}`);
            const result = await response.json();
            if (result.status) {
                setPaymentHistory(result.data);
                setHistoryModal(true);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    const handleHistoryClick = (student) => {
        setSelectedStudent(student);
        const type = 'btech';
        fetchPaymentHistory(type, student.s_id);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        const type = 'btech';
        try {
            const response = await fetch(`/api/students/${type}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    s_id: selectedStudent.s_id,
                    semester: selectedSemester,
                    ...paymentForm
                })
            });
            const result = await response.json();
            if (result.status) {
                setPaymentModal(false);
                fetchStudents(type, selectedYear, selectedSemester);
                alert("Payment recorded successfully!");
            }
        } catch (error) {
            console.error("Error recording payment:", error);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        const type = 'btech';
        const url = isEditMode 
            ? `/api/students/${type}/${editingStudentId}`
            : `/api/students/${type}`;
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentForm)
            });
            const result = await response.json();
            if (result.status) {
                setActiveModal(false);
                setIsEditMode(false);
                setEditingStudentId(null);
                setStudentForm({
                    roll_id: '',
                    s_name: '',
                    branch_id: '',
                    admission_year: new Date().getFullYear(),
                    batch_start_year: new Date().getFullYear(),
                    batch_start_year: new Date().getFullYear(),
                    batch_end_year: new Date().getFullYear() + 4,
                    route_id: '',
                    stop_id: '',
                    concession: 0
                });
                // Fetch counts and students for current view
                const fetchCounts = async () => {
                    const res = await fetch('/api/students/summary/counts');
                    const r = await res.json();
                    if (r.status) setCounts(r.data);
                };
                fetchCounts();
                if (view === 'detail') fetchStudents(type, selectedYear, selectedSemester);
                alert(isEditMode ? "Student details updated!" : "Student successfully registered!");
            }
        } catch (error) {
            console.error("Error saving student:", error);
        }
    };

    const handleEditClick = (student) => {
        setIsEditMode(true);
        setEditingStudentId(student.s_id);
        // Find branch_id if possible, or just use what's in student object
        // Note: Our API now returns branch_id from the student record?
        // Let's assume student object has all needed field for the form.
        setStudentForm({
            roll_id: student.roll_id || '',
            s_name: student.s_name || '',
            branch_id: student.branch_id || '', 
            admission_year: student.admission_year || new Date().getFullYear(),
            batch_start_year: student.batch_start_year || new Date().getFullYear(),
            batch_end_year: student.batch_end_year || new Date().getFullYear() + 4,
            route_id: '', // Will enforce re-selecting or finding the matching route if complex, but leaving empty prompts user
            stop_id: student.stop_id || '',
            concession: student.concession || 0
        });
        setActiveModal(true);
    };

    // 4. Handlers
    const handleYearClick = (yearObj) => {
        const yearId = yearObj.id;
        setSelectedYear(yearId);
        setSearchQuery('');
        
        if (yearId === 'passed-out') {
            fetchArchiveBatches('btech'); // Default to btech archive
            setView('alumni-batches');
        } else {
            const defaultSem = yearId === '1st' ? 1 : (yearId === '2nd' ? 3 : (yearId === '3rd' ? 5 : 7));
            setSelectedSemester(defaultSem);
            fetchStudents(yearObj.type, yearId, defaultSem);
            setView('detail');
        }
    };


    const handleBatchClick = (batch) => {
        setSelectedBatch(batch);
        const type = 'btech'; 
        fetchArchiveStudents(type, batch.batch_start_year, batch.batch_end_year);
        setView('alumni-list');
    };

    const handleAlumniCardClick = (student) => {
        const type = 'btech';
        setSelectedStudent(student);
        fetchPaymentHistory(type, student.s_id);
    };

    const handleSemesterChange = (newSem) => {
        setSelectedSemester(newSem);
        const yearObj = years.find(y => y.id === selectedYear);
        fetchStudents(yearObj.type, selectedYear, newSem);
    };

    // 5. Export Logic
    const exportToExcel = () => {
        const data = filteredStudents.map((s, idx) => ({
            "S.No": idx + 1,
            "Roll No": s.roll_id,
            "Name": s.s_name,
            "Branch": s.branch_name,
            "Stop": s.stop_name || 'N/A',
            "Amount Paid": s.amount_paid || 0,
            "Concession": s.concession || 0,
            "Payment Mode": s.payment_mode || 'N/A',
            "Date": s.payment_date ? new Date(s.payment_date).toLocaleDateString() : 'N/A'
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, `Students_${selectedYear}_Sem${selectedSemester}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(`Student List - ${selectedYear} Year (Semester ${selectedSemester})`, 14, 15);
        const tableData = filteredStudents.map((s, idx) => [
            idx + 1, s.roll_id, s.s_name, s.branch_name, s.stop_name, 
            `Rs.${s.amount_paid}`, s.payment_mode, s.payment_date ? new Date(s.payment_date).toLocaleDateString() : '-'
        ]);
        autoTable(doc, {
            startY: 20,
            head: [['S.No', 'Roll ID', 'Name', 'Branch', 'Stop', 'Paid', 'Mode', 'Date']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] }
        });
        doc.save(`Students_${selectedYear}_Sem${selectedSemester}.pdf`);
    };


    // 6. Filtering (filteredStudents is defined in the detail view section below with payment status support)

    const filteredAlumni = students.filter(s => {
        const query = searchQuery.toLowerCase();
        return s.roll_id?.toLowerCase().includes(query) || s.s_name?.toLowerCase().includes(query);
    });

    // 7. Views
    if (view === 'dashboard') {
        return (
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-orange-100/50">
                        <GraduationCap size={44} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-4xl font-black text-navy italic tracking-tight">Academic Fee Node</h1>
                    <p className="text-slate-500 font-medium">Select a student batch or access historical archives for oversight.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                    {years.map(year => (
                        <button 
                            key={year.id}
                            onClick={() => handleYearClick(year)}
                            className="text-left group focus:outline-none"
                        >
                            <div className="card h-full bg-white hover:bg-navy hover:text-white border border-slate-100 hover:border-navy transition-all duration-500 p-8 rounded-[3rem] shadow-xl hover:shadow-2xl hover:shadow-navy/20 relative overflow-hidden flex flex-col justify-between group">
                                <div className={`absolute -right-10 -top-10 w-40 h-40 ${year.color} opacity-5 group-hover:opacity-10 rounded-full transition-all duration-500 group-hover:scale-150`} />
                                
                                <div className="space-y-6 relative z-10">
                                    <div className={`w-16 h-16 ${year.color} text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-500`}>
                                        <year.icon size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic mb-1">{year.name}</h3>
                                        <p className="text-slate-400 group-hover:text-blue-100 font-bold uppercase tracking-widest text-[10px]">{year.id === 'passed-out' ? 'Historical Records' : 'Active Registry'}</p>
                                    </div>
                                </div>

                                <div className="pt-8 flex items-end justify-between relative z-10">
                                    <div>
                                        <span className="text-4xl font-black italic">{year.count > 0 ? year.count : '...'}</span>
                                        <span className="ml-2 text-xs font-black uppercase tracking-widest opacity-40">Students</span>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border border-slate-100 group-hover:border-navy-light flex items-center justify-center group-hover:bg-navy-light transition-all">
                                        <ChevronLeft size={20} className="rotate-180" />
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'alumni-batches') {
        return (
            <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-10 duration-500">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setView('dashboard')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all text-navy"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-navy italic">Passed Out Archive</h2>
                        <p className="text-slate-500 text-sm font-medium">Select a historical batch to view transport analytics.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                    {batches.map((batch, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleBatchClick(batch)}
                            className="text-left group"
                        >
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-orange-500 shadow-lg hover:shadow-orange-100/50 transition-all">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <BookOpen size={24} />
                                </div>
                                <h4 className="text-lg font-black text-navy italic">Batch {batch.batch_start_year}-{batch.batch_end_year}</h4>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Classification: Active DB</p>
                            </div>
                        </button>
                    ))}
                    {batches.length === 0 && !loading && (
                        <div className="col-span-full py-20 text-center text-slate-400 italic">No archived batches found in database.</div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'alumni-list') {
        return (
            <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-10 duration-500">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setView('alumni-batches')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all text-navy"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-navy italic">Batch {selectedBatch?.batch_start_year}-{selectedBatch?.batch_end_year}</h2>
                        <p className="text-slate-500 text-sm font-medium">Student Archive Records</p>
                    </div>
                </div>

                <div className="card bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-stretch gap-2">
                    <div className="flex-1 flex items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-orange-500 transition-all">
                        <Search size={18} className="text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Find alumni by name or roll no..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none w-full text-slate-800 focus:outline-none font-medium ml-3"
                        />
                    </div>
                </div>

                <div className="table-container bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2rem] overflow-hidden">
                    <table className="admin-table w-full">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-left border-b border-slate-50">
                                <th className="py-6 pl-8 font-black text-[10px] uppercase tracking-[0.2em]">S.No</th>
                                <th className="font-black text-[10px] uppercase tracking-[0.2em]">Roll ID</th>
                                <th className="font-black text-[10px] uppercase tracking-[0.2em]">Name</th>
                                <th className="font-black text-[10px] uppercase tracking-[0.2em]">Branch</th>
                                <th className="font-black text-[10px] uppercase tracking-[0.2em]">Total Contribution</th>
                                <th className="pr-8 text-right font-black text-[10px] uppercase tracking-[0.2em]">History</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAlumni.map((alumni, idx) => (
                                <tr key={alumni.s_id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-5 pl-8 text-slate-400 font-black italic">{idx + 1}</td>
                                    <td className="font-bold text-navy">{alumni.roll_id}</td>
                                    <td className="font-black text-slate-700">{alumni.s_name}</td>
                                    <td>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                            {alumni.branch_name}
                                        </span>
                                    </td>
                                    <td className="font-black text-navy italic">₹{parseInt(alumni.total_paid).toLocaleString()}</td>
                                    <td className="pr-8 text-right">
                                        <button 
                                            onClick={() => handleAlumniCardClick(alumni)}
                                            className="w-10 h-10 rounded-xl bg-slate-50 text-navy hover:bg-navy-light transition-all flex items-center justify-center mx-auto md:ml-auto"
                                            title="View Payment History"
                                        >
                                            <FileText size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredAlumni.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400 italic">No alumni records found in this batch.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Standard Detail View (Active Students)
    const yearData = years.find(y => y.id === selectedYear);

    // Dynamic Semesters based on year
    const semesterOptions = {
        '1st': [1, 2],
        '2nd': [3, 4],
        '3rd': [5, 6],
        '4th': [7, 8]
    }[selectedYear] || [];

    // Filter: search + payment status
    const filteredStudents = students.filter(s => {
        const matchSearch = searchField === 'roll_id'
            ? s.roll_id?.toLowerCase().includes(searchQuery.toLowerCase())
            : s.s_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const isPaid = parseFloat(s.amount_paid || 0) > 0;
        const matchPayment = paymentFilter === 'all' ? true : paymentFilter === 'paid' ? isPaid : !isPaid;
        return matchSearch && matchPayment;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-10 duration-500">
            {/* Nav Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setView('dashboard')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all text-navy"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${yearData?.color || 'bg-slate-400'}`} />
                            <h2 className="text-2xl font-black text-navy italic">{yearData?.name} Registry</h2>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Session 2024-25 • Financial Oversight</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button onClick={exportToExcel} className="btn bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 shadow-sm rounded-xl px-5 py-2.5 flex items-center gap-2">
                        <FileText size={18} /> Excel
                    </button>
                    <button onClick={exportToPDF} className="btn bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 shadow-sm rounded-xl px-5 py-2.5 flex items-center gap-2">
                        <Download size={18} /> PDF
                    </button>
                    <button 
                        onClick={() => {
                            setIsEditMode(false);
                            setEditingStudentId(null);
                            setStudentForm({
                                roll_id: '',
                                s_name: '',
                                branch_id: '',
                                admission_year: new Date().getFullYear(),
                                batch_start_year: new Date().getFullYear(),
                                batch_start_year: new Date().getFullYear(),
                                batch_end_year: new Date().getFullYear() + 4,
                                route_id: '',
                                stop_id: '',
                                concession: 0
                            });
                            setActiveModal(true);
                        }}
                        className="btn bg-orange-600 border-none text-white hover:bg-orange-700 shadow-lg shadow-orange-100 rounded-xl px-5 py-2.5 flex items-center gap-2 ml-auto md:ml-0"
                    >
                        <UserPlus size={18} /> Add Student
                    </button>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="card bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-stretch gap-2">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 focus-within:border-orange-500 transition-all">
                    <Clock size={18} className="text-slate-400" />
                    <select 
                        value={selectedSemester}
                        onChange={(e) => handleSemesterChange(e.target.value)}
                        className="bg-transparent border-none text-sm font-black text-navy focus:outline-none cursor-pointer pr-4"
                    >
                        {semesterOptions.map(sem => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 focus-within:border-orange-500 transition-all">
                    <Filter size={18} className="text-slate-400" />
                    <select 
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value)}
                        className="bg-transparent border-none text-sm font-black text-navy focus:outline-none cursor-pointer"
                    >
                        <option value="roll_id">By Roll ID</option>
                        <option value="name">By Name</option>
                    </select>
                </div>

                {/* Payment Status Filter */}
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 focus-within:border-orange-500 transition-all">
                    <span className="text-slate-400 text-sm">💳</span>
                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="bg-transparent border-none text-sm font-black text-navy focus:outline-none cursor-pointer"
                    >
                        <option value="all">All Students</option>
                        <option value="paid">Paid Only</option>
                        <option value="unpaid">Unpaid Only</option>
                    </select>
                </div>

                <div className="flex-1 flex items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-orange-500 transition-all">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={`Search in ${yearData?.name}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none w-full text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium ml-3"
                    />
                </div>
            </div>

            {/* Main Table */}
            <div className="table-container bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2rem] overflow-hidden">
                <table className="admin-table w-full">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-left border-b border-slate-50">
                            <th className="py-6 pl-8 font-black text-[10px] uppercase tracking-[0.2em]">S.No</th>
                            <th className="font-black text-[10px] uppercase tracking-[0.2em]">Student Detail</th>
                            <th className="font-black text-[10px] uppercase tracking-[0.2em]">Boarding Info</th>
                            <th className="font-black text-[10px] uppercase tracking-[0.2em]">Full Fee</th>
                            <th className="font-black text-[10px] uppercase tracking-[0.2em]">Concession</th>
                            <th className="font-black text-[10px] uppercase tracking-[0.2em]">Paid</th>
                            <th className="font-black text-[10px] uppercase tracking-[0.2em]">Balance</th>
                            <th className="pr-8 text-right font-black text-[10px] uppercase tracking-[0.2em]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="7" className="py-20 text-center animate-pulse text-slate-400 italic">Accessing database records...</td></tr>
                        ) : filteredStudents.map((student, idx) => (
                            <tr key={student.s_id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="py-5 pl-8 text-slate-400 font-black italic">{idx + 1}</td>
                                <td className="py-5">
                                    <div className="flex flex-col">
                                        <span className="font-black text-navy text-sm uppercase tracking-tight">{student.s_name}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.roll_id} • {student.branch_name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-black flex items-center gap-1.5 uppercase tracking-widest whitespace-nowrap ${student.stop_name ? 'text-orange-600' : 'text-slate-300'}`}>
                                            <MapPin size={12} className={student.stop_name ? 'text-orange-400' : 'text-slate-200'} /> 
                                            {student.stop_name || 'Not Assigned'}
                                        </span>
                                    </div>
                                </td>
                                <td className="font-black text-slate-600 text-sm italic">₹{student.total_fee?.toLocaleString() || 0}</td>
                                <td className="font-black text-rose-500 text-sm italic">₹{student.concession?.toLocaleString() || 0}</td>
                                <td className="font-black text-emerald-600 text-sm italic">₹{student.amount_paid?.toLocaleString() || 0}</td>
                                <td className="font-black text-navy text-sm italic underline decoration-navy/10 underline-offset-4">
                                    ₹{((student.total_fee || 0) - (student.concession || 0) - (student.amount_paid || 0)).toLocaleString()}
                                </td>
                                <td className="pr-8 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setPaymentForm({
                                                    route_id: '',
                                                    stop_id: student.stop_id || '',
                                                    amount_paid: '',
                                                    payment_mode: 'Online',
                                                    payment_date: new Date().toISOString().split('T')[0],
                                                    concession: 0
                                                });
                                                setPaymentModal(true);
                                            }}
                                            className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center"
                                            title="Record Payment"
                                        >
                                            <Plus size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(student)}
                                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                                            title="Edit Profile"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && filteredStudents.length === 0 && (
                            <tr><td colSpan="7" className="py-20 text-center text-slate-400 italic">No records found for this semester.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment History Modal */}
            {historyModal && selectedStudent && (
                <div className="fixed inset-0 bg-navy/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-navy text-white flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <CreditCard size={32} className="text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black italic tracking-tight">{selectedStudent.s_name}</h2>
                                    <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Roll ID: {selectedStudent.roll_id} • {selectedStudent.branch_name}</p>
                                </div>
                            </div>
                            <button onClick={() => setHistoryModal(false)} className="text-white/40 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 max-h-[500px] overflow-y-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="pb-4">Semester</th>
                                        <th className="pb-4">Stop Info</th>
                                        <th className="pb-4">Mode</th>
                                        <th className="pb-4">Date</th>
                                        <th className="pb-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paymentHistory.map((h, i) => (
                                        <tr key={i} className="text-sm">
                                            <td className="py-4 font-black text-navy italic">Sem {h.semester}</td>
                                            <td className="py-4 font-medium text-slate-500">{h.stop_name}</td>
                                            <td className="py-4">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{h.payment_mode}</span>
                                            </td>
                                            <td className="py-4 text-slate-400">{new Date(h.payment_date).toLocaleDateString()}</td>
                                            <td className="py-4 text-right font-black text-emerald-600">₹{h.amount_paid.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {paymentHistory.length === 0 && (
                                        <tr><td colSpan="5" className="py-10 text-center text-slate-400 italic">No historical payment records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {paymentModal && selectedStudent && (
                <div className="fixed inset-0 bg-navy/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-orange-600 text-white flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <CreditCard size={32} className="text-orange-200" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black italic tracking-tight">Record Fee</h2>
                                    <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">{selectedStudent.s_name} • Sem {selectedSemester}</p>
                                </div>
                            </div>
                            <button onClick={() => setPaymentModal(false)} className="text-white/40 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleRecordPayment} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Route</label>
                                    <select 
                                        required
                                        value={paymentForm.route_id}
                                        onChange={(e) => setPaymentForm({...paymentForm, route_id: e.target.value, stop_id: ''})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-navy focus:outline-none focus:border-orange-500 transition-all appearance-none"
                                    >
                                        <option value="">Choose Route...</option>
                                        {routes.map(route => (
                                            <option key={route.route_id} value={route.route_id}>{route.route_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Bus Stop</label>
                                    <select 
                                        required
                                        value={paymentForm.stop_id}
                                        onChange={(e) => setPaymentForm({...paymentForm, stop_id: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-navy focus:outline-none focus:border-orange-500 transition-all appearance-none"
                                        disabled={!paymentForm.route_id}
                                    >
                                        <option value="">Choose Stop...</option>
                                        {paymentForm.route_id && routes.find(r => r.route_id.toString() === paymentForm.route_id.toString())?.stops.map(stop => (
                                            <option key={stop.id} value={stop.id}>{stop.name} (₹{stop.fee})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount Paid (₹)</label>
                                    <input 
                                        required
                                        type="number"
                                        placeholder="0.00"
                                        value={paymentForm.amount_paid}
                                        onChange={(e) => setPaymentForm({...paymentForm, amount_paid: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-navy focus:outline-none focus:border-orange-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Mode</label>
                                    <select 
                                        value={paymentForm.payment_mode}
                                        onChange={(e) => setPaymentForm({...paymentForm, payment_mode: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-navy focus:outline-none focus:border-orange-500 transition-all"
                                    >
                                        <option value="Online">Online</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Date</label>
                                    <input 
                                        required
                                        type="date"
                                        value={paymentForm.payment_date}
                                        onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-navy focus:outline-none focus:border-orange-500 transition-all"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-4 bg-navy text-white rounded-2xl font-black italic tracking-tight hover:bg-navy-light shadow-xl shadow-navy/10 transition-all text-lg"
                            >
                                Secure Transaction
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {activeModal && (
                <div className="fixed inset-0 bg-navy/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 bg-blue-600 text-white flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <UserPlus size={32} className="text-blue-200" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black italic tracking-tight">{isEditMode ? 'Edit Student' : 'Register Student'}</h2>
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">{isEditMode ? 'Update Profile' : 'New Enrollment'} • {selectedYear?.toUpperCase()} Year</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveModal(false)} className="text-white/40 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddStudent} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Roll ID (Unique)</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="e.g. 21CS001"
                                        value={studentForm.roll_id}
                                        onChange={(e) => setStudentForm({...studentForm, roll_id: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="Student Name"
                                        value={studentForm.s_name}
                                        onChange={(e) => setStudentForm({...studentForm, s_name: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Branch</label>
                                    <select 
                                        required
                                        value={studentForm.branch_id}
                                        onChange={(e) => setStudentForm({...studentForm, branch_id: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                                    >
                                        <option value="">Select Branch...</option>
                                        {branches.map(b => (
                                            <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Route</label>
                                    <select 
                                        required
                                        value={studentForm.route_id}
                                        onChange={(e) => setStudentForm({...studentForm, route_id: e.target.value, stop_id: ''})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                                    >
                                        <option value="">Select Route...</option>
                                        {routes.map(r => (
                                            <option key={r.route_id} value={r.route_id}>{r.route_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Boarding Stop</label>
                                    <select 
                                        required
                                        value={studentForm.stop_id}
                                        onChange={(e) => setStudentForm({...studentForm, stop_id: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                                        disabled={!studentForm.route_id}
                                    >
                                        <option value="">Select Stop...</option>
                                        {studentForm.route_id && routes.find(r => r.route_id.toString() === studentForm.route_id.toString())?.stops.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} (₹{s.fee})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Admission Year</label>
                                    <input 
                                        required
                                        type="number"
                                        value={studentForm.admission_year}
                                        onChange={(e) => setStudentForm({...studentForm, admission_year: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Batch Start Year</label>
                                    <input 
                                        required
                                        type="number"
                                        value={studentForm.batch_start_year}
                                        onChange={(e) => setStudentForm({...studentForm, batch_start_year: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Passed Out Year</label>
                                    <input 
                                        required
                                        type="number"
                                        value={studentForm.batch_end_year}
                                        onChange={(e) => setStudentForm({...studentForm, batch_end_year: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Concession Amount (₹)</label>
                                    <input 
                                        type="number"
                                        placeholder="0.00"
                                        value={studentForm.concession}
                                        onChange={(e) => setStudentForm({...studentForm, concession: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-navy focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-4 bg-navy text-white rounded-2xl font-black italic tracking-tight hover:bg-navy-light shadow-xl shadow-navy/10 transition-all text-lg mt-4"
                            >
                                Enroll Student Profile
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
