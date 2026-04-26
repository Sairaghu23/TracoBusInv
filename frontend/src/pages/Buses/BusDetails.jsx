import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Droplet, Settings, FileSearch, Navigation, Gauge, Bus as BusIconBase } from 'lucide-react';
import api from '../../utils/api';

export default function BusDetails() {
    const { id: rc_plate_number } = useParams();
    const navigate = useNavigate();
    const [bus, setBus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBusDetails = async () => {
            try {
                const result = await api.get(`/api/buses/${encodeURIComponent(rc_plate_number)}`);
                if (result.data?.status) {
                    setBus(result.data.data);
                } else {
                    setError(result.data?.message || "Vehicle record not found.");
                }
            } catch (err) {
                console.error("Error fetching bus details:", err);
                setError("Failed to connect to the server.");
            } finally {
                setLoading(false);
            }
        };

        fetchBusDetails();
    }, [rc_plate_number]);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
        </div>
    );

    if (error || !bus) return (
        <div className="p-8 text-center space-y-4">
            <p className="text-slate-500">{error || "Vehicle record not found."}</p>
            <button onClick={() => navigate('/buses')} className="btn btn-outline btn-sm">
                <ChevronLeft size={16} /> Back to Directory
            </button>
        </div>
    );

    const modules = [
        { name: 'Oils Tracking', icon: Droplet, path: 'oils', desc: 'Engine oil, transmission fluid, and lubricants.', color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: 'Spare Parts', icon: Settings, path: 'spares', desc: 'Hardware replacements and maintenance logs.', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { name: 'Diesel Logs', icon: Droplet, path: 'diesel', desc: 'Fuel consumption and cost efficiency.', color: 'text-amber-500', bg: 'bg-amber-50' },
        { name: 'Odometer Readings', icon: Gauge, path: 'readings', desc: 'Distance tracking and trip logs.', color: 'text-purple-500', bg: 'bg-purple-50' },
        { name: 'Vault Documents', icon: FileSearch, path: 'documents', desc: 'Permits, Insurance, certificates and RC.', color: 'text-rose-500', bg: 'bg-rose-50' }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
                onClick={() => navigate('/buses')}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy transition-colors"
            >
                <ChevronLeft size={16} /> Back to Directory
            </button>

            {/* Profile Header */}
            <div className="bg-navy rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
                    <BusIconBase size={240} />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`py-1 px-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border
                            ${(bus.status === 'ACTIVE') ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 
                              (bus.status === 'REPAIR') ? 'bg-amber-500/20 text-amber-200 border-amber-500/30' : 
                              'bg-slate-500/20 text-slate-200 border-slate-500/30'}
                        `}>
                            {bus.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                    </div>
                    
                    <div className="flex flex-col gap-1 mb-4">
                        <p className="text-navy-light text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Vehicle Display Number</p>
                        <h2 className="text-3xl font-black italic">{bus.bus_no || 'N/A'}</h2>
                    </div>
                    
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">{bus.rc_plate_number}</h1>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2">Assigned Route</p>
                            <p className="font-semibold text-lg flex items-center gap-2">
                                <Navigation size={20} className="text-blue-400"/> 
                                {bus.route_name || 'Not Assigned'}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-2">Seating Capacity</p>
                            <p className="font-semibold text-lg">{bus.seating_capacity || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-2">Engine Number</p>
                            <p className="font-semibold text-lg font-mono italic">{bus.engine_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2">Purchase Date</p>
                            <p className="font-semibold text-lg">
                                {bus.purchase_date ? new Date(bus.purchase_date).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mt-10 mb-6">Vehicle Operations Hub</h2>
            
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod, idx) => (
                    <div 
                        key={idx}
                        onClick={() => navigate(`/buses/${encodeURIComponent(rc_plate_number)}/${mod.path}`)}
                        className="group bg-white rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col items-center text-center"
                    >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${mod.bg} ${mod.color}`}>
                            <mod.icon size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-navy mb-2">{mod.name}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{mod.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
