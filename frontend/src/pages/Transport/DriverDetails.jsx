import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    User, Phone, ShieldCheck, MapPin, Calendar, 
    Edit2, Trash2, ChevronLeft, Check, X, Camera, FileText
} from 'lucide-react';
<<<<<<< HEAD
import api from '../../utils/api';
=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

export default function DriverDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: '', phone: '', license_number: '', status: 'ACTIVE', address: '', joining_date: ''
    });

    useEffect(() => {
        fetchDriverDetails();
    }, [id]);

    const fetchDriverDetails = async () => {
        try {
<<<<<<< HEAD
            const result = await api.get(`/api/drivers/${id}`);
            if (result.data?.status) {
                setDriver(result.data.data);
                const formattedData = {
                    ...result.data.data,
                    joining_date: result.data.data.joining_date ? new Date(result.data.data.joining_date).toISOString().split('T')[0] : ''
=======
            const response = await fetch(`http://localhost:5001/api/drivers/${id}`);
            const result = await response.json();
            if (result.status) {
                setDriver(result.data);
                const formattedData = {
                    ...result.data,
                    joining_date: result.data.joining_date ? new Date(result.data.joining_date).toISOString().split('T')[0] : ''
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                };
                setEditData(formattedData);
            }
        } catch (error) {
            console.error("Error fetching driver details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
<<<<<<< HEAD
            const result = await api.put(`/api/drivers/${id}`, editData);
            if (result.data?.status) {
                setDriver(result.data.data);
=======
            const response = await fetch(`http://localhost:5001/api/drivers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            const result = await response.json();
            if (result.status) {
                setDriver(result.data);
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Error updating driver:", error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to retire this driver from the fleet? This action is permanent.")) {
            try {
<<<<<<< HEAD
                const result = await api.delete(`/api/drivers/${id}`);
                if (result.data?.status) navigate('/drivers');
=======
                const response = await fetch(`http://localhost:5001/api/drivers/${id}`, { method: 'DELETE' });
                const result = await response.json();
                if (result.status) navigate('/drivers');
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
            } catch (error) {
                console.error("Error deleting driver:", error);
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-navy font-black italic">Accessing Personnel Files...</div>
        </div>
    );

    if (!driver) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-black text-navy italic">Personnel Data Not Found</h2>
            <button onClick={() => navigate('/drivers')} className="mt-4 text-orange-600 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 mx-auto">
                <ChevronLeft size={16} /> Back to Registry
            </button>
        </div>
    );

<<<<<<< HEAD
    const photoUrl = driver.photo_url || "/uploads/drivers/default_avatar.png";
=======
    const photoUrl = driver.photo_url || "http://localhost:5001/uploads/drivers/default_avatar.png";
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
            {/* Nav Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/drivers')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all text-navy"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-navy italic">Personnel Profile</h2>
                        <p className="text-slate-500 text-sm font-medium">Fleet ID: DRV-00{driver.driver_id}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {!isEditing ? (
                        <>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="btn bg-navy text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg"
                            >
                                <Edit2 size={18} /> Edit Profile
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="btn bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold"
                            >
                                <Trash2 size={18} /> Retire Driver
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={handleUpdate}
                                className="btn bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-emerald-100"
                            >
                                <Check size={18} /> Save Changes
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="btn bg-white border border-slate-200 text-slate-500 px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold"
                            >
                                <X size={18} /> Discard
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Identity Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card bg-navy text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full" />
                        
                        <div className="relative z-10">
                            <div className="relative w-48 h-48 mx-auto mb-8">
                                <div className="absolute inset-0 bg-blue-400/20 rounded-[3rem] blur-2xl" />
                                <div className="relative w-full h-full bg-navy-light border-4 border-white/20 rounded-[3rem] overflow-hidden shadow-inner flex items-center justify-center group">
                                    <img 
                                        src={photoUrl} 
                                        alt={driver.name} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera size={24} className="text-white opacity-80" />
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-3xl font-black italic tracking-tight">{driver.name}</h3>
                            <p className="text-blue-300 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Certified Fleet Pilot</p>
                            
                            <div className="mt-10 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-[2rem] border border-white/10">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Status</p>
                                    <p className="text-xs font-black italic text-emerald-400">{driver.status}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-[2rem] border border-white/10">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Tenure</p>
                                    <p className="text-xs font-black italic">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Information */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="card bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl">
                        <div className="flex items-center gap-3 mb-10 border-b border-slate-50 pb-6">
                            <ShieldCheck className="text-orange-500" size={24} />
                            <h4 className="text-2xl font-black text-navy italic">Primary Credentials</h4>
                        </div>
                        
                        {!isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <DetailItem icon={<Phone size={18} />} label="Contact Number" value={driver.phone} />
                                <DetailItem icon={<FileText size={18} />} label="Commercial License" value={driver.license_number} />
                                <DetailItem icon={<Calendar size={18} />} label="Employment Date" value={new Date(driver.joining_date).toLocaleDateString()} />
                                <DetailItem icon={<MapPin size={18} />} label="Residential Address" value={driver.address || "No address on file."} fullWidth />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Personal Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-navy transition-all font-bold text-navy"
                                        value={editData.name}
                                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-navy transition-all font-bold text-navy"
                                        value={editData.phone}
                                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">License No</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-navy transition-all font-bold text-navy"
                                        value={editData.license_number}
                                        onChange={(e) => setEditData({...editData, license_number: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Status</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-navy transition-all font-bold text-navy"
                                        value={editData.status}
                                        onChange={(e) => setEditData({...editData, status: e.target.value})}
                                    >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                        <option value="ON_LEAVE">ON_LEAVE</option>
                                    </select>
                                </div>
                                <div className="col-span-full space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Details</label>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 outline-none focus:border-navy transition-all font-bold text-navy h-24"
                                        value={editData.address}
                                        onChange={(e) => setEditData({...editData, address: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card bg-orange-600 text-white p-10 rounded-[4rem] shadow-xl relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
                        <h4 className="text-xl font-black italic mb-4">Fleet Compliance Alert</h4>
                        <p className="text-orange-100 text-sm font-medium opacity-90 leading-relaxed">
                            This driver profile is verified and active in the central transport hub. Ensure that the medical certificate and license validity are updated bi-annually.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const DetailItem = ({ icon, label, value, fullWidth = false }) => (
    <div className={`space-y-2 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            <span className="text-orange-500">{icon}</span>
            {label}
        </div>
        <p className="bg-slate-50 text-navy px-6 py-4 rounded-3xl border border-slate-50 font-bold italic shadow-inner">
            {value}
        </p>
    </div>
);
