import React, { useState, useEffect, useRef } from 'react';
import { Fuel, Calendar, Save, AlertCircle, CheckCircle2, FileText, Plus, ChevronRight, Gauge, TrendingUp, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DieselEntry() {
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [fuelRate, setFuelRate] = useState('');
    const [rateId, setRateId] = useState(null);
    const [fleetData, setFleetData] = useState([]); // from validation endpoint
    const [litersData, setLitersData] = useState({}); // { rc_plate_number: liters }
    const [validationStatus, setValidationStatus] = useState({ missing: false, checked: false, list: [] });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [viewMode, setViewMode] = useState('entry'); // 'entry' or 'summary'
    const [reportData, setReportData] = useState([]);

    const inputRefs = useRef({});
    const [focusedRow, setFocusedRow] = useState(null);

    // 1. Fetch data when date changes
    const checkDateStatus = async (selectedDate) => {
        setLoading(true);
        setError(null);
        setValidationStatus({ missing: false, checked: false, list: [] });

        try {
            // Check Odometer status
            const valRes = await fetch(`http://localhost:5001/api/diesel/validate/${selectedDate}`);
            const valResult = await valRes.json();

            if (valResult.status) {
                setValidationStatus({ missing: false, checked: true, list: [] });
                setFleetData(valResult.data);

                // Initialize liters input
                const initial = {};
                valResult.data.forEach(bus => {
                    initial[bus.rc_plate_number] = bus.liters || '';
                });
                setLitersData(initial);
            } else if (valResult.missing) {
                setValidationStatus({ missing: true, checked: true, list: valResult.data });
            }

            // Check Fuel Rate
            const rateRes = await fetch(`http://localhost:5001/api/fuel-rates/${selectedDate}`);
            const rateResult = await rateRes.json();
            if (rateResult.status && rateResult.data) {
                setFuelRate(rateResult.data.fuel_rate);
                setRateId(rateResult.data.rate_id);
            } else {
                setFuelRate('');
                setRateId(null);
            }
        } catch (err) {
            console.error("Error checking date status:", err);
            setError("Failed to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkDateStatus(date);
    }, [date]);

    const handleRateUpdate = async () => {
        if (!fuelRate || fuelRate <= 0) {
            setError("Please enter a valid fuel rate.");
            return;
        }
        try {
            const res = await fetch('http://localhost:5001/api/fuel-rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, rate: fuelRate })
            });
            const result = await res.json();
            if (result.status) {
                setRateId(result.data.rate_id);
                setSuccess("Fuel rate updated for " + date);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError("Failed to update fuel rate.");
        }
    };

    const handleInputChange = (rc_plate_number, value) => {
        setLitersData(prev => ({ ...prev, [rc_plate_number]: value }));
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
        if (!rateId) {
            setError("You must set the fuel rate before saving logs.");
            return;
        }

        setSaving(true);
        setError(null);

        const logsToSave = fleetData
            .filter(bus => litersData[bus.rc_plate_number] !== '')
            .map(bus => ({
                bus_id: bus.bus_id,
                rc_plate_number: bus.rc_plate_number,
                reading_id: bus.reading_id,
                rate_id: rateId,
                liters: parseFloat(litersData[bus.rc_plate_number]),
                date: date
            }));

        if (logsToSave.length === 0) {
            setError("No quantity entered to save.");
            setSaving(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5001/api/diesel/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logs: logsToSave })
            });
            const result = await res.json();
            if (result.status) {
                // Fetch report for summary view
                const repRes = await fetch(`http://localhost:5001/api/diesel/report/${date}`);
                const repResult = await repRes.json();
                
                // Keep only the buses that had a valid diesel entry logged
                const activeEntries = repResult.data.filter(r => r.liters !== null && r.liters !== undefined && parseFloat(r.liters) > 0);
                
                setReportData(activeEntries);
                setViewMode('summary');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setViewMode('entry');
        setSuccess(null);
        setError(null);
        checkDateStatus(date);
    };

    const handleDownloadCSV = () => {
        const headers = ["Bus No", "Vehicle No", "Old Reading (KM)", "New Reading (KM)", "Dist. (KM)", "Qty (L)", "Economy (KMPL)"];
        const rows = reportData.map(r => [
            r.bus_no || 'N/A',
            r.rc_plate_number,
            r.old_reading,
            r.new_reading,
            r.distance,
            r.liters,
            parseFloat(r.kmpl).toFixed(2)
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Diesel_Report_${date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (viewMode === 'summary') {
        return (
            <div className="max-w-6xl mx-auto space-y-6 animate-in zoom-in-95 duration-500 print:max-w-none print:m-0">
                <div className="flex justify-between items-center print:hidden px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-navy">Fuel Efficiency Report</h1>
                            <p className="text-slate-500 text-sm">Automated KMPL analysis for {date}.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleDownloadCSV} className="btn btn-outline border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
                            <FileText size={18} /> Download Excel
                        </button>
                        <button onClick={() => window.print()} className="btn btn-outline border-slate-200 flex items-center gap-2">
                            <FileText size={18} /> Download PDF
                        </button>
                        <button onClick={handleReset} className="btn btn-primary bg-orange-600 border-none shadow-lg shadow-orange-100 flex items-center gap-2">
                            <Plus size={18} /> New Entry
                        </button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 print-content print:shadow-none print:border-none print:p-0">
                    <div className="flex justify-between items-end mb-10 border-b pb-10 border-slate-50">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-navy uppercase tracking-tighter italic">Diesel Operations Hub</h2>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                    <Calendar size={14} className="text-orange-500" /> Log Date: {date}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                    <IndianRupee size={14} className="text-orange-500" /> Rate: ₹{fuelRate}/L
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fleet Total Dist.</p>
                                <p className="text-2xl font-black text-navy leading-none">{reportData.reduce((acc, r) => acc + (parseFloat(r.distance) || 0), 0)} <span className="text-xs italic text-slate-400">KM</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fuel Cost</p>
                                <p className="text-2xl font-black text-orange-600 leading-none">₹{reportData.reduce((acc, r) => acc + (parseFloat(r.total_amount) || 0), 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-left">
                                <th className="py-4 pl-6 uppercase tracking-widest text-[10px] font-black">Bus No</th>
                                <th className="py-4 uppercase tracking-widest text-[10px] font-black">Vehicle RC</th>
                                <th className="py-4 uppercase tracking-widest text-[10px] font-black">Reading (KM)</th>
                                <th className="py-4 uppercase tracking-widest text-[10px] font-black">Dist. (KM)</th>
                                <th className="py-4 uppercase tracking-widest text-[10px] font-black">Qty (L)</th>
                                <th className="py-4 uppercase tracking-widest text-[10px] font-black">Amount (Rs.)</th>
                                <th className="py-4 uppercase tracking-widest text-[10px] font-black">Economy (KMPL)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reportData.map((record) => (
                                <tr key={record.rc_plate_number} className="hover:bg-orange-50/20 transition-colors">
                                    <td className="py-5 pl-6 font-black text-navy text-lg">{record.bus_no || 'N/A'}</td>
                                    <td className="py-5 font-bold text-slate-700">{record.rc_plate_number}</td>
                                    <td className="py-5 text-sm font-mono text-slate-400">
                                        {record.old_reading} → <span className="text-slate-700 font-bold">{record.new_reading}</span>
                                    </td>
                                    <td className="py-5">
                                        <span className="font-black text-slate-700">{record.distance}</span>
                                    </td>
                                    <td className="py-5 font-black text-orange-600 italic">
                                        {record.liters}
                                    </td>
                                    <td className="py-5 font-black text-green-600 italic">
                                        {parseFloat(record.liters * fuelRate).toFixed(2)}
                                    </td>
                                    <td className="py-5 text-center pr-6">
                                        <div className="inline-flex items-center gap-3 px-3 py-1 rounded-lg font-black text-sm">
                                            {parseFloat(record.kmpl).toFixed(2)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-12 pt-8 border-t border-slate-50 flex justify-between items-center text-slate-400 text-xs italic">
                        <p>© {new Date().getFullYear()} Tracco Intelligence Systems</p>
                        <p>Report Signature: _______________________</p>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body * { visibility: hidden !important; }
                        .print-content, .print-content * { visibility: visible !important; }
                        .print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                        .print-content table { font-size: 10px; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 mb-20">
            {/* Header / Config Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
                        <Fuel size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Refueling Batch Entry</h1>
                        <p className="text-slate-500 text-sm italic">Connect diesel logs to odometer records.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 focus-within:border-orange-200 transition-all flex-1 lg:flex-none">
                        <Calendar size={18} className="text-slate-400" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-transparent font-black text-navy focus:outline-none w-full"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 focus-within:border-orange-500 transition-all group flex-1 lg:flex-none">
                        <span className="text-slate-400 font-black">₹</span>
                        <input
                            type="number"
                            step="0.01"
                            value={fuelRate}
                            placeholder="Set Rate"
                            onChange={(e) => setFuelRate(e.target.value)}
                            onBlur={handleRateUpdate}
                            className="bg-transparent font-black text-navy focus:outline-none w-24"
                        />
                        {!rateId && fuelRate && (
                            <button onClick={handleRateUpdate} className="text-orange-500 hover:text-orange-700">
                                <Save size={18} />
                            </button>
                        )}
                        {rateId && <CheckCircle2 size={18} className="text-emerald-500" />}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || validationStatus.missing || !rateId}
                        className={`
                            btn px-8 py-3 flex items-center gap-2 shadow-xl transition-all
                            ${(saving || validationStatus.missing || !rateId)
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100'}
                        `}
                    >
                        {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                        Finalize Diesel Batch
                    </button>
                </div>
            </div>

            {/* Error / Success Alerts */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-2xl flex items-center gap-4 animate-in slide-in-from-left-6">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p className="text-red-700 font-black uppercase tracking-widest text-[10px]">Critical Alert</p>
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Validation State: Missing Odometer Readings */}
            {validationStatus.checked && validationStatus.missing && (
                <div className="card border-2 border-dashed border-red-200 bg-red-50/30 p-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto text-red-500">
                        <Gauge size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-navy italic">Hold on! Odometer Sync Required</h2>
                        <p className="text-slate-600 max-w-lg mx-auto">
                            Diesel logging requires distances from odometer readings. We found **{validationStatus.list.length} buses** without records for {date}.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                        {validationStatus.list.map(b => (
                            <span key={b.rc_plate_number} className="bg-white border border-red-100 px-3 py-1 rounded-lg text-xs font-bold text-red-400 flex flex-col items-center">
                                <span className="text-[9px] uppercase tracking-widest text-red-300">Bus {b.bus_no || 'N/A'}</span>
                                {b.rc_plate_number}
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/entry/odometer')}
                        className="btn bg-navy text-white hover:bg-slate-800 px-10 py-4 flex items-center gap-3 mx-auto shadow-2xl"
                    >
                        Go to Odometer Entry <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Ready for Log: The Entry Table */}
            {validationStatus.checked && !validationStatus.missing && (
                <div className="table-container shadow-2xl border border-slate-100 rounded-[2rem] overflow-hidden">
                    <table className="admin-table">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-6 pl-10 uppercase tracking-widest text-[10px] font-black text-slate-400 text-left">Bus No</th>
                                <th className="py-6 uppercase tracking-widest text-[10px] font-black text-slate-400 text-left">Vehicle Specification</th>
                                <th className="uppercase tracking-widest text-[10px] font-black text-slate-400 text-left">Activity Range</th>
                                <th className="uppercase tracking-widest text-[10px] font-black text-slate-400">Refueling Volume (Liters)</th>
                                <th className="text-center pr-10 uppercase tracking-widest text-[10px] font-black text-slate-400">Economy (KMPL)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {fleetData.map((bus, index) => {
                                const isActive = focusedRow === bus.rc_plate_number;
                                return (
                                    <tr key={bus.rc_plate_number} className={`transition-all duration-300 ${isActive ? 'bg-orange-50/50' : 'hover:bg-slate-50/50'}`}>
                                        <td className="py-6 pl-10">
                                            <div className="flex flex-col">
                                                <span className="font-black text-navy text-xl leading-none">{bus.bus_no || 'N/A'}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">Bus Number</span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-lg leading-none">{bus.rc_plate_number}</span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">Plate Authentication</span>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Distance Gain</span>
                                                    <span className="font-black text-slate-700 italic">{bus.distance} <span className="text-[10px]">KM</span></span>
                                                </div>
                                                <div className="h-4 w-px bg-slate-200" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Odometer</span>
                                                    <span className="text-xs font-mono text-slate-400">{bus.old_reading} → {bus.new_reading}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <div className="relative w-fit group">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    ref={el => inputRefs.current[bus.rc_plate_number] = el}
                                                    value={litersData[bus.rc_plate_number] || ''}
                                                    onChange={(e) => handleInputChange(bus.rc_plate_number, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                                    onFocus={() => setFocusedRow(bus.rc_plate_number)}
                                                    onBlur={() => setFocusedRow(null)}
                                                    className={`
                                                        w-48 px-5 py-4 rounded-2xl font-black text-3xl transition-all outline-none
                                                        bg-white border-2 border-slate-100 text-orange-600 focus:border-orange-500 focus:ring-8 focus:ring-orange-50 shadow-sm
                                                    `}
                                                    placeholder="00.00"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-200 font-black text-xl pointer-events-none group-focus-within:text-orange-400 transition-colors">L</span>
                                            </div>
                                        </td>
                                        <td className="py-6 text-center pr-10">
                                            {litersData[bus.rc_plate_number] > 0 ? (
                                                <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 leading-none">Yield</span>
                                                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg font-black text-[10px] border border-emerald-100 flex items-center gap-1">
                                                        <TrendingUp size={12} />
                                                        {(bus.distance / litersData[bus.rc_plate_number]).toFixed(2)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-200 font-black uppercase tracking-tighter text-xs">Waiting...</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legend / Pro-Tip */}
            {!validationStatus.missing && (
                <div className="bg-navy p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center gap-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
                    <div className="p-4 bg-white/10 rounded-2xl">
                        <TrendingUp size={32} className="text-orange-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h4 className="font-black uppercase tracking-[0.2em] text-xs text-orange-400">Automated Efficiency Calculation</h4>
                        <p className="text-blue-100 text-sm leading-relaxed max-w-2xl opacity-80">
                            The system is currently mapping <span className="font-bold text-white">Daily Odometer Records</span> to these fuel entries.
                            If a bus was not driven (0 KM), the KMPL will remain null. Ensure the <span className="underline decoration-orange-400 underline-offset-4">Fuel Rate</span> is accurate per your vendor invoice.
                        </p>
                    </div>
                    <div className="text-center md:text-right">
                        <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2 opacity-50">Keyboard Mode</div>
                        <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-4 py-2 rounded-xl">
                            <span className="bg-white/20 px-2 py-0.5 rounded">Enter</span>
                            <span className="text-blue-200">Next Cell</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
