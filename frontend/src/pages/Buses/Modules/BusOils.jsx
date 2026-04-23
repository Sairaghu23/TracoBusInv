import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Droplet, Calendar, IndianRupee, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BusOils() {
    const { id: rc_plate_number } = useParams();
    const navigate = useNavigate();

    const [bus, setBus] = useState(null);
    const [oilLogs, setOilLogs] = useState([]);
    const [oilTypes, setOilTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [readingExists, setReadingExists] = useState(false);
    const [readingErrorMsg, setReadingErrorMsg] = useState('');

    const [logData, setLogData] = useState({
        oil_id: '',
        log_date: new Date().toISOString().split('T')[0],
        quantity: '',
        amount: '',
        old_reading: '',
        new_reading: ''
    });
    const [lastOdometer, setLastOdometer] = useState(0);

    const checkReadingStatus = async (selectedDate) => {
        setReadingErrorMsg('');
        try {
            const res = await fetch(`/api/buses/${rc_plate_number}/readings/date/${selectedDate}`);
            const result = await res.json();

            if (result.status && result.data) {
                setReadingExists(true);
                setReadingErrorMsg('');
            } else {
                setReadingExists(false);
                setReadingErrorMsg(`Please enter the Odometer reading for ${new Date(selectedDate).toLocaleDateString()} before logging oil.`);
            }
        } catch (err) {
            setReadingExists(false);
        }
    };

    useEffect(() => {
        if (logData.log_date) {
            checkReadingStatus(logData.log_date);
        }
    }, [logData.log_date, rc_plate_number]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [busRes, logsRes, typesRes] = await Promise.all([
                fetch(`/api/buses/${rc_plate_number}`),
                fetch(`/api/buses/${rc_plate_number}/oils`),
                fetch('/api/oils/types')
            ]);

            const busResult = await busRes.json();
            const logsResult = await logsRes.json();
            const typesResult = await typesRes.json();

            if (busResult.status) setBus(busResult.data);
            if (logsResult.status) {
                setOilLogs(logsResult.data);
                // Pre-fill old_reading from last recorded new_reading
                if (logsResult.data.length > 0) {
                    const last = logsResult.data[0].new_reading || 0;
                    setLastOdometer(last);
                    setLogData(prev => ({ ...prev, old_reading: last }));
                }
            }
            if (typesResult.status) setOilTypes(typesResult.data);
        } catch (err) {
            console.error('Error fetching oil data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [rc_plate_number]);

    const handleSubmit = async () => {
        if (!logData.oil_id || !logData.quantity || !logData.amount) {
            setError('Please fill in all fields.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/buses/${rc_plate_number}/oils`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            });
            const result = await res.json();
            if (result.status) {
                setSuccess('Oil service logged successfully!');
                setIsAddModalOpen(false);
                setLogData({ oil_id: '', log_date: new Date().toISOString().split('T')[0], quantity: '', amount: '' });
                fetchData();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(result.message || 'Failed to save log.');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const totalExpenditure = oilLogs.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    if (loading) return (
        <div className="p-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Back Button */}
            <button
                onClick={() => navigate(`/buses/${rc_plate_number}`)}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy transition-colors"
            >
                <ChevronLeft size={16} /> Back to {bus?.rc_plate_number || 'Vehicle'}
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <Droplet size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Oil & Fluid Maintenance</h1>
                        <p className="text-slate-500 text-sm">Track oil servicing and fluid replacements.</p>
                    </div>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary shadow-lg shadow-blue-100">
                    <Plus size={18} /> Add Service Record
                </button>
            </div>

            {/* Success Alert */}
            {success && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-2xl flex items-center gap-3 animate-in slide-in-from-left-6">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    <p className="text-emerald-700 font-semibold">{success}</p>
                </div>
            )}

            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0 shadow-inner">
                    <Droplet size={32} />
                </div>
                <div className="text-center md:text-left">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Oil Expenditure</p>
                    <h2 className="text-4xl font-black text-navy italic">₹{totalExpenditure.toLocaleString()}</h2>
                </div>
                <div className="md:ml-auto border-l border-slate-100 pl-8 hidden md:block">
                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-tighter">Last Service</p>
                    <p className="font-bold text-slate-700">
                        {oilLogs.length > 0 ? new Date(oilLogs[0].log_date).toLocaleDateString() : 'No records yet'}
                    </p>
                </div>
                <div className="md:border-l border-slate-100 md:pl-8 hidden md:block">
                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-tighter">Total Services</p>
                    <p className="font-black text-2xl text-navy">{oilLogs.length}</p>
                </div>
            </div>

            {/* History Table */}
            <div className="table-container shadow-md border border-slate-100 rounded-2xl overflow-hidden">
                <table className="admin-table">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="py-4 pl-8 text-left uppercase tracking-widest text-[10px] font-black">Date</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Old ODO</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">New ODO</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Distance</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Oil / Fluid Type</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Quantity</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Amount (₹)</th>
                            <th className="py-4 pr-8 text-right uppercase tracking-widest text-[10px] font-black">Logged At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {oilLogs.map((record) => (
                            <tr key={record.log_id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-4 pl-8 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="font-semibold text-xs">{new Date(record.log_date).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="py-4 font-semibold text-slate-600 text-xs">
                                    {record.old_reading ? record.old_reading.toLocaleString() : 0}
                                </td>
                                <td className="py-4 font-bold text-navy text-xs">
                                    {record.new_reading ? record.new_reading.toLocaleString() : 0}
                                </td>
                                <td className="py-4 font-black text-emerald-600 text-xs">
                                    {(record.new_reading && record.old_reading) ? (record.new_reading - record.old_reading).toLocaleString() + ' km' : 0}
                                </td>
                                <td className="py-4">
                                    <span className="font-bold text-blue-700 uppercase text-[10px] tracking-wide px-2 py-1 bg-blue-50 rounded">
                                        {record.oil_type}
                                    </span>
                                </td>
                                <td className="py-4 whitespace-nowrap">
                                    <span className="font-black text-slate-700 text-xs">{record.quantity}</span>
                                    <span className="text-slate-400 text-[10px] ml-1 uppercase">L</span>
                                </td>
                                <td className="py-4 pr-8 text-right font-black text-navy text-sm whitespace-nowrap">
                                    ₹{parseFloat(record.amount || 0).toLocaleString()}
                                </td>
                                <td className="py-4 pr-8 text-right text-xs text-slate-400 font-mono whitespace-nowrap">
                                    {record.created_at
                                        ? new Date(record.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                        {oilLogs.length === 0 && (
                            <tr>
                                <td colSpan="8" className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Droplet size={48} className="text-slate-100" />
                                        <p className="text-slate-400 font-medium italic">No oil service records found for this vehicle.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Oil Log Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="bg-navy p-8 text-white flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold">Log Oil Service</h2>
                                <p className="text-blue-200 text-sm mt-1 opacity-80 italic">Record fluid replacement for this vehicle.</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-blue-200 hover:text-white transition-colors mt-1">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-3 rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}
                            {readingErrorMsg && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm font-bold border border-red-200 rounded-xl animate-pulse">
                                    ⚠️ {readingErrorMsg}
                                </div>
                            )}

                            {/* Removed Odometer Readings Grid */}

                            {/* Oil Type Dropdown */}
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Oil / Fluid Type</label>
                                <select
                                    className="form-input bg-blue-50 border-blue-100 text-navy font-bold focus:border-blue-500"
                                    value={logData.oil_id}
                                    onChange={(e) => setLogData({ ...logData, oil_id: e.target.value })}
                                >
                                    <option value="">-- Select Oil Type --</option>
                                    {oilTypes.map(o => (
                                        <option key={o.oil_id} value={o.oil_id}>{o.oil_type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Service Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={logData.log_date}
                                    onChange={(e) => setLogData({ ...logData, log_date: e.target.value })}
                                />
                            </div>

                            {/* Quantity & Amount side by side */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Quantity (Litres)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="form-input font-black text-lg text-navy"
                                        placeholder="0"
                                        value={logData.quantity}
                                        onChange={(e) => setLogData({ ...logData, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            className="form-input pl-10 font-black text-lg text-navy"
                                            placeholder="0.00"
                                            value={logData.amount}
                                            onChange={(e) => setLogData({ ...logData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 pt-0 flex justify-between gap-4">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600">Discard</button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving || !logData.oil_id || !logData.quantity || !logData.amount || !readingExists}
                                className={`btn px-10 rounded-2xl transition-all ${saving || !logData.oil_id || !logData.quantity || !logData.amount || !readingExists
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'btn-primary shadow-xl shadow-blue-100 hover:scale-[1.02]'
                                    }`}
                            >
                                {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : null}
                                Save Oil Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
