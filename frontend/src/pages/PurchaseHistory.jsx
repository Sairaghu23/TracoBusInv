import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingBag, Calendar, User, ArrowRight } from 'lucide-react';

export default function PurchaseHistory() {
    const { spare_id } = useParams();
    const navigate = useNavigate();
    
    const [spare, setSpare] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch All Stocks to find the specific spare name (or we could add a specific API for one spare)
            // For efficiency, we'll fetch the purchases first and get names from the first record if available
            // Actually, let's fetch stocks to get the spare name correctly
            const stocksRes = await fetch('http://localhost:5001/api/spares/stocks');
            const stocksResult = await stocksRes.json();
            if (stocksResult.status) {
                const foundSpare = stocksResult.data.find(s => s.spare_id === parseInt(spare_id));
                setSpare(foundSpare);
            }

            const res = await fetch(`http://localhost:5001/api/spares/${spare_id}/purchases`);
            const result = await res.json();
            if (result.status) {
                setPurchases(result.data);
            }
        } catch (err) {
            console.error("Error fetching purchase history:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [spare_id]);

    const totalSpent = purchases.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <button 
                onClick={() => navigate('/stocks')}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy transition-colors"
            >
                <ChevronLeft size={16} /> Back to Inventory
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <ShoppingBag size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-navy">{spare?.spare_name || 'Spare Part'} - Purchase History</h1>
                        <p className="text-slate-500 text-sm italic">Master logs for all incoming stock shipments.</p>
                    </div>
                </div>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-navy text-white p-8">
                    <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2">Total Combined Investment</p>
                    <h2 className="text-4xl font-black italic">₹{totalSpent.toLocaleString()}</h2>
                </div>
                <div className="card bg-white border-l-4 border-l-emerald-500 p-8">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total Batches Purchased</p>
                    <h2 className="text-3xl font-bold text-navy">{purchases.length} Records</h2>
                </div>
                <div className="card bg-white border-l-4 border-l-blue-500 p-8">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Current Inventory Status</p>
                    <h2 className="text-3xl font-bold text-navy">{spare?.quantity || 0} Units Available</h2>
                </div>
            </div>

            {/* Logs Table */}
            <div className="table-container shadow-xl border border-slate-100 rounded-2xl overflow-hidden">
                <table className="admin-table">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="py-5 pl-8">Purchase Date</th>
                            <th>Supplier / Vendor</th>
                            <th>Inbound Quantity</th>
                            <th className="text-right pr-8">Total Invoice (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {purchases.map((log) => (
                            <tr key={log.purchase_id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                                <td className="py-5 pl-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                                            <Calendar size={16} />
                                        </div>
                                        <span className="font-bold text-slate-700">{new Date(log.purchase_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="text-navy font-semibold">{log.vendor}</span>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black text-xs border border-emerald-100">
                                            +{log.quantity} UNITS
                                        </span>
                                    </div>
                                </td>
                                <td className="text-right pr-8">
                                    <span className="text-xl font-black text-navy italic">₹{parseFloat(log.amount).toLocaleString()}</span>
                                </td>
                            </tr>
                        ))}
                        {purchases.length === 0 && (
                            <tr>
                                <td colSpan="4" className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <ShoppingBag size={48} className="text-slate-100" />
                                        <p className="text-slate-400 font-medium italic">No purchase logs found for this part classification.</p>
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
