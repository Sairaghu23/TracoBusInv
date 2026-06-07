import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Fuel, AlertCircle, X, CheckCircle2, Calendar, IndianRupee } from 'lucide-react';
import api from '../../../utils/api';

export default function BusDiesel() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bus, setBus] = useState(null);
    const [busDiesel, setBusDiesel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [logData, setLogData] = useState({
        refueling_date: new Date().toISOString().split('T')[0],
        liters: '',
        rate: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const busResult = await api.get(`/api/buses/${id}`);
                if (busResult.data?.status) {
                    setBus(busResult.data.data);
                    const dieselResult = await api.get(`/api/buses/${id}/diesel`);
                    if (dieselResult.data?.status) {
                        setBusDiesel(dieselResult.data.data);
                    }
                }
            } catch (err) {
                console.error("Error fetching diesel data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async () => {
        if (!logData.liters || !logData.rate || !logData.refueling_date) {
            setError('Please fill in all fields.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const result = await api.post(`/api/buses/${id}/diesel`, logData);
            if (result.data?.status) {
                setSuccess('Fuel log added successfully!');
                setIsAddModalOpen(false);
                setLogData({ refueling_date: new Date().toISOString().split('T')[0], liters: '', rate: '' });
                // Refresh diesel logs
                const dieselResult = await api.get(`/api/buses/${id}/diesel`);
                if (dieselResult.data?.status) setBusDiesel(dieselResult.data.data);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.data?.message || 'Failed to add record.');
            }
        } catch (err) {
            console.error('Error saving diesel log:', err);
            setError(err.response?.data?.message || 'Server error. Please try again.');
        } finally {
            setSaving(false);
        }
    };


    const totalExpenditure = busDiesel.reduce((sum, record) => sum + (parseFloat(record.total_amount) || 0), 0);
    const avgKMPL = busDiesel.length > 0
        ? (busDiesel.reduce((sum, r) => sum + parseFloat(r.kmpl), 0) / busDiesel.length)
        : 0;

    if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div></div>;

    return (
        <>
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <button
                onClick={() => navigate(`/buses/${id}`)}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy transition-colors"
            >
                <ChevronLeft size={16} /> Back to {bus?.rc_plate_number || 'Vehicle'}
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-navy flex items-center gap-3">
                    <Fuel className="text-orange-500" />
                    Fuel Consumption & Economy
                </h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary bg-orange-600 hover:bg-orange-700 border-none shadow-lg shadow-orange-100"
                >
                    <Plus size={18} /> Add Diesel Log
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-orange-50 border-orange-100 flex items-center gap-6 p-6 rounded-2xl">
                    <div className="p-4 bg-white rounded-xl shadow-sm border border-orange-100 text-orange-600">
                        <Fuel size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-1">Total Fuel Expenditure</p>
                        <h2 className="text-3xl font-bold text-slate-800">₹{totalExpenditure.toLocaleString()}</h2>
                        <p className="text-xs text-slate-500 mt-1">Lifetime logs for {bus?.rc_plate_number}</p>
                    </div>
                </div>

                <div className="card flex items-center justify-center gap-6 border-l-4 border-l-orange-500 bg-white p-6 rounded-2xl shadow-sm">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Avg Economy</p>
                        <h2 className="text-4xl font-black text-navy italic">
                            {avgKMPL.toFixed(2)} <span className="text-xs text-slate-400 NOT-italic font-bold">KM/L</span>
                        </h2>
                    </div>
                </div>
            </div>

            <div className="table-container shadow-xl border border-slate-100 rounded-3xl overflow-hidden">
                <table className="admin-table w-full">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-left">
                            <th className="py-5 pl-8 uppercase tracking-widest text-[10px] font-black">Refueling Date</th>
                            <th className="uppercase tracking-widest text-[10px] font-black">Odometer Range (KM)</th>
                            <th className="uppercase tracking-widest text-[10px] font-black">Quantity (L)</th>
                            <th className="uppercase tracking-widest text-[10px] font-black">Rate (₹/L)</th>
                            <th className="uppercase tracking-widest text-[10px] font-black">Amount (₹)</th>
                            <th className="uppercase tracking-widest text-[10px] font-black">Efficiency</th>
                            <th className="text-right pr-8 uppercase tracking-widest text-[10px] font-black">Logged At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {busDiesel.map((record) => (
                            <tr key={record.diesel_id} className="hover:bg-orange-50/20 transition-colors">
                                <td className="py-5 pl-8 font-bold text-slate-900">
                                    {new Date(record.refueling_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="text-sm font-mono text-slate-500">
                                    {record.old_reading} → <span className="text-slate-800 font-bold">{record.new_reading}</span>
                                </td>
                                <td className="font-black text-orange-600">{record.liters} L</td>
                                <td className="text-slate-500 text-sm">₹{record.rate}</td>
                                <td className="font-bold text-navy">
                                    ₹{parseFloat(record.total_amount).toLocaleString()}
                                </td>
                                <td className="text-right pr-8">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-black text-xs
                                        ${parseFloat(record.kmpl) > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}
                                    `}>
                                        {parseFloat(record.kmpl).toFixed(2)} KMPL
                                    </div>
                                </td>
                                <td className="text-right pr-8 text-xs text-slate-400 font-mono whitespace-nowrap">
                                    {record.created_at
                                        ? new Date(record.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                        {busDiesel.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center py-24">
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <Fuel size={48} className="opacity-10" />
                                        <p className="font-medium italic">No refueling records found for this vehicle.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Add Modal */}
        {isAddModalOpen && (
            <div className="fixed inset-0 bg-navy/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="p-8 bg-orange-600 text-white flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="p-4 bg-white/10 rounded-2xl">
                                <Fuel size={32} className="text-orange-200" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tight">Record Refueling</h2>
                                <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">{bus?.rc_plate_number} • {bus?.bus_no}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        {error && (
                            <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl flex gap-3 text-sm font-bold items-center border border-amber-100">
                                <AlertCircle size={20} /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Refueling Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="date"
                                        value={logData.refueling_date}
                                        onChange={(e) => setLogData({ ...logData, refueling_date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-navy focus:outline-none focus:border-orange-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                            {/* Removed Odometer Readings Grid */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Quantity */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantity (Liters)</label>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={logData.liters}
                                    onChange={(e) => setLogData({ ...logData, liters: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-navy focus:outline-none focus:border-orange-500 transition-all"
                                />
                            </div>

                            {/* Rate */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rate (₹/Liter)</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={logData.rate}
                                        onChange={(e) => setLogData({ ...logData, rate: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-navy focus:outline-none focus:border-orange-500 transition-all text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className={`w-full py-4 text-white rounded-2xl font-black italic tracking-tight transition-all text-lg flex items-center justify-center gap-2
                                ${saving ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-100'}`}
                        >
                            {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <><CheckCircle2 size={24} /> Submit Record</>}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Success Alert */}
        {success && (
            <div className="fixed bottom-6 right-6 bg-navy text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 z-50">
                <CheckCircle2 className="text-emerald-400" size={24} />
                <span className="font-bold">{success}</span>
            </div>
        )}
        </>
    );
}
