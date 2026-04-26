import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, FileText, AlertCircle, X, Download, FileCheck2, FileWarning, Trash2 } from 'lucide-react';
import api from '../../../utils/api';

export default function BusDocuments() {
    const { id } = useParams(); // bus_id
    const navigate = useNavigate();
    
    // State
    const [bus, setBus] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [formData, setFormData] = useState({
        document_type_id: '',
        provider: '',
        start_date: '',
        expiry_date: '',
        file: null
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [busRes, docsRes, typesRes] = await Promise.all([
                api.get(`/api/buses/${id}`),
                api.get(`/api/buses/${id}/documents`),
                api.get(`/api/documents/types`)
            ]);
            
            if (busRes.data?.status) setBus(busRes.data.data);
            if (docsRes.data?.status) setDocuments(docsRes.data.data);
            if (typesRes.data?.status) setDocumentTypes(typesRes.data.data);
        } catch (err) {
            console.error("Error fetching document data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type !== 'application/pdf') {
            setUploadError('Only PDF files are allowed.');
            setFormData(prev => ({ ...prev, file: null }));
            // Reset file input
            e.target.value = '';
            return;
        }
        setUploadError('');
        setFormData(prev => ({ ...prev, file }));
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.document_type_id || !formData.start_date || !formData.expiry_date || !formData.file) {
            setUploadError("All fields including the PDF file are required.");
            return;
        }

        if (new Date(formData.expiry_date) <= new Date(formData.start_date)) {
            setUploadError("Expiry date must be after the start date.");
            return;
        }

        setUploading(true);
        setUploadError('');

        try {
            const payload = new FormData();
            payload.append('bus_id', id);
            payload.append('document_type_id', formData.document_type_id);
            payload.append('provider', formData.provider);
            payload.append('start_date', formData.start_date);
            payload.append('expiry_date', formData.expiry_date);
            payload.append('document', formData.file);

            const result = await api.post('/api/documents/upload', payload);
            
            if (result.data?.status) {
                // Success
                setIsUploadModalOpen(false);
                setFormData({ document_type_id: '', provider: '', start_date: '', expiry_date: '', file: null });
                fetchData(); // Refresh list
            } else {
                setUploadError(result.data?.message || "Failed to upload document");
            }
        } catch (err) {
            console.error("Upload error:", err);
            setUploadError("Network error parsing request.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (documentId, documentName) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${documentName}"? This cannot be undone.`)) return;

        try {
            const result = await api.delete(`/api/documents/${documentId}`);
            if (result.data?.status) {
                fetchData(); // Refresh list
            } else {
                alert(result.data?.message || 'Failed to delete document.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('An error occurred while deleting the document.');
        }
    };

    // Calculate document status
    const getStatus = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) {
            return { label: 'Expired', class: 'bg-red-50 text-red-700 border-red-200', icon: FileWarning };
        } else if (daysRemaining <= 30) {
            return { label: `Expiring in ${daysRemaining} days`, class: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle };
        } else {
            return { label: 'Valid', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileCheck2 };
        }
    };

    if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 relative">
            {/* Header */}
            <button 
                onClick={() => navigate(`/buses/${bus?.rc_plate_number || id}`)}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy transition-colors"
            >
                <ChevronLeft size={16} /> Back to {bus?.rc_plate_number || 'Vehicle'}
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-navy flex items-center gap-3">
                    <FileText className="text-navy-light" /> 
                    Compliance & Documentation
                </h1>
                <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="btn btn-primary bg-navy hover:bg-navy-light border-navy shadow-lg shadow-navy/20"
                >
                    <Plus size={18} /> Upload New Document
                </button>
            </div>

            {/* Document List Table */}
            <div className="table-container shadow-xl border border-slate-100 rounded-2xl overflow-hidden bg-white">
                <table className="admin-table w-full">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500">
                            <th className="py-5 pl-8 text-left uppercase tracking-widest text-[10px] font-black">Document Type</th>
                            <th className="py-5 px-4 text-left uppercase tracking-widest text-[10px] font-black">Provider Name</th>
                            <th className="py-5 px-4 text-center uppercase tracking-widest text-[10px] font-black">Effective Date</th>
                            <th className="py-5 px-4 text-center uppercase tracking-widest text-[10px] font-black">Expiry Date</th>
                            <th className="py-5 px-4 text-center uppercase tracking-widest text-[10px] font-black">Compliance Status</th>
                            <th className="py-5 pr-8 text-right uppercase tracking-widest text-[10px] font-black">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-20">
                                    <div className="flex flex-col items-center gap-4 text-slate-400">
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-300">
                                            <FileText size={32} />
                                        </div>
                                        <div>
                                            <p className="font-black text-navy uppercase tracking-widest text-xs">No Digital Archives</p>
                                            <p className="text-sm mt-1 italic opacity-60">Upload documents to digitize compliance records.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc, idx) => {
                                const status = getStatus(doc.expiry_date);
                                const StatusIcon = status.icon;
                                const startDate = new Date(doc.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                const expiryDate = new Date(doc.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                return (
                                    <tr key={doc.bus_document_id || idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 pl-8 font-black text-navy uppercase tracking-tight text-sm">
                                            {doc.document_name}
                                        </td>
                                        <td className="py-5 px-4 font-bold text-slate-600 text-sm">
                                            {doc.provider || <span className="text-slate-300 italic">Not Specified</span>}
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            <span className="text-sm font-medium text-slate-500">{startDate}</span>
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            <span className="text-sm font-bold text-navy">{expiryDate}</span>
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border ${status.class}`}>
                                                <StatusIcon size={12} /> {status.label.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-5 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`${api.defaults.baseURL}${doc.file_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white hover:bg-navy-light rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-navy/10"
                                                >
                                                    <Download size={14} /> View PDF
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteDocument(doc.bus_document_id, doc.document_name)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-100 hover:border-red-500"
                                                    title="Delete document"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Upload Modal Overlay */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden scale-in-center border-2 border-white/20">
                        {/* Modal Header */}
                        <div className="bg-navy p-6 flex items-center justify-between text-white shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    <FileText size={24} className="text-blue-100" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic">Upload Document</h2>
                                    <p className="text-xs text-blue-200/70 font-medium">Digital Vault • PDF Only</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsUploadModalOpen(false);
                                    setUploadError('');
                                    setFormData({ document_type_id: '', provider: '', start_date: '', expiry_date: '', file: null });
                                }}
                                className="text-blue-200 hover:text-white transition-colors p-2 bg-white/5 rounded-xl hover:bg-white/20 relative z-10"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Form */}
                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {uploadError && (
                                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <AlertCircle size={18} className="shrink-0" />
                                    {uploadError}
                                </div>
                            )}

                            <form onSubmit={handleUploadSubmit} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Document Category</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-navy focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all appearance-none"
                                        value={formData.document_type_id}
                                        onChange={(e) => setFormData({...formData, document_type_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Document Type</option>
                                        {documentTypes.map(dt => (
                                            <option key={dt.document_type_id} value={dt.document_type_id}>
                                                {dt.document_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Issuing Provider / Agency Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Tata AIG, HDFC Ergo, RTO..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-navy focus:outline-none focus:border-navy transition-all"
                                        value={formData.provider}
                                        onChange={(e) => setFormData({...formData, provider: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Effective Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 font-bold text-navy focus:outline-none focus:border-navy transition-all"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Expiry Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 font-bold text-navy focus:outline-none focus:border-navy transition-all"
                                            value={formData.expiry_date}
                                            onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Scanned Copy (PDF)</label>
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            accept=".pdf,application/pdf"
                                            className="w-full cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-2xl px-4 py-6 font-bold text-slate-600 focus:outline-none focus:border-navy transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-black file:uppercase file:tracking-widest file:bg-navy/5 file:text-navy hover:file:bg-navy/10"
                                            onChange={handleFileChange}
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium ml-1 flex items-center gap-1">
                                        <FileText size={12}/> Only PDF files are supported. Max 10MB.
                                    </p>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={uploading}
                                    className="w-full btn bg-navy hover:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-navy/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Uploading...</>
                                    ) : (
                                        <>Secure & Save Document</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
