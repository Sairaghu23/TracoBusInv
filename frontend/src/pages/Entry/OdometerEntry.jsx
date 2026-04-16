import React, { useState, useEffect, useRef } from 'react';
import { Gauge, Calendar, Save, AlertCircle, CheckCircle2, FileText, Plus } from 'lucide-react';

export default function OdometerEntry() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [fleetData, setFleetData] = useState([]);
    const [newReadings, setNewReadings] = useState({}); // { rc_plate_number: reading }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [viewMode, setViewMode] = useState('entry'); // 'entry' or 'summary'
    const [savedData, setSavedData] = useState([]);

    const inputRefs = useRef({});
    const [focusedRow, setFocusedRow] = useState(null);

    const fetchFleet = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/readings/all-latest');
            const result = await res.json();
            if (result.status) {
                setFleetData(result.data);
                // Initialize newReadings with empty strings
                const initial = {};
                result.data.forEach(bus => {
                    initial[bus.rc_plate_number] = '';
                });
                setNewReadings(initial);
            }
        } catch (err) {
            console.error("Error fetching fleet:", err);
            setError("Failed to load fleet data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFleet();
    }, []);

    const handleInputChange = (rc_plate_number, value) => {
        setNewReadings(prev => ({ ...prev, [rc_plate_number]: value }));
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextIndex = index + 1;
            if (nextIndex < fleetData.length) {
                const nextRc = fleetData[nextIndex].rc_plate_number;
                inputRefs.current[nextRc]?.focus();
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        // Filter out empty readings and format for backend
        const readingsToSave = fleetData
            .filter(bus => newReadings[bus.rc_plate_number] !== '')
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
            setError("No readings entered to save.");
            setSaving(false);
            return;
        }

        try {
            const res = await fetch('/api/readings/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ readings: readingsToSave })
            });
            const result = await res.json();
            if (result.status) {
                setSuccess(`Successfully saved ${readingsToSave.length} readings.`);
                setSavedData(readingsToSave);
                setViewMode('summary');
                fetchFleet(); // Refresh latest readings
            } else {
                setError(result.message);
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
        // Clear inputs
        const initial = {};
        fleetData.forEach(bus => {
            initial[bus.rc_plate_number] = '';
        });
        setNewReadings(initial);
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

    if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div></div>;

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
                            <Plus size={18} /> New Entry
                        </button>
                    </div>
                </div>

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

                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-left">
                                <th className="py-4 pl-6 uppercase tracking-widest text-[10px] font-black">Bus No</th>
                                <th className="py-4 uppercase tracking-widest text-[10px] font-black">Vehicle RC</th>
                                <th className="py-4 uppercase tracking-widest text-[10px] font-black">Previous log (KM)</th>
                                <th className="py-4 uppercase tracking-widest text-[10px] font-black">Current entry (KM)</th>
                                <th className="py-4 text-right pr-6 uppercase tracking-widest text-[10px] font-black">Distance Gain</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {savedData.map((record) => (
                                <tr key={record.rc_plate_number} className="hover:bg-slate-50 group transition-colors">
                                    <td className="py-5 pl-6 font-black text-navy text-lg">{record.bus_no || 'N/A'}</td>
                                    <td className="py-5 font-bold text-slate-600">{record.rc_plate_number}</td>
                                    <td className="py-5 font-mono text-slate-500">{record.old_reading}</td>
                                    <td className="py-5 font-mono text-slate-800 font-bold">{record.new_reading}</td>
                                    <td className="py-5 text-right pr-6">
                                        <span className="bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-lg text-sm">
                                            +{record.new_reading - record.old_reading} KM
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

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

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <Gauge size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Daily Odometer Entry</h1>
                        <p className="text-slate-500 text-sm">Batch record odometer readings for the entire fleet.</p>
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
                        disabled={saving}
                        className="btn btn-primary shadow-lg shadow-blue-100 px-8 py-3 flex items-center gap-2"
                    >
                        {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                        Save Fleet Batch
                    </button>
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

            <div className="table-container shadow-xl border border-slate-100 rounded-2xl overflow-hidden mb-8">
                <table className="admin-table">
                    <thead className="bg-navy text-white">
                        <tr>
                            <th className="py-5 pl-8 text-left">Bus No</th>
                            <th className="py-5 text-left">Vehicle RC Number</th>
                            <th className="text-left">Previous Reading</th>
                            <th className="text-left">Current Reading Entry</th>
                            <th className="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {fleetData.map((bus, index) => {
                            const currentVal = parseInt(newReadings[bus.rc_plate_number]) || 0;
                            const prevVal = parseInt(bus.last_reading) || 0;
                            const tripDistance = currentVal > 0 ? currentVal - prevVal : 0;
                            const isError = currentVal > 0 && currentVal < prevVal;
                            const isActive = focusedRow === bus.rc_plate_number;

                            return (
                                <tr 
                                    key={bus.rc_plate_number} 
                                    className={`transition-all duration-200 ${isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
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
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous Log</span>
                                            <div className="flex items-center gap-2">
                                                <Gauge size={14} className="text-slate-300" />
                                                <span className="font-mono font-bold text-slate-600">
                                                    {bus.last_reading || '0'} <span className="text-[10px] text-slate-400">KM</span>
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6">
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
                                    </td>
                                    <td className="py-6 text-center">
                                        {tripDistance > 0 && !isError ? (
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
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm text-blue-500">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-navy">Pro Tip: Keyboard Speed</h4>
                    <p className="text-blue-700 text-sm opacity-80 mt-1">
                        Use the **Numeric Keypad** for fast typing. Press **"Enter"** after each reading to automatically jump to the next vehicle without touching your mouse!
                    </p>
                </div>
            </div>
        </div>
    );
}
