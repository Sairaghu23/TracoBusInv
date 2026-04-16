import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Fuel, AlertCircle } from 'lucide-react';

export default function BusDiesel() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bus, setBus] = useState(null);
    const [busDiesel, setBusDiesel] = useState([]); // Empty until diesel table is implemented
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Bus Details
                const busRes = await fetch(`/api/buses/${id}`);

                const busResult = await busRes.json();

                if (busResult.status) {
                    setBus(busResult.data);
                    const dieselRes = await fetch(`/api/buses/${id}/diesel`);
                    const dieselResult = await dieselRes.json();
                    if (dieselResult.status) {
                        setBusDiesel(dieselResult.data);
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

    const totalExpenditure = busDiesel.reduce((sum, record) => sum + (parseFloat(record.total_amount) || 0), 0);
    const avgKMPL = busDiesel.length > 0
        ? (busDiesel.reduce((sum, r) => sum + parseFloat(r.kmpl), 0) / busDiesel.length)
        : 0;

    if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div></div>;

    return (
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
                    onClick={() => navigate('/entry/diesel')}
                    className="btn btn-primary bg-orange-600 hover:bg-orange-700 border-none shadow-lg shadow-orange-100"
                >
                    <Plus size={18} /> Batch Refueling
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
                            <th className="text-right pr-8 uppercase tracking-widest text-[10px] font-black">Efficiency</th>
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
                            </tr>
                        ))}
                        {busDiesel.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-24">
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
    );
}
