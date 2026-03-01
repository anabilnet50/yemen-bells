import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Plus, AlertTriangle, RefreshCcw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IPManagement = () => {
    const [blockedIps, setBlockedIps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newIp, setNewIp] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBlockedIps = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/blocked-ips', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBlockedIps(data);
            }
        } catch (err) {
            console.error('Error fetching blocked IPs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBlockedIps();
    }, []);

    const handleBanIp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newIp) return;
        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/admin/blocked-ips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({ ip_address: newIp, reason })
            });

            if (res.ok) {
                setNewIp('');
                setReason('');
                fetchBlockedIps();
            } else {
                const data = await res.json();
                setError(data.error || 'فشل في حظر العنوان');
            }
        } catch (err) {
            setError('حدث خطأ أثناء الاتصال بالسيرفر');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnban = async (id: number) => {
        if (!confirm('هل أنت متأكد من إلغاء الحظر عن هذا العنوان؟')) return;

        try {
            const res = await fetch(`/api/admin/blocked-ips/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
            });
            if (res.ok) {
                fetchBlockedIps();
            }
        } catch (err) {
            console.error('Error unbanning IP:', err);
        }
    };

    const filteredIps = blockedIps.filter(item =>
        item.ip_address.includes(searchTerm) || (item.reason && item.reason.includes(searchTerm))
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary-crimson shadow-inner">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-primary-navy">إدارة الحظر والأمان</h2>
                        <p className="text-sm text-gray-400 font-bold">حماية الموقع من الهجمات والمتسللين</p>
                    </div>
                </div>
                <button
                    onClick={fetchBlockedIps}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black hover:bg-gray-100 transition-all border border-gray-100"
                >
                    <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>تحديث القائمة</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Ban Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 sticky top-8">
                        <div className="flex items-center gap-3 mb-8">
                            <Plus className="w-6 h-6 text-primary-crimson" />
                            <h3 className="text-lg font-black text-primary-navy">إضافة حظر يدوي</h3>
                        </div>

                        <form onSubmit={handleBanIp} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">عنوان IP</label>
                                <input
                                    type="text"
                                    value={newIp}
                                    onChange={(e) => setNewIp(e.target.value)}
                                    placeholder="مثال: 192.168.1.1"
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-crimson/20 focus:bg-white rounded-2xl font-bold transition-all outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 mr-1">سبب الحظر (اختياري)</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="اكتب سبب الحظر هنا..."
                                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-crimson/20 focus:bg-white rounded-2xl font-bold transition-all outline-none h-32 resize-none"
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-50 text-primary-crimson rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3"
                                >
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || !newIp}
                                className="w-full py-5 bg-primary-navy text-white rounded-2xl font-black shadow-lg shadow-primary-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                <span>حظر العنوان الآن</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Blocked List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden min-h-[500px] flex flex-col">
                        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-black text-primary-navy">العناوين المحظورة حالياً</h3>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="بحث عن IP..."
                                    className="w-full pr-11 pl-4 py-3 bg-gray-50 rounded-xl text-sm font-bold border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-crimson/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            {isLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4">
                                    <RefreshCcw className="w-10 h-10 text-gray-200 animate-spin" />
                                    <p className="text-gray-400 font-bold">جاري تحميل القائمة...</p>
                                </div>
                            ) : filteredIps.length > 0 ? (
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">عنوان IP</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">السبب</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">تاريخ الحظر</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 w-24">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence mode="popLayout">
                                            {filteredIps.map((ip) => (
                                                <motion.tr
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    key={ip.id}
                                                    className="group hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <td className="px-8 py-6 border-b border-gray-50 text-sm font-black text-primary-navy group-hover:text-primary-crimson transition-colors">
                                                        {ip.ip_address}
                                                        {ip.ip_address === '::1' || ip.ip_address === '127.0.0.1' ? (
                                                            <span className="mr-2 inline-block px-2 py-0.5 bg-blue-50 text-blue-500 rounded-md text-[9px] font-black uppercase">Local</span>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-8 py-6 border-b border-gray-50 text-xs font-bold text-gray-500 italic max-w-xs truncate">
                                                        {ip.reason || 'بدون سبب'}
                                                    </td>
                                                    <td className="px-8 py-6 border-b border-gray-50 text-[11px] font-bold text-gray-400">
                                                        {new Date(ip.created_at).toLocaleDateString('ar-EG', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="px-8 py-6 border-b border-gray-50 text-center">
                                                        <button
                                                            onClick={() => handleUnban(ip.id)}
                                                            className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-100 text-gray-400 rounded-xl hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all shadow-sm group-hover:scale-110"
                                                            title="إلغاء الحظر"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center p-8 bg-gray-50/30 rounded-3xl m-8 border-2 border-dashed border-gray-100">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-200 shadow-sm mb-4">
                                        <Shield className="w-8 h-8" />
                                    </div>
                                    <p className="text-gray-400 font-bold text-center">لا يوجد عناوين محظورة حالياً</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IPManagement;
