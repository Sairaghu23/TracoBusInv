import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Fuel, Droplet, Settings, BarChart3, IndianRupee, ChevronLeft, Users, CheckCircle2, XCircle, GraduationCap, Bus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import api from '../utils/api';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);
const SEMESTERS = [1, 2];

const SECTIONS = [
    { key: 'diesel',  label: 'Diesel & Fuel',           icon: Fuel,          color: 'orange',  unit: 'L',     qtyLabel: 'Fuel Used' },
    { key: 'oils',    label: 'Oil Maintenance',          icon: Droplet,       color: 'blue',    unit: 'L',     qtyLabel: 'Oil Used' },
    { key: 'spares',  label: 'Spare Parts',              icon: Settings,      color: 'emerald', unit: 'Units', qtyLabel: 'Parts Used' },
    { key: 'fees',    label: 'Bus Fee Collection',       icon: IndianRupee,   color: 'violet',  unit: '',      qtyLabel: '' },
];

const COLOR = {
    orange: { bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconText: 'text-orange-600', badge: 'bg-orange-50 text-orange-700', accent: 'text-orange-600', border: 'border-orange-200', activeBorder: 'border-orange-500', gradient: 'from-orange-500 to-orange-600', ring: 'ring-orange-200' },
    blue:   { bg: 'bg-blue-50',   iconBg: 'bg-blue-100',   iconText: 'text-blue-600',   badge: 'bg-blue-50 text-blue-700',   accent: 'text-blue-600',   border: 'border-blue-200',   activeBorder: 'border-blue-500',   gradient: 'from-blue-500 to-blue-600',   ring: 'ring-blue-200' },
    emerald:{ bg: 'bg-emerald-50',iconBg: 'bg-emerald-100',iconText: 'text-emerald-600',badge: 'bg-emerald-50 text-emerald-700',accent:'text-emerald-600',border:'border-emerald-200',activeBorder:'border-emerald-500',gradient:'from-emerald-500 to-emerald-600',ring:'ring-emerald-200' },
    violet: { bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconText: 'text-violet-600', badge: 'bg-violet-50 text-violet-700', accent: 'text-violet-600', border: 'border-violet-200', activeBorder: 'border-violet-500', gradient: 'from-violet-500 to-violet-600', ring: 'ring-violet-200' },
};

export default function Analytics() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(currentYear);
    const [semester, setSemester] = useState(1);
    const [sectionData, setSectionData] = useState({ diesel: [], oils: [], spares: [], fees: [] });
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState('overview'); // 'overview' | 'diesel' | 'oils' | 'spares' | 'fees'

    // New Filter States
    const [feeAcademicYear, setFeeAcademicYear] = useState(`${currentYear}-${currentYear + 1}`);
    const [feeYearOfStudy, setFeeYearOfStudy] = useState('all'); // 'all', '1', '2', '3', '4'
    const [feeSemester, setFeeSemester] = useState('all'); // 'all', 1, 2, ...
    const [fleetBusFilter, setFleetBusFilter] = useState('all'); // 'all' or bus_no

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [dieselRes, oilsRes, sparesRes, feesRes] = await Promise.all([
                api.get(`/api/analytics/diesel?month=${month}&year=${year}`),
                api.get(`/api/analytics/oils?month=${month}&year=${year}`),
                api.get(`/api/analytics/spares?month=${month}&year=${year}`),
                api.get(`/api/analytics/fees?semester=${feeSemester}`), // use feeSemester instead of semester
            ]);
            setSectionData({
                diesel: dieselRes.data?.status ? dieselRes.data.data : [],
                oils:   oilsRes.data?.status ? oilsRes.data.data : [],
                spares: sparesRes.data?.status ? sparesRes.data.data : [],
                fees:   feesRes.data?.status ? feesRes.data.data : [],
            });
        } catch (err) {
            console.error('Analytics fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [month, year, feeSemester]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const totalOf = (key) => sectionData[key].reduce((s, r) => s + (parseFloat(r.amount || r.total_collected) || 0), 0);
    const totalStudents = sectionData.fees.reduce((s, r) => s + parseInt(r.total_students || 0), 0);
    const totalPaid = sectionData.fees.reduce((s, r) => s + parseInt(r.paid_students || 0), 0);

    // Get unique buses from diesel/oils/spares for fleet filtering
    const uniqueBuses = useMemo(() => {
        const buses = new Set();
        ['diesel', 'oils', 'spares'].forEach(key => {
            sectionData[key].forEach(item => {
                if (item.bus_no) buses.add(item.bus_no);
            });
        });
        return Array.from(buses).sort();
    }, [sectionData]);

    // ── DETAIL VIEW: Diesel / Oils / Spares ─────────────────────────────────
    if (activeView !== 'overview' && activeView !== 'fees') {
        const sec = SECTIONS.find(s => s.key === activeView);
        const c = COLOR[sec.color];
        const rows = sectionData[activeView];
        const Icon = sec.icon;
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveView('overview')} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-navy hover:bg-slate-50 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div className={`w-12 h-12 ${c.iconBg} rounded-2xl flex items-center justify-center ${c.iconText}`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-navy italic">{sec.label}</h1>
                            <p className="text-slate-500 text-sm">{MONTHS[month - 1]} {year} · Per Bus Breakdown</p>
                        </div>
                    </div>
                    {/* Filter */}
                    <div className="flex items-center gap-3">
                        <select className="form-input py-2 text-sm font-bold text-navy bg-slate-50 border-slate-100 rounded-xl w-36" value={month} onChange={e => setMonth(e.target.value)}>
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <select className="form-input py-2 text-sm font-bold text-navy bg-slate-50 border-slate-100 rounded-xl w-24" value={year} onChange={e => setYear(e.target.value)}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Summary Strip */}
                <div className={`bg-gradient-to-r ${c.gradient} rounded-3xl p-6 text-white flex items-center gap-6 shadow-xl`}>
                    <div className={`${c.iconBg}/20 p-4 rounded-2xl backdrop-blur-sm`}>
                        <Icon size={32} className="text-white" />
                    </div>
                    <div>
                        <p className="text-white/70 text-xs font-black uppercase tracking-widest">Total — {MONTHS[month-1]} {year}</p>
                        <p className="text-4xl font-black">₹{totalOf(activeView).toLocaleString()}</p>
                        <p className="text-white/60 text-xs mt-1">{rows.length} bus{rows.length !== 1 ? 'es' : ''} active this period</p>
                    </div>
                </div>

                {/* Bus Table */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="py-4 pl-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Bus No</th>
                                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle Plate</th>
                                <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{sec.qtyLabel} ({sec.unit})</th>
                                <th className="py-4 pr-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rows.length > 0 ? rows.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-8">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 ${c.iconBg} rounded-lg flex items-center justify-center`}>
                                                <Bus size={14} className={c.iconText} />
                                            </div>
                                            <span className="font-black text-navy">{row.bus_no || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 font-bold text-slate-600">{row.rc_plate_number}</td>
                                    <td className="py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black ${c.badge}`}>
                                            {parseFloat(row.quantity || 0).toFixed(sec.unit === 'L' ? 1 : 0)} {sec.unit}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-8 text-right font-black text-navy text-lg">
                                        ₹{parseFloat(row.amount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="py-20 text-center text-slate-400 italic">
                                    No records for {MONTHS[month - 1]} {year}.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // ── DETAIL VIEW: Bus Fee ─────────────────────────────────────────────────
    if (activeView === 'fees') {
        const feeRows = sectionData.fees;
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveView('overview')} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-navy hover:bg-slate-50 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600">
                            <IndianRupee size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-navy italic">Bus Fee Collection</h1>
                            <p className="text-slate-500 text-sm">Year-wise breakdown by Passing Year</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Semester</label>
                        <select className="form-input py-2 text-sm font-bold text-navy bg-slate-50 border-slate-100 rounded-xl w-36" value={feeSemester} onChange={e => setFeeSemester(e.target.value)}>
                            <option value="all">All Semesters</option>
                            {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Summary Strip */}
                <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-3xl p-6 text-white flex items-center gap-6 shadow-xl">
                    <div className="bg-white/10 p-4 rounded-2xl">
                        <IndianRupee size={32} />
                    </div>
                    <div className="flex-1">
                        <p className="text-white/70 text-xs font-black uppercase tracking-widest">Total Revenue</p>
                        <p className="text-4xl font-black">₹{totalOf('fees').toLocaleString()}</p>
                    </div>
                    <div className="flex gap-8 text-center">
                        <div>
                            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Students</p>
                            <p className="text-2xl font-black">{totalStudents}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Paid</p>
                            <p className="text-2xl font-black text-emerald-300">{totalPaid}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Unpaid</p>
                            <p className="text-2xl font-black text-red-300">{totalStudents - totalPaid}</p>
                        </div>
                    </div>
                </div>

                {/* Year-wise Cards Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1,2,3].map(i => <div key={i} className="bg-white rounded-3xl h-48 border border-slate-100 shadow-sm animate-pulse" />)}
                    </div>
                ) : feeRows.length === 0 ? (
                    <div className="bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-sm">
                        <GraduationCap size={48} className="text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active students found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {feeRows.map((row, i) => {
                            const paidPct = row.total_students > 0 ? Math.round((row.paid_students / row.total_students) * 100) : 0;
                            const isPrimary = row.type === 'btech'; 
                            return (
                                <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-all overflow-hidden">
                                    {/* Card Header */}
                                    <div className={`p-5 ${isPrimary ? 'bg-navy' : 'bg-violet-900'} text-white relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
                                        <div className="flex items-center justify-between relative z-10">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">{row.type?.toUpperCase()} — Passing Year</p>
                                                <p className="text-3xl font-black italic mt-1">{row.batch_end_year}</p>
                                            </div>
                                            <div className="p-3 bg-white/10 rounded-2xl">
                                                <GraduationCap size={28} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Card Body */}
                                    <div className="p-5 space-y-4">
                                        {/* Progress Bar */}
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="font-black text-slate-500">Payment Progress</span>
                                                <span className="font-black text-navy">{paidPct}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${paidPct}%` }} />
                                            </div>
                                        </div>
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                                <p className="text-xl font-black text-navy">{row.total_students}</p>
                                            </div>
                                            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Paid</p>
                                                </div>
                                                <p className="text-xl font-black text-emerald-700">{row.paid_students}</p>
                                            </div>
                                            <div className="bg-red-50 rounded-2xl p-3 text-center">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <XCircle size={10} className="text-red-400" />
                                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Unpaid</p>
                                                </div>
                                                <p className="text-xl font-black text-red-600">{row.unpaid_students}</p>
                                            </div>
                                        </div>
                                        {/* Revenue */}
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Collected</span>
                                            <span className="text-xl font-black text-navy">₹{parseFloat(row.total_collected).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Filter fees based on Year of Study relative to current feeAcademicYear
    const filteredFees = useMemo(() => {
        let filtered = sectionData.fees;
        if (feeYearOfStudy !== 'all') {
            const startYear = parseInt(feeAcademicYear.split('-')[0]); // e.g. 2026
            const expectedBatchEndYear = startYear + 4 - parseInt(feeYearOfStudy); // 1st year = 2026 + 4 - 1 = 2029
            filtered = filtered.filter(f => parseInt(f.batch_end_year) === expectedBatchEndYear);
        }
        return filtered;
    }, [sectionData.fees, feeAcademicYear, feeYearOfStudy]);

    const feeTotalStudents = filteredFees.reduce((s, r) => s + parseInt(r.total_students || 0), 0);
    const feePaidStudents = filteredFees.reduce((s, r) => s + parseInt(r.paid_students || 0), 0);
    const feeUnpaidStudents = feeTotalStudents - feePaidStudents;
    
    const feePieData = [
        { name: 'Paid', value: feePaidStudents, color: '#10b981' }, // emerald-500
        { name: 'Unpaid', value: feeUnpaidStudents, color: '#f43f5e' } // rose-500
    ];

    // Compute fleet operation data for Pie Chart based on fleetBusFilter
    const getFilteredTotal = (key) => {
        if (fleetBusFilter === 'all') return totalOf(key);
        return sectionData[key].reduce((sum, item) => {
            if (item.bus_no === fleetBusFilter) return sum + (parseFloat(item.amount) || 0);
            return sum;
        }, 0);
    };

    const fleetPieData = [
        { name: 'Diesel & Fuel', value: getFilteredTotal('diesel'), color: '#f97316' }, // orange-500
        { name: 'Oil Maintenance', value: getFilteredTotal('oils'), color: '#3b82f6' }, // blue-500
        { name: 'Spare Parts', value: getFilteredTotal('spares'), color: '#10b981' }, // emerald-500
    ].filter(d => d.value > 0);

    const filteredFleetTotal = fleetPieData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                        <BarChart3 size={30} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-navy">Overall Analytics</h1>
                        <p className="text-slate-500 text-sm italic mt-0.5">Comprehensive overview of Fleet and Fees</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* 1. Fleet Operations Analytics Card */}
                <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-xl flex flex-col h-full">
                    {/* Card Header */}
                    <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-navy text-white rounded-xl flex items-center justify-center shadow-sm">
                                <Bus size={20} />
                            </div>
                            <h2 className="text-xl font-black text-navy italic tracking-tight">Fleet Operations</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <select className="form-input py-2 px-3 text-xs font-bold text-navy bg-white border-slate-200 rounded-xl" value={month} onChange={e => setMonth(e.target.value)}>
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                            <select className="form-input py-2 px-3 text-xs font-bold text-navy bg-white border-slate-200 rounded-xl w-24" value={year} onChange={e => setYear(e.target.value)}>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col gap-6">
                        {/* Summary Metrics (Clickable) */}
                        <div className="grid grid-cols-3 gap-3">
                            {SECTIONS.filter(s => s.key !== 'fees').map(({ key, label, icon: Icon, color }) => {
                                const c = COLOR[color];
                                const total = totalOf(key);
                                return (
                                    <button 
                                        key={key} 
                                        onClick={() => setActiveView(key)}
                                        className={`bg-white border border-slate-100 hover:${c.activeBorder} p-3 rounded-2xl text-left shadow-sm hover:shadow-md transition-all group`}
                                    >
                                        <div className={`w-8 h-8 ${c.iconBg} ${c.iconText} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                            <Icon size={16} />
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight h-6">{label}</p>
                                        <p className={`text-sm sm:text-base font-black ${c.accent} mt-1`}>₹{total.toLocaleString()}</p>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Pie Chart Section */}
                        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-black text-navy uppercase tracking-widest">Expenditure Breakdown</h3>
                                    <p className="text-xl font-black text-navy italic mt-1">₹{filteredFleetTotal.toLocaleString()}</p>
                                </div>
                                <select 
                                    className="form-input py-2 px-3 text-xs font-bold text-navy bg-white border-slate-200 rounded-xl shadow-sm"
                                    value={fleetBusFilter}
                                    onChange={e => setFleetBusFilter(e.target.value)}
                                >
                                    <option value="all">Overall Bus</option>
                                    {uniqueBuses.map(b => <option key={b} value={b}>Bus {b}</option>)}
                                </select>
                            </div>
                            
                            <div className="flex-1 min-h-[250px] relative">
                                {fleetPieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={fleetPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {fleetPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                formatter={(value) => `₹${value.toLocaleString()}`}
                                                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-black text-sm uppercase tracking-widest">
                                        No Data Available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Student Fee Payment Analytics Card */}
                <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden shadow-xl flex flex-col h-full">
                    {/* Card Header */}
                    <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                                <IndianRupee size={20} />
                            </div>
                            <h2 className="text-xl font-black text-navy italic tracking-tight">Student Fees</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <select className="form-input py-2 px-3 text-xs font-bold text-navy bg-white border-slate-200 rounded-xl" value={feeAcademicYear} onChange={e => setFeeAcademicYear(e.target.value)}>
                                <option value={`${currentYear-1}-${currentYear}`}>{currentYear-1}-{currentYear}</option>
                                <option value={`${currentYear}-${currentYear+1}`}>{currentYear}-{currentYear+1}</option>
                                <option value={`${currentYear+1}-${currentYear+2}`}>{currentYear+1}-{currentYear+2}</option>
                            </select>
                            <select className="form-input py-2 px-3 text-xs font-bold text-navy bg-white border-slate-200 rounded-xl" value={feeSemester} onChange={e => setFeeSemester(e.target.value)}>
                                <option value="all">All Semesters</option>
                                {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col gap-6">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                                <p className="text-xl font-black text-navy">{feeTotalStudents}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100 shadow-sm">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paid</p>
                                <p className="text-xl font-black text-emerald-700">{feePaidStudents}</p>
                            </div>
                            <div className="bg-rose-50 rounded-2xl p-4 text-center border border-rose-100 shadow-sm">
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Unpaid</p>
                                <p className="text-xl font-black text-rose-600">{feeUnpaidStudents}</p>
                            </div>
                        </div>

                        {/* Pie Chart Section */}
                        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-black text-navy uppercase tracking-widest">Payment Distribution</h3>
                                    <p className="text-xl font-black text-navy italic mt-1">₹{filteredFees.reduce((s, r) => s + (parseFloat(r.total_collected) || 0), 0).toLocaleString()} Collected</p>
                                </div>
                                <select 
                                    className="form-input py-2 px-3 text-xs font-bold text-navy bg-white border-slate-200 rounded-xl shadow-sm"
                                    value={feeYearOfStudy}
                                    onChange={e => setFeeYearOfStudy(e.target.value)}
                                >
                                    <option value="all">All Years</option>
                                    <option value="1">1st Year Students</option>
                                    <option value="2">2nd Year Students</option>
                                    <option value="3">3rd Year Students</option>
                                    <option value="4">4th Year Students</option>
                                </select>
                            </div>
                            
                            <div className="flex-1 min-h-[250px] relative">
                                {feeTotalStudents > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={feePieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {feePieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                formatter={(value) => `${value} Students`}
                                                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-black text-sm uppercase tracking-widest">
                                        No Data Available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
