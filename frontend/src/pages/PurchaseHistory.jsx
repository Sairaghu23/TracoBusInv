import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingBag, Calendar, User, ArrowRight } from 'lucide-react';
import api from '../utils/api';

export default function PurchaseHistory() {
    const { spare_id } = useParams();
    const navigate = useNavigate();
    
    const [spare, setSpare] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewCodesPurchase, setViewCodesPurchase] = useState(null);
    const [codesInModal, setCodesInModal] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const stocksResult = await api.get('/api/spares/stocks');
            if (stocksResult.data?.status) {
                const foundSpare = stocksResult.data.data.find(s => s.spare_id === parseInt(spare_id));
                setSpare(foundSpare);
            }

            const result = await api.get(`/api/spares/${spare_id}/purchases`);
            if (result.data?.status) {
                setPurchases(result.data.data);
            }
        } catch (err) {
            console.error("Error fetching purchase history:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCodes = async (purchase) => {
        setViewCodesPurchase(purchase);
        setLoadingCodes(true);
        try {
            const result = await api.get(`/api/spares/purchases/${purchase.purchase_id}/codes`);
            if (result.data?.status) {
                setCodesInModal(result.data.data);
            }
        } catch (err) {
            console.error("Error fetching codes:", err);
        } finally {
            setLoadingCodes(false);
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
                            <th className="text-right">Total Invoice (₹)</th>
                            <th className="text-right pr-8">Actions</th>
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
                                <td className="text-right">
                                    <span className="text-lg font-black text-navy italic">₹{parseFloat(log.amount).toLocaleString()}</span>
                                </td>
                                <td className="text-right pr-8">
                                    <button 
                                        onClick={() => fetchCodes(log)}
                                        className="btn btn-outline btn-sm font-black text-[10px] uppercase tracking-widest border-blue-200 text-blue-600"
                                    >
                                        View Unique Codes
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {purchases.length === 0 && (
                            <tr>
                                <td colSpan="5" className="py-24 text-center">
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

            {/* Codes Modal */}
            {viewCodesPurchase && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-navy text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">Inbound Tracking Codes</h2>
                                <p className="text-blue-100 text-[10px] uppercase font-black tracking-widest opacity-75">Batch: {new Date(viewCodesPurchase.purchase_date).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setViewCodesPurchase(null)} className="text-blue-100 hover:text-white">
                                <ArrowRight size={20} className="rotate-180" />
                            </button>
                        </div>
                        <div className="p-8">
                            {loadingCodes ? (
                                <div className="py-12 text-center text-slate-400 italic">Fetching codes...</div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                                    {codesInModal.map((item, idx) => (
                                        <div key={item.item_id} className={`p-4 rounded-xl border flex flex-col gap-1 ${item.status === 'USED' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-emerald-50/30 border-emerald-100 shadow-sm'}`}>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Code #{idx + 1}</span>
                                            <span className="font-black text-navy text-sm font-mono tracking-wider">{item.product_code}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${item.status === 'USED' ? 'text-slate-400' : 'text-emerald-600'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
                                    {codesInModal.length === 0 && <p className="col-span-2 py-8 text-center text-slate-400 font-medium italic">No individual codes found for this entry.</p>}
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 text-right">
                            <button onClick={() => setViewCodesPurchase(null)} className="px-10 py-3 bg-navy text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em]">Close Log</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
