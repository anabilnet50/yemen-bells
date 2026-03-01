import React from 'react';
import { FileText, RotateCcw, Filter, Search } from 'lucide-react';

interface AuditLogProps {
    history: any[];
    users: any[];
    historyFilterUser: string;
    setHistoryFilterUser: (user: string) => void;
    historyStartDate: string;
    setHistoryStartDate: (date: string) => void;
    historyEndDate: string;
    setHistoryEndDate: (date: string) => void;
    fetchHistory: () => void;
}

const AuditLog: React.FC<AuditLogProps> = ({
    history,
    users,
    historyFilterUser,
    setHistoryFilterUser,
    historyStartDate,
    setHistoryStartDate,
    historyEndDate,
    setHistoryEndDate,
    fetchHistory
}) => {
    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">سجل الأنشطة الرقابي</h1>
                    <p className="text-gray-500 font-bold">تتبع كافة الإجراءات والعمليات التي تمت على لوحة التحكم</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.print()}
                        className="p-3 bg-white border-2 border-gray-100 text-primary-navy hover:bg-gray-50 rounded-2xl flex items-center gap-3 font-black transition-all shadow-sm"
                    >
                        <FileText className="w-5 h-5" /> طباعة التقرير
                    </button>
                    <button
                        onClick={fetchHistory}
                        className="p-3 bg-red-50 text-primary-crimson hover:bg-red-600 hover:text-white rounded-2xl flex items-center gap-3 font-black transition-all shadow-sm"
                    >
                        <RotateCcw className="w-5 h-5" /> تحديث السجل
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 print:hidden animate-in fade-in duration-500">
                <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                        <Filter className="w-5 h-5 text-primary-crimson" />
                    </div>
                    فلترة التقرير الذكية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mr-1">المسؤول</label>
                        <select
                            value={historyFilterUser}
                            onChange={e => setHistoryFilterUser(e.target.value)}
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black outline-none focus:border-red-500 focus:bg-white transition-all appearance-none bg-[url('https://www.svgrepo.com/show/511136/arrow-down-1.svg')] bg-[length:20px] bg-[right_16px_center] bg-no-repeat"
                        >
                            <option value="">جميع المستخدمين</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mr-1">من تاريخ</label>
                        <input
                            type="date"
                            value={historyStartDate}
                            onChange={e => setHistoryStartDate(e.target.value)}
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black outline-none focus:border-red-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mr-1">إلى تاريخ</label>
                        <input
                            type="date"
                            value={historyEndDate}
                            onChange={e => setHistoryEndDate(e.target.value)}
                            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black outline-none focus:border-red-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div>
                        <button
                            onClick={fetchHistory}
                            className="w-full p-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-primary-navy transition-all flex justify-center items-center gap-3 shadow-xl"
                        >
                            <Search className="w-5 h-5" /> تطبيق التصفية
                        </button>
                    </div>
                </div>
            </div>

            <div className="hidden print:block text-center mb-12 pb-8 border-b-2 border-gray-200">
                <h1 className="text-4xl font-black text-gray-900 mb-6">تقرير سجل الأنشطة الرقابي - أجراس اليمن</h1>
                <div className="flex justify-center gap-12 text-lg font-bold text-gray-600">
                    <span>تاريخ التقرير: {new Date().toLocaleDateString('ar-YE')}</span>
                    {historyFilterUser && <span>المسؤول المستهدف: {users.find(u => u.id === Number(historyFilterUser))?.full_name}</span>}
                    {(historyStartDate || historyEndDate) && (
                        <span>الفترة: {historyStartDate || '...'} إلى {historyEndDate || '...'}</span>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-premium overflow-hidden border border-gray-100 print:shadow-none print:border-none print:rounded-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse border border-[#cfdce9] min-w-[1000px]">
                        <thead className="bg-[#5b9bd5] text-white print:bg-gray-100 print:text-black">
                            <tr className="divide-x divide-x-reverse divide-[#ffffff]">
                                <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap print:py-4">المسؤول</th>
                                <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap print:py-4">الإجراء المتخذ</th>
                                <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap print:py-4">تفاصيل العملية</th>
                                <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap print:py-4">التوقيت الزمني</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#cfdce9] print:divide-gray-300">
                            {history.map((log: any) => (
                                <tr key={log.id} className="even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50 transition-colors divide-x divide-x-reverse divide-[#cfdce9] text-center border-b border-[#cfdce9]">
                                    <td className="p-6 font-black text-primary-navy print:py-4 align-middle">{log.user_name || 'نظام آلي'}</td>
                                    <td className="p-6 print:py-4 align-middle">
                                        <span className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase shadow-sm border ${log.action.includes('حذف') ? 'bg-red-50 text-red-600 border-red-100' :
                                                log.action.includes('إضافة') ? 'bg-green-50 text-green-600 border-green-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-6 text-[15px] text-gray-700 font-bold print:py-4 print:text-gray-900 align-middle leading-relaxed max-w-sm text-right px-10">
                                        {log.details}
                                    </td>
                                    <td className="p-6 text-base text-gray-900 font-bold print:py-4 print:text-gray-900 align-middle" dir="rtl">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm">{new Date(log.created_at).toLocaleDateString('ar-YE')}</span>
                                            <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr><td colSpan={4} className="p-24 text-center text-gray-400 font-black text-xl">لا توجد سجلات تطابق معايير البحث الحالية</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLog;
