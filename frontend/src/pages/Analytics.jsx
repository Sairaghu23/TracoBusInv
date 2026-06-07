import React, { useState, useEffect, useCallback } from 'react';
import { Fuel, Droplet, Settings, BarChart3, IndianRupee, ChevronLeft, Users, CheckCircle2, XCircle, GraduationCap, Bus } from 'lucide-react';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

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

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [dieselRes, oilsRes, sparesRes, feesRes] = await Promise.all([
                fetch(`http://localhost:5001/api/analytics/diesel?month=${month}&year=${year}`),
                fetch(`http://localhost:5001/api/analytics/oils?month=${month}&year=${year}`),
                fetch(`http://localhost:5001/api/analytics/spares?month=${month}&year=${year}`),
                fetch(`http://localhost:5001/api/analytics/fees?semester=${semester}`),
            ]);
            const [d, o, s, f] = await Promise.all([dieselRes.json(), oilsRes.json(), sparesRes.json(), feesRes.json()]);
            setSectionData({
                diesel: d.status ? d.data : [],
                oils:   o.status ? o.data : [],
                spares: s.status ? s.data : [],
                fees:   f.status ? f.data : [],
            });
        } catch (err) {
            console.error('Analytics fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [month, year, semester]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const totalOf = (key) => sectionData[key].reduce((s, r) => s + (parseFloat(r.amount || r.total_collected) || 0), 0);
    const totalStudents = sectionData.fees.reduce((s, r) => s + parseInt(r.total_students || 0), 0);
    const totalPaid = sectionData.fees.reduce((s, r) => s + parseInt(r.paid_students || 0), 0);

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
                            <p className="text-slate-500 text-sm">Year-wise breakdown by Passing Year · Semester {semester}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Semester</label>
                        <select className="form-input py-2 text-sm font-bold text-navy bg-slate-50 border-slate-100 rounded-xl w-36" value={semester} onChange={e => setSemester(e.target.value)}>
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
                        <p className="text-white/70 text-xs font-black uppercase tracking-widest">Total Revenue · Semester {semester}</p>
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

    // ── OVERVIEW: 4 Summary Cards ────────────────────────────────────────────
    const grandTotal = ['diesel','oils','spares'].reduce((s, k) => s + totalOf(k), 0);

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                        <BarChart3 size={30} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-navy">Fleet Operations Analytics</h1>
                        <p className="text-slate-500 text-sm italic mt-0.5">Click any card to view the detailed breakdown</p>
                    </div>
                </div>
                {/* Shared Month / Year filter */}
                <div className="flex items-center gap-3">
                    <select className="form-input py-2 text-sm font-bold text-navy bg-slate-50 border-slate-100 rounded-xl w-36" value={month} onChange={e => setMonth(e.target.value)}>
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select className="form-input py-2 text-sm font-bold text-navy bg-slate-50 border-slate-100 rounded-xl w-24" value={year} onChange={e => setYear(e.target.value)}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* 4 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {SECTIONS.map(({ key, label, icon: Icon, color, unit }) => {
                    const c = COLOR[color];
                    const total = totalOf(key);
                    const qty = sectionData[key].reduce((s, r) => s + (parseFloat(r.quantity) || 0), 0);
                    const count = sectionData[key].length;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveView(key)}
                            className={`w-full text-left bg-white rounded-3xl border-2 border-slate-100 hover:border-slate-200 transition-all duration-200 shadow-sm hover:shadow-lg p-7 group active:scale-[0.98]`}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className={`w-14 h-14 ${c.iconBg} rounded-2xl flex items-center justify-center ${c.iconText} group-hover:scale-105 transition-transform`}>
                                    <Icon size={28} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${c.badge}`}>
                                    {key === 'fees' ? `${count} groups` : `${count} buses`}
                                </span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                            <p className={`text-4xl font-black ${c.accent}`}>₹{total.toLocaleString()}</p>
                            {key !== 'fees' && (
                                <p className="text-xs text-slate-400 font-medium mt-2">
                                    {qty.toFixed(unit === 'L' ? 1 : 0)} {unit} consumed this period
                                </p>
                            )}
                            {key === 'fees' && (
                                <p className="text-xs text-slate-400 font-medium mt-2">
                                    {totalStudents} students · {totalPaid} paid · {totalStudents - totalPaid} unpaid
                                </p>
                            )}
                            {loading && <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${c.iconBg} animate-pulse w-1/2`} /></div>}
                        </button>
                    );
                })}
            </div>

            {/* Grand Total */}
            <div className="bg-navy rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 pointer-events-none" />
                <div className="p-4 bg-white/10 rounded-2xl">
                    <IndianRupee size={36} className="text-orange-400" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Operational Total — {MONTHS[month - 1]} {year}</p>
                    <p className="text-4xl font-black text-white italic">₹{grandTotal.toLocaleString()}</p>
                    <p className="text-blue-200 text-xs mt-1 opacity-60">Diesel + Oils + Spare Parts</p>
                </div>
                <div className="flex gap-8 text-center">
                    {SECTIONS.filter(s => s.key !== 'fees').map(({ key, label, icon: Icon }) => (
                        <div key={key}>
                            <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">{label.split(' ')[0]}</p>
                            <p className="text-lg font-black text-white">₹{totalOf(key).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
