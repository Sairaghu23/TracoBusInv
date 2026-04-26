import React, { useState, useEffect } from 'react';
import { Search, MapPin, Plus, X, Check, Route as RouteIcon, Pencil, Trash2, Users, BarChart3, GraduationCap, ChevronLeft } from 'lucide-react';
import api from '../../utils/api';

export default function Routes() {
    // State for live data
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data from DB
    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const result = await api.get('/api/routes');
            if (result.data?.status) {
                setRoutes(result.data.data);
            }
        } catch (error) {
            console.error("Error fetching routes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, []);

    // UI State
    const [searchType, setSearchType] = useState('route');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeModal, setActiveModal] = useState(null); // 'route' or 'stop'
    const [routeError, setRouteError] = useState('');

    // Form States
    const [newRouteName, setNewRouteName] = useState('');
    const [newStop, setNewStop] = useState({ name: '', routeId: '', fee: '' });

    // Edit state
    const [editingStop, setEditingStop] = useState(null); // { stop_id, name, fee }
    const [editingRoute, setEditingRoute] = useState(null); // { route_id, route_name }
    const [breakdownRoute, setBreakdownRoute] = useState(null); // { route_id, route_name }
    const [breakdownData, setBreakdownData] = useState([]);
    const [breakdownLoading, setBreakdownLoading] = useState(false);
    const [currentView, setCurrentView] = useState('list'); // 'list' | 'breakdown'

    // Handlers
    const handleAddRoute = async (e) => {
        e.preventDefault();
        if (!newRouteName) return;
        setRouteError('');
        try {
            const result = await api.post('/api/routes', { route_name: newRouteName });
            if (result.data?.status) {
                setNewRouteName('');
                setActiveModal(null);
                fetchRoutes(); // Refresh list
            } else if (result.status === 409) {
                setRouteError(result.data?.message || "Route already exists");
            } else {
                setRouteError(result.data?.message || "An error occurred");
            }
        } catch (error) {
            console.error("Error adding route:", error);
            if (error.response?.status === 409) {
                setRouteError(error.response.data?.message || "Route already exists");
            } else {
                setRouteError("Connection error. Please try again.");
            }
        }
    };

    const handleAddStop = async (e) => {
        e.preventDefault();
        if (!newStop.name || !newStop.routeId || !newStop.fee) return;
        try {
            const result = await api.post('/api/routes/stops', {
                route_id: parseInt(newStop.routeId),
                stop_name: newStop.name,
                fee: parseFloat(newStop.fee)
            });
            if (result.data?.status) {
                setNewStop({ name: '', routeId: '', fee: '' });
                setActiveModal(null);
                fetchRoutes();
            }
        } catch (error) {
            console.error("Error adding stop:", error);
        }
    };

    const handleSaveStop = async () => {
        if (!editingStop) return;
        try {
            const result = await api.put(`/api/routes/stops/${editingStop.stop_id}`, {
                stop_name: editingStop.name,
                fee: editingStop.fee
            });
            if (result.data?.status) { setEditingStop(null); fetchRoutes(); }
        } catch (err) { console.error('Error updating stop:', err); }
    };

    const handleSaveRoute = async () => {
        if (!editingRoute) return;
        try {
            const result = await api.put(`/api/routes/${editingRoute.route_id}`, {
                route_name: editingRoute.route_name
            });
            if (result.data?.status) { setEditingRoute(null); fetchRoutes(); }
        } catch (err) { console.error('Error updating route:', err); }
    };

    const handleDeleteRoute = async (route) => {
        const confirmed = window.confirm(
            `⚠️ DELETE ROUTE: "${route.route_name}"?\n\nThis will:\n• Permanently delete this route and all its stops from the network\n• Remove all stop mappings (route_stop_map)\n• Students currently on this route will remain in the system but their boarding assignment will be CLEARED (set to unassigned)\n\nThis action CANNOT be undone. Continue?`
        );
        if (!confirmed) return;
        try {
            const result = await api.delete(`/api/routes/${route.route_id}`);
            if (result.data?.status) {
                fetchRoutes();
            } else {
                alert(`Error: ${result.data?.message}`);
            }
        } catch (err) {
            console.error('Error deleting route:', err);
            alert('Connection error. Could not delete route.');
        }
    };

    const handleDeleteStop = async (stop, routeName) => {
        const confirmed = window.confirm(
            `⚠️ DELETE STOP: "${stop.name}" from "${routeName}"?\n\nThis will:\n• Permanently remove this stop from the route\n• Remove its entry from the stop mapping table\n• Students boarding at this stop will remain in the system but their boarding assignment will be CLEARED (set to unassigned)\n\nThis action CANNOT be undone. Continue?`
        );
        if (!confirmed) return;
        try {
            const result = await api.delete(`/api/routes/stops/${stop.stop_id}`);
            if (result.data?.status) {
                fetchRoutes();
            } else {
                alert(`Error: ${result.data?.message}`);
            }
        } catch (err) {
            console.error('Error deleting stop:', err);
            alert('Connection error. Could not delete stop.');
        }
    };

    const fetchBreakdown = async (route) => {
        setBreakdownRoute(route);
        setCurrentView('breakdown');
        setBreakdownLoading(true);
        try {
            const result = await api.get(`/api/routes/${route.route_id}/student-breakdown`);
            if (result.data?.status) {
                setBreakdownData(result.data.data);
            }
        } catch (error) {
            console.error("Error fetching breakdown:", error);
        } finally {
            setBreakdownLoading(false);
        }
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setBreakdownRoute(null);
        setBreakdownData([]);
    };

    // Filtering Logic
    const filteredRoutes = routes.filter(route => {
        if (searchType === 'route') {
            return route.route_name?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        // If searching by stop
        return route.stops?.some(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Conditional Header based on View */}
            {currentView === 'list' ? (
                <>
                    {/* Hero Branding Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4 px-1">
                        <div className="space-y-3">
                            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-100/50">
                                <RouteIcon size={36} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-navy italic tracking-tight leading-none">Fleet Routes</h1>
                                <p className="text-slate-500 font-medium mt-2">Manage your transport network, stopping points, and financial mappings.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 md:mt-0 shrink-0">
                            <button 
                                onClick={() => setActiveModal('stop')}
                                className="btn bg-white border border-slate-200 text-navy hover:bg-slate-50 shadow-sm rounded-xl px-5 py-3 flex items-center gap-2.5 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                            >
                                <MapPin size={16} /> Add Stop
                            </button>
                            <button 
                                onClick={() => setActiveModal('route')}
                                className="btn bg-navy text-white hover:bg-slate-800 shadow-xl shadow-navy/20 active:scale-95 transition-all rounded-xl px-6 py-3 flex items-center gap-2.5 font-black uppercase tracking-widest text-xs"
                            >
                                <Plus size={18} strokeWidth={3} /> Add Route
                            </button>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="card bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-stretch gap-2">
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 focus-within:border-orange-500 transition-all">
                            <Search size={18} className="text-slate-400" />
                            <select 
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="bg-transparent border-none text-sm font-black text-navy focus:outline-none cursor-pointer pr-4"
                            >
                                <option value="route">By Route</option>
                                <option value="stop">By Stop</option>
                            </select>
                        </div>
                        <div className="flex-1 flex items-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-orange-500 transition-all">
                            <input 
                                type="text" 
                                placeholder="Locate specific routes or transit points..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none w-full text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4 px-1 animate-in slide-in-from-top-10 duration-500">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={handleBackToList}
                            className="group w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-navy hover:text-white transition-all text-navy active:scale-90"
                            title="Back to Routes"
                        >
                            <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-3 py-1 bg-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest text-white">Route Report</span>
                                <GraduationCap size={16} className="text-orange-500" />
                            </div>
                            <h1 className="text-4xl font-black text-navy italic tracking-tight leading-none">{breakdownRoute?.route_name}</h1>
                            <p className="text-slate-500 font-medium mt-1 uppercase tracking-widest text-xs">Year-wise Student Distribution per Stop</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Fleet Presence</span>
                            <span className="text-xl font-black text-navy italic">{breakdownData.reduce((acc, d) => acc + parseInt(d.total || 0), 0)} Students</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            {currentView === 'list' ? (
                /* Route Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredRoutes.map(route => (
                        <div key={route.route_id} className="card bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between group-hover:bg-orange-50 transition-colors">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-navy group-hover:text-orange-600 transition-colors">
                                        <RouteIcon size={24} />
                                    </div>
                                    {editingRoute?.route_id === route.route_id ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                autoFocus
                                                className="flex-1 bg-white border border-orange-300 rounded-xl px-3 py-1.5 font-bold text-navy text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                                                value={editingRoute.route_name}
                                                onChange={e => setEditingRoute({ ...editingRoute, route_name: e.target.value })}
                                                onKeyDown={e => { if (e.key === 'Enter') handleSaveRoute(); if (e.key === 'Escape') setEditingRoute(null); }}
                                            />
                                            <button onClick={handleSaveRoute} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check size={14} /></button>
                                            <button onClick={() => setEditingRoute(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 flex-1">
                                            <h3 className="font-black text-navy tracking-tight">{route.route_name}</h3>
                                            <button
                                                onClick={() => setEditingRoute({ route_id: route.route_id, route_name: route.route_name })}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-orange-500 transition-all rounded-lg hover:bg-orange-50"
                                                title="Edit Route"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRoute(route)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                                                title="Delete Route"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => fetchBreakdown(route)}
                                        className="p-2 bg-white text-orange-600 rounded-xl shadow-sm border border-orange-100 hover:bg-orange-600 hover:text-white transition-all flex items-center gap-1.5"
                                        title="Student Breakdown"
                                    >
                                        <Users size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Stats</span>
                                    </button>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 flex-shrink-0">
                                        {route.stops?.length || 0} Stops
                                    </span>
                                </div>
                            </div>

                            <div className="p-2">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-400 text-left">
                                            <th className="font-black text-[10px] uppercase tracking-widest px-4 py-3">Stop Name</th>
                                            <th className="font-black text-[10px] uppercase tracking-widest px-4 py-3 text-right">Fee (₹)</th>
                                            <th className="font-black text-[10px] uppercase tracking-widest px-2 py-3 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {route.stops?.map(stop => (
                                            <tr key={stop.id} className="hover:bg-slate-50 transition-colors group/row">
                                                {editingStop?.stop_id === stop.id ? (
                                                    <>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                autoFocus
                                                                className="w-full bg-white border border-orange-300 rounded-lg px-3 py-1.5 text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-orange-300"
                                                                value={editingStop.name}
                                                                onChange={e => setEditingStop({ ...editingStop, name: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-right">
                                                            <input
                                                                type="number"
                                                                className="w-24 bg-white border border-orange-300 rounded-lg px-3 py-1.5 text-sm font-bold text-navy text-right focus:outline-none focus:ring-2 focus:ring-orange-300"
                                                                value={editingStop.fee}
                                                                onChange={e => setEditingStop({ ...editingStop, fee: e.target.value })}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={handleSaveStop} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"><Check size={12} /></button>
                                                                <button onClick={() => setEditingStop(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><X size={12} /></button>
                                                            </div>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 font-semibold text-slate-700 break-words whitespace-normal max-w-[200px]">
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                                                                <span className="flex-1 leading-tight line-clamp-2">{stop.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-navy italic">
                                                            {stop.fee === 0 ? 'Free' : `₹${stop.fee?.toLocaleString()}`}
                                                        </td>
                                                        <td className="px-2 py-3">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => setEditingStop({ stop_id: stop.id, name: stop.name, fee: stop.fee })}
                                                                    className="opacity-0 group-hover/row:opacity-100 p-1.5 text-slate-400 hover:text-orange-500 rounded-lg hover:bg-orange-50 transition-all"
                                                                    title="Edit Stop"
                                                                >
                                                                    <Pencil size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteStop(stop, route.route_name)}
                                                                    className="opacity-0 group-hover/row:opacity-100 p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                                                    title="Delete Stop"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                        {(!route.stops || route.stops.length === 0) && (
                                            <tr>
                                                <td colSpan="2" className="px-4 py-10 text-center italic text-slate-400">
                                                    No stops added to this route yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                    {filteredRoutes.length === 0 && (
                        <div className="lg:col-span-2 py-20 text-center card bg-slate-50 border-dashed border-2 border-slate-200">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Search size={40} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 italic">No matching results found</h4>
                            <p className="text-slate-500 text-sm">Try adjusting your search filters or add a new route.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Breakdown View */
                <div className="animate-in fade-in slide-in-from-bottom-10 duration-500">
                    <div className="card bg-white p-0 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col min-h-[50vh]">
                        <div className="flex-1 overflow-x-auto p-4 md:p-8">
                            {breakdownLoading ? (
                                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-navy"></div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Assembling Telemetry Data...</p>
                                </div>
                            ) : breakdownData.length === 0 ? (
                                <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-dashed border-2 border-slate-200">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <Users size={48} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-black italic text-xl">No occupancy data mapping found.</p>
                                    <p className="text-slate-400 text-sm mt-2">Associate students with stops to populate this registry.</p>
                                </div>
                            ) : (
                                    <div className="table-container rounded-3xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                                        <table className="admin-table w-full border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100">
                                                    <th className="py-4 pl-8 text-left uppercase tracking-[0.2em] text-[9px] font-black text-slate-500 border-r border-slate-100">Transit Station</th>
                                                    <th className="py-4 text-center uppercase tracking-[0.2em] text-[9px] font-black text-slate-400 w-20">1st Yr</th>
                                                    <th className="py-4 text-center uppercase tracking-[0.2em] text-[9px] font-black text-slate-400 w-20">2nd Yr</th>
                                                    <th className="py-4 text-center uppercase tracking-[0.2em] text-[9px] font-black text-slate-400 w-20">3rd Yr</th>
                                                    <th className="py-4 text-center uppercase tracking-[0.2em] text-[9px] font-black text-slate-400 w-20">4th Yr</th>
                                                    <th className="py-4 text-center uppercase tracking-[0.2em] text-[9px] font-black text-navy bg-orange-50/50 pr-8 w-24 border-l border-slate-100">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {breakdownData.map((data, idx) => (
                                                    <tr key={data.stop_id} className="hover:bg-slate-50 transition-all duration-300 group">
                                                        <td className="py-4 pl-8 border-r border-slate-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-navy font-black text-[10px] shadow-sm group-hover:rotate-6 transition-transform">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="font-black text-navy text-sm">{data.stop_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-center font-bold text-slate-600 font-mono text-sm w-20">{data.year1 || 0}</td>
                                                        <td className="py-4 text-center font-bold text-slate-600 font-mono text-sm w-20">{data.year2 || 0}</td>
                                                        <td className="py-4 text-center font-bold text-slate-600 font-mono text-sm w-20">{data.year3 || 0}</td>
                                                        <td className="py-4 text-center font-bold text-slate-600 font-mono text-sm w-20">{data.year4 || 0}</td>
                                                        <td className="py-4 text-center font-black text-orange-600 bg-orange-50/20 pr-8 italic text-lg w-24 border-l border-slate-100">
                                                            {data.total || 0}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-navy text-white text-xs">
                                                <tr className="border-t border-navy-light/10">
                                                    <td className="py-6 pl-8 font-black uppercase tracking-[0.2em] text-[9px] italic border-r border-white/5">Aggregate Metrics</td>
                                                    <td className="py-6 text-center font-black font-mono w-20 bg-white/5">{breakdownData.reduce((acc, d) => acc + parseInt(d.year1 || 0), 0)}</td>
                                                    <td className="py-6 text-center font-black font-mono w-20 bg-white/5">{breakdownData.reduce((acc, d) => acc + parseInt(d.year2 || 0), 0)}</td>
                                                    <td className="py-6 text-center font-black font-mono w-20 bg-white/5">{breakdownData.reduce((acc, d) => acc + parseInt(d.year3 || 0), 0)}</td>
                                                    <td className="py-6 text-center font-black font-mono w-20 bg-white/5">{breakdownData.reduce((acc, d) => acc + parseInt(d.year4 || 0), 0)}</td>
                                                    <td className="py-6 text-center font-black text-white pr-8 text-xl italic tracking-tighter w-24 bg-orange-600 shadow-inner">
                                                        {breakdownData.reduce((acc, d) => acc + parseInt(d.total || 0), 0)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {activeModal === 'route' && (
                <div className="fixed inset-0 bg-navy/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 scale-in-center">
                        <div className="p-8 bg-navy text-white relative">
                            <button onClick={() => { setActiveModal(null); setRouteError(''); }} className="absolute top-6 right-6 text-navy-light hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            <div className="p-4 bg-navy-light rounded-2xl w-fit mb-4">
                                <RouteIcon size={32} />
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tight">Create New Route</h2>
                        </div>
                        <form onSubmit={handleAddRoute} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Route Identifier / Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="e.g. MUTTUKURU VIA KOTA"
                                    value={newRouteName}
                                    onChange={(e) => setNewRouteName(e.target.value)}
                                    className={`w-full bg-slate-50 border ${routeError ? 'border-red-500' : 'border-slate-100'} rounded-2xl px-5 py-4 font-bold text-navy focus:outline-none focus:border-navy transition-all`}
                                />
                                {routeError && (
                                    <p className="text-red-600 text-[11px] font-black uppercase tracking-widest ml-1 mt-2 animate-in slide-in-from-top-2 flex items-center gap-1.5">
                                        <X size={14} className="bg-red-100 p-0.5 rounded-full" />
                                        {routeError.toUpperCase()}
                                    </p>
                                )}
                            </div>
                            <button type="submit" className="w-full btn bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-100 flex items-center justify-center gap-3">
                                <Check size={20} /> Save Route
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {activeModal === 'stop' && (
                <div className="fixed inset-0 bg-navy/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 scale-in-center">
                        <div className="p-8 bg-orange-600 text-white relative">
                            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-orange-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            <div className="p-4 bg-orange-500 rounded-2xl w-fit mb-4">
                                <MapPin size={32} />
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tight">Add Stopping Point</h2>
                        </div>
                        <form onSubmit={handleAddStop} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Route</label>
                                <select
                                    required
                                    value={newStop.routeId}
                                    onChange={(e) => setNewStop({ ...newStop, routeId: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-navy focus:outline-none focus:border-orange-500 transition-all appearance-none"
                                >
                                    <option value="">Select a Route...</option>
                                    {routes.map(r => (
                                        <option key={r.route_id} value={r.route_id}>{r.route_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Stop Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Community Center"
                                    value={newStop.name}
                                    required
                                    onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-navy focus:outline-none focus:border-orange-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Transport Fee (₹)</label>
                                <div className="relative">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">₹</div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={newStop.fee}
                                        required
                                        onChange={(e) => setNewStop({ ...newStop, fee: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-5 py-4 font-black text-navy focus:outline-none focus:border-orange-500 transition-all"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full btn bg-navy hover:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-navy/20 flex items-center justify-center gap-3">
                                <Check size={20} /> Register Stop
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
