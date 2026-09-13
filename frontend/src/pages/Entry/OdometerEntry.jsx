import React, { useState, useEffect, useRef } from 'react';
import { Gauge, Calendar, Save, AlertCircle, CheckCircle2, FileText, Plus, Trash2, History, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../utils/api';

export default function OdometerEntry() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [fleetData, setFleetData] = useState([]);
    const [newReadings, setNewReadings] = useState({}); // { rc_plate_number: reading }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [viewMode, setViewMode] = useState('entry'); // 'entry' or 'summary'
    const [savedData, setSavedData] = useState([]);
    const [recentReadings, setRecentReadings] = useState([]);
    const [showRecentHistory, setShowRecentHistory] = useState(false);

    const inputRefs = useRef({});
    const [focusedRow, setFocusedRow] = useState(null);

    const fetchFleet = async (selectedDate = date) => {
        setLoading(true);
        setError(null);
        try {
            let fleetRes;
            try {
                fleetRes = await api.get(`/api/readings/date/${selectedDate}`);
            } catch (err) {
                // If backend does not have date-specific endpoint yet (e.g. older deployment), fall back gracefully
                if (err.response && err.response.status === 404) {
                    console.warn("Date endpoint not found, falling back to /api/readings/all-latest");
                    fleetRes = await api.get('/api/readings/all-latest');
                } else {
                    throw err;
                }
            }

            if (fleetRes.data?.status) {
                const formattedFleet = (fleetRes.data.data || []).map(bus => ({
                    ...bus,
                    is_logged: bus.is_logged ?? false,
                    last_reading: bus.last_reading ?? 0,
                    reading_id: bus.reading_id || null,
                    distance: bus.distance || 0,
                    last_end_date: bus.last_end_date || null,
                    last_created_at: bus.last_created_at || null,
                    last_logged_timestamp: bus.last_logged_timestamp || null
                })).sort((a, b) => {
                    const numA = a.bus_no !== null && a.bus_no !== undefined && a.bus_no !== '' ? Number(a.bus_no) : Infinity;
                    const numB = b.bus_no !== null && b.bus_no !== undefined && b.bus_no !== '' ? Number(b.bus_no) : Infinity;
                    if (numA !== numB) return numA - numB;
                    return String(a.rc_plate_number || '').localeCompare(String(b.rc_plate_number || ''));
                });
                setFleetData(formattedFleet);
                // Initialize newReadings with empty strings
                const initial = {};
                formattedFleet.forEach(bus => {
                    initial[bus.rc_plate_number] = '';
                });
                setNewReadings(initial);
            }

            // Fetch recent fleet readings if endpoint is available
            try {
                const recentRes = await api.get('/api/readings/recent?limit=25');
                if (recentRes.data?.status) {
                    setRecentReadings(recentRes.data.data || []);
                }
            } catch (recentErr) {
                console.warn("Recent readings endpoint not available:", recentErr);
                setRecentReadings([]);
            }
        } catch (err) {
            console.error("Error fetching fleet:", err);
            setError("Failed to load fleet data. Please ensure the server is accessible.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFleet(date);
    }, [date]);

    const handleInputChange = (rc_plate_number, value) => {
        setNewReadings(prev => ({ ...prev, [rc_plate_number]: value }));
    };

    const handleKeyDown = (e, currentIndex) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            for (let i = currentIndex + 1; i < fleetData.length; i++) {
                const nextBus = fleetData[i];
                if (!nextBus.is_logged) {
                    inputRefs.current[nextBus.rc_plate_number]?.focus();
                    break;
                }
            }
        }
    };

    const handleDelete = async (reading_id, bus_no, rc_plate_number) => {
        if (!window.confirm(`Are you sure you want to delete the odometer reading for Bus ${bus_no || rc_plate_number}? If any diesel refueling log is linked to this reading, it will also be deleted.`)) {
            return;
        }

        setDeletingId(reading_id);
        setError(null);
        setSuccess(null);
        try {
            const res = await api.delete(`/api/readings/${reading_id}`);
            if (res.data?.status) {
                setSuccess(`Odometer reading for Bus ${bus_no || rc_plate_number} deleted successfully.`);
                // Remove from savedData if in summary mode
                setSavedData(prev => prev.filter(r => r.reading_id !== reading_id));
                // Refresh date data and recent history
                fetchFleet(date);
            } else {
                setError(res.data?.message || "Failed to delete reading.");
            }
        } catch (err) {
            console.error("Error deleting reading:", err);
            setError(err.response?.data?.message || "Failed to delete reading.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        // Filter out empty readings and format for backend (only for unlogged buses)
        const readingsToSave = fleetData
            .filter(bus => !bus.is_logged && newReadings[bus.rc_plate_number] !== '')
            .map(bus => ({
                bus_id: bus.bus_id,
                bus_no: bus.bus_no,
                rc_plate_number: bus.rc_plate_number,
                start_date: bus.last_end_date || date,
                end_date: date,
                old_reading: bus.last_reading || 0,
                new_reading: parseInt(newReadings[bus.rc_plate_number])
            }));

        if (readingsToSave.length === 0) {
            setError("No new readings entered to save.");
            setSaving(false);
            return;
        }

        try {
            const result = await api.post('/api/readings/bulk', { readings: readingsToSave });
            if (result.data?.status) {
                setSuccess(`Successfully saved ${readingsToSave.length} readings.`);
                // Merge returning reading_id with bus_no and rc_plate_number
                const savedWithMeta = (result.data.data || []).map(saved => {
                    const orig = readingsToSave.find(r => r.bus_id === saved.bus_id) || {};
                    return {
                        ...saved,
                        bus_no: orig.bus_no,
                        rc_plate_number: orig.rc_plate_number,
                        distance: saved.distance || (saved.new_reading - saved.old_reading)
                    };
                });
                setSavedData(savedWithMeta);
                setViewMode('summary');
                fetchFleet(date); // Refresh latest readings
            } else {
                setError(result.data?.message || "Operation failed");
            }
        } catch (err) {
            console.error("Error saving bulk readings:", err);
            setError("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setViewMode('entry');
        setSuccess(null);
        setError(null);
        fetchFleet(date);
    };

    const handleDownloadCSV = () => {
        const headers = ["Bus No", "Vehicle No", "Previous log (KM)", "Current entry (KM)", "Distance Gain (KM)"];
        const rows = savedData.map(r => [
            r.bus_no || 'N/A',
            r.rc_plate_number,
            r.old_reading,
            r.new_reading,
            r.new_reading - r.old_reading
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Odometer_Report_${date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    if (loading && fleetData.length === 0) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div></div>;

    if (viewMode === 'summary') {
        return (
            <div className="max-w-5xl mx-auto space-y-6 animate-in zoom-in-95 duration-500 print:max-w-none print:m-0">
                <div className="flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-navy">Fleet Entry Finalized</h1>
                            <p className="text-slate-500 text-sm">Review your submitted readings for {date}.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleDownloadCSV}
                            className="btn btn-outline border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                        >
                            <FileText size={18} /> Download Excel
                        </button>
                        <button 
                            onClick={handleDownloadPDF}
                            className="btn btn-outline border-slate-200 flex items-center gap-2"
                        >
                            <FileText size={18} /> Download PDF
                        </button>
                        <button 
                            onClick={handleReset}
                            className="btn btn-primary shadow-lg shadow-blue-100 flex items-center gap-2"
                        >
                            <Plus size={18} /> Back to Fleet Entry
                        </button>
                    </div>
                </div>

                {success && (
                    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center gap-3 print:hidden">
                        <CheckCircle2 className="text-emerald-500" />
                        <p className="text-emerald-700 font-bold">{success}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 print:hidden">
                        <AlertCircle className="text-red-500" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 print-content print:shadow-none print:border-none print:p-0">
                    <div className="flex justify-between items-end mb-8 border-b pb-8 border-slate-50">
                        <div>
                            <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Odometer Summary Report</h2>
                            <div className="mt-2 flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                <Calendar size={14} /> Batch Date: {date}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Vehicles Logged</p>
                            <p className="text-3xl font-black text-emerald-600 leading-none italic">{savedData.length}</p>
                        </div>
                    </div>

                    {savedData.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <p>All submitted entries in this batch have been deleted.</p>
                            <button onClick={handleReset} className="mt-4 btn btn-primary">Return to Batch Entry</button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-left">
                                    <th className="py-4 pl-6 uppercase tracking-widest text-[10px] font-black">Bus No</th>
                                    <th className="py-4 uppercase tracking-widest text-[10px] font-black">Vehicle RC</th>
                                    <th className="py-4 uppercase tracking-widest text-[10px] font-black">Previous log (KM)</th>
                                    <th className="py-4 uppercase tracking-widest text-[10px] font-black">Current entry (KM)</th>
                                    <th className="py-4 uppercase tracking-widest text-[10px] font-black">Distance Gain</th>
                                    <th className="py-4 text-right pr-6 uppercase tracking-widest text-[10px] font-black print:hidden">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {savedData.map((record) => (
                                    <tr key={record.reading_id || record.rc_plate_number} className="hover:bg-slate-50 group transition-colors">
                                        <td className="py-5 pl-6 font-black text-navy text-lg">{record.bus_no || 'N/A'}</td>
                                        <td className="py-5 font-bold text-slate-600">{record.rc_plate_number}</td>
                                        <td className="py-5 font-mono text-slate-500">{record.old_reading}</td>
                                        <td className="py-5 font-mono text-slate-800 font-bold">{record.new_reading}</td>
                                        <td className="py-5">
                                            <span className="bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-lg text-sm">
                                                +{record.new_reading - record.old_reading} KM
                                            </span>
                                        </td>
                                        <td className="py-5 text-right pr-6 print:hidden">
                                            <button
                                                onClick={() => handleDelete(record.reading_id, record.bus_no, record.rc_plate_number)}
                                                disabled={deletingId === record.reading_id}
                                                className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg border border-red-200 transition-all inline-flex items-center gap-1.5"
                                                title="Delete wrong entry"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <div className="mt-12 pt-8 border-t border-slate-50 flex justify-between items-center text-slate-400 text-xs italic">
                        <p>© {new Date().getFullYear()} Tracco Bus Management System</p>
                        <p>Generated at: {new Date().toLocaleString()}</p>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body * { visibility: hidden !important; }
                        .print-content, .print-content * { visibility: visible !important; }
                        .print-content { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            padding: 20px; 
                        }
                    }
                `}</style>
            </div>
        );
    }

    const unloggedCount = fleetData.filter(b => !b.is_logged).length;
    const loggedCount = fleetData.filter(b => b.is_logged).length;

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <Gauge size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Daily Odometer Entry</h1>
                        <p className="text-slate-500 text-sm">
                            Batch record or manage odometer readings for the entire fleet.
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                        <Calendar size={18} className="text-slate-400" />
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent font-bold text-navy focus:outline-none"
                        />
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={saving || unloggedCount === 0}
                        className={`btn shadow-lg px-8 py-3 flex items-center gap-2 ${
                            unloggedCount === 0 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                : 'btn-primary shadow-blue-100'
                        }`}
                    >
                        {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                        Save Fleet Batch ({unloggedCount} pending)
                    </button>
                </div>
            </div>

            {/* Status Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fleet Buses</span>
                    <span className="text-xl font-black text-navy">{fleetData.length}</span>
                </div>
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Logged for {date}</span>
                    <span className="text-xl font-black text-emerald-700">{loggedCount}</span>
                </div>
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Pending Entry</span>
                    <span className="text-xl font-black text-blue-700">{unloggedCount}</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 animate-in slide-in-from-left-4">
                    <AlertCircle className="text-red-500" />
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center gap-3 animate-in slide-in-from-left-4">
                    <CheckCircle2 className="text-emerald-500" />
                    <p className="text-emerald-700 font-bold">{success}</p>
                </div>
            )}

            {/* Entry Table */}
            <div className="table-container shadow-xl border border-slate-100 rounded-2xl overflow-hidden mb-6">
                <table className="admin-table">
                    <thead className="bg-navy text-white">
                        <tr>
                            <th className="py-5 pl-8 text-left">Bus No</th>
                            <th className="py-5 text-left">Vehicle RC Number</th>
                            <th className="text-left">Previous Log & Timestamp</th>
                            <th className="text-left">Current Reading Entry</th>
                            <th className="text-center">Status</th>
                            <th className="text-right pr-6">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {fleetData.map((bus, index) => {
                            const currentVal = parseInt(newReadings[bus.rc_plate_number]) || 0;
                            const prevVal = parseInt(bus.last_reading) || 0;
                            const tripDistance = currentVal > 0 ? currentVal - prevVal : 0;
                            const isError = !bus.is_logged && currentVal > 0 && currentVal < prevVal;
                            const isActive = focusedRow === bus.rc_plate_number;

                            return (
                                <tr 
                                    key={bus.rc_plate_number} 
                                    className={`transition-all duration-200 ${
                                        bus.is_logged 
                                            ? 'bg-emerald-50/20' 
                                            : isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'
                                    }`}
                                >
                                    <td className="py-6 pl-8">
                                        <div className="flex flex-col">
                                            <span className="font-black text-navy text-xl leading-none">{bus.bus_no || 'N/A'}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Bus Number</span>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-lg leading-none">{bus.rc_plate_number}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">RC Plate</span>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <Gauge size={15} className="text-slate-400" />
                                                <span className="font-mono font-bold text-slate-700 text-base">
                                                    {bus.last_reading || '0'} <span className="text-xs font-medium text-slate-400">KM</span>
                                                </span>
                                            </div>
                                            {(bus.last_end_date || bus.last_logged_timestamp || bus.last_created_at) ? (
                                                <div className="flex flex-col text-[11px] text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1 text-slate-600">
                                                        <Calendar size={12} className="text-slate-400" />
                                                        <span>{bus.last_end_date ? new Date(bus.last_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                                    </span>
                                                    {(bus.last_logged_timestamp || bus.last_created_at) && (
                                                        <span className="text-[10px] text-slate-400 pl-4">
                                                            {bus.last_logged_timestamp || new Date(bus.last_created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic">No previous log</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        {bus.is_logged ? (
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-black text-2xl text-emerald-800 bg-emerald-100/60 px-4 py-2 rounded-xl border border-emerald-200">
                                                    {bus.new_reading} <span className="text-xs font-bold text-emerald-600">KM</span>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="relative group/input">
                                                <input 
                                                    type="number" 
                                                    ref={el => inputRefs.current[bus.rc_plate_number] = el}
                                                    value={newReadings[bus.rc_plate_number] || ''}
                                                    onChange={(e) => handleInputChange(bus.rc_plate_number, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                                    onFocus={() => setFocusedRow(bus.rc_plate_number)}
                                                    onBlur={() => setFocusedRow(null)}
                                                    className={`
                                                        w-44 px-4 py-3 rounded-xl font-black text-2xl transition-all outline-none
                                                        ${isError 
                                                            ? 'bg-red-50 text-red-600 border-2 border-red-200 ring-4 ring-red-50' 
                                                            : 'bg-white border-2 border-slate-100 text-navy shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}
                                                    `}
                                                    placeholder="000000"
                                                />
                                                {isError && (
                                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg animate-bounce">
                                                        <AlertCircle size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-6 text-center">
                                        {bus.is_logged ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Already Logged</span>
                                                <div className="bg-emerald-100/70 text-emerald-800 px-3 py-1 rounded-lg font-black text-xs border border-emerald-200">
                                                    +{bus.distance} KM
                                                </div>
                                            </div>
                                        ) : tripDistance > 0 && !isError ? (
                                            <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Trip Gain</span>
                                                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-black text-sm border border-emerald-100">
                                                    +{tripDistance} KM
                                                </div>
                                            </div>
                                        ) : isError ? (
                                            <div className="flex flex-col items-center animate-in shake duration-300">
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Invalid Reading</span>
                                                <span className="text-[10px] text-red-400 font-medium">Value lower than last log</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-200 font-black italic tracking-tighter">-- PENDING --</span>
                                        )}
                                    </td>
                                    <td className="py-6 text-right pr-6">
                                        {bus.is_logged ? (
                                            <button
                                                onClick={() => handleDelete(bus.reading_id, bus.bus_no, bus.rc_plate_number)}
                                                disabled={deletingId === bus.reading_id}
                                                className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl border border-red-200 transition-all inline-flex items-center gap-1.5 shadow-sm"
                                                title={`Delete wrong reading for Bus ${bus.bus_no || bus.rc_plate_number}`}
                                            >
                                                <Trash2 size={15} /> Delete Entry
                                            </button>
                                        ) : (
                                            <span className="text-slate-300 text-xs">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Expandable Recent Fleet Readings Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button
                    onClick={() => setShowRecentHistory(prev => !prev)}
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <History size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-navy">Recent Fleet Readings History</h3>
                            <p className="text-xs text-slate-400">View and manage recent odometer entries across the fleet. Delete any wrong entry directly.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        {showRecentHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </button>

                {showRecentHistory && (
                    <div className="p-6 pt-0 border-t border-slate-100">
                        {recentReadings.length === 0 ? (
                            <p className="py-8 text-center text-slate-400 text-sm">No recent readings found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[10px] font-black">
                                            <th className="py-3 pl-4">Bus No</th>
                                            <th className="py-3">Vehicle Plate</th>
                                            <th className="py-3">Trip Date</th>
                                            <th className="py-3">Logged Date & Time</th>
                                            <th className="py-3">Previous Log</th>
                                            <th className="py-3">Logged KM</th>
                                            <th className="py-3">Distance</th>
                                            <th className="py-3 text-right pr-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentReadings.map((rec) => (
                                            <tr key={rec.reading_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 pl-4 font-bold text-navy">{rec.bus_no || 'N/A'}</td>
                                                <td className="py-3 font-mono text-slate-600">{rec.rc_plate_number}</td>
                                                <td className="py-3 text-slate-500">{rec.end_date}</td>
                                                <td className="py-3 text-slate-500 text-xs">
                                                    {rec.created_at_formatted || (rec.created_at ? new Date(rec.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')}
                                                </td>
                                                <td className="py-3 font-mono text-slate-500">{rec.old_reading} KM</td>
                                                <td className="py-3 font-mono font-bold text-navy">{rec.new_reading} KM</td>
                                                <td className="py-3">
                                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-xs">
                                                        +{rec.distance} KM
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right pr-4">
                                                    <button
                                                        onClick={() => handleDelete(rec.reading_id, rec.bus_no, rec.rc_plate_number)}
                                                        disabled={deletingId === rec.reading_id}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete this reading"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm text-blue-500">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-navy">Pro Tip: Fast & Safe Entry</h4>
                    <p className="text-blue-700 text-sm opacity-80 mt-1">
                        Use the **Numeric Keypad** and press **"Enter"** to jump directly between pending vehicles. If an incorrect value was submitted, click the **"Delete Entry"** button to instantly remove it and enter the corrected reading!
                    </p>
                </div>
            </div>
        </div>
    );
}
