import React from 'react';
import { Plus, Edit2, Trash2, Users, Shield } from 'lucide-react';

interface UserManagementProps {
    users: any[];
    isEditingUser: boolean;
    setIsEditingUser: (editing: boolean) => void;
    currentUserData: any;
    setCurrentUserData: (user: any) => void;
    handleUserSubmit: (e: React.FormEvent) => void;
    handleUserDelete: (id: number) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
    users,
    isEditingUser,
    setIsEditingUser,
    currentUserData,
    setCurrentUserData,
    handleUserSubmit,
    handleUserDelete
}) => {
    const availablePermissions = [
        { id: 'news', label: 'إدارة الأخبار' },
        { id: 'categories', label: 'إدارة الأقسام' },
        { id: 'writers', label: 'إدارة الكتاب' },
        { id: 'comments', label: 'إدارة التعليقات' },
        { id: 'ads', label: 'إدارة الإعلانات' },
        { id: 'trash', label: 'سلة المحذوفات' },
    ];

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">إدارة المستخدمين</h1>
                    <p className="text-gray-500 font-bold">إدارة صلاحيات الوصول والتحكم في فريق العمل</p>
                </div>
                <button
                    onClick={() => { setIsEditingUser(true); setCurrentUserData({ username: '', password: '', full_name: '', role: 'editor', permissions: [] }); }}
                    className="bg-primary-navy text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-primary-navy/20 hover:bg-black transition-all"
                >
                    <Plus className="w-6 h-6" /> إضافة مسؤول جديد
                </button>
            </div>

            {isEditingUser ? (
                <div className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-premium border border-gray-100 max-w-3xl animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black">{currentUserData.id ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد للنظام'}</h2>
                    </div>

                    <form onSubmit={handleUserSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 block mr-1">الاسم الكامل</label>
                                <input type="text" value={currentUserData.full_name} onChange={e => setCurrentUserData({ ...currentUserData, full_name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-primary-navy transition-all outline-none font-bold" placeholder="مثلاً: أحمد محمد" required />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 block mr-1">اسم المستخدم (Login)</label>
                                <input type="text" value={currentUserData.username} onChange={e => setCurrentUserData({ ...currentUserData, username: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-primary-navy transition-all outline-none font-bold" placeholder="ahmed_admin" required />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 block mr-1">{currentUserData.id ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور'}</label>
                                <input type="password" value={currentUserData.password} onChange={e => setCurrentUserData({ ...currentUserData, password: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-primary-navy transition-all outline-none font-bold" placeholder="••••••••" required={!currentUserData.id} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 block mr-1">الدور الوظيفي</label>
                                <select value={currentUserData.role} onChange={e => setCurrentUserData({ ...currentUserData, role: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-100 focus:border-primary-navy transition-all outline-none font-bold appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[left_15px_center] bg-no-repeat">
                                    <option value="editor">محرر (Editor)</option>
                                    <option value="admin">مدير نظام (Admin)</option>
                                </select>
                            </div>
                        </div>

                        {currentUserData.role === 'editor' && (
                            <div className="space-y-4 pt-6 border-t border-gray-50">
                                <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-500" /> تحديد الصلاحيات المخصصة للمحرر
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {availablePermissions.map(perm => (
                                        <div key={perm.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:border-blue-200 transition-all cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                id={`perm-${perm.id}`}
                                                checked={currentUserData.permissions?.includes(perm.id)}
                                                onChange={(e) => {
                                                    const perms = currentUserData.permissions || [];
                                                    if (e.target.checked) setCurrentUserData({ ...currentUserData, permissions: [...perms, perm.id] });
                                                    else setCurrentUserData({ ...currentUserData, permissions: perms.filter((p: string) => p !== perm.id) });
                                                }}
                                                className="w-5 h-5 accent-primary-navy cursor-pointer"
                                            />
                                            <label htmlFor={`perm-${perm.id}`} className="font-bold text-sm cursor-pointer text-gray-600 group-hover:text-primary-navy transition-colors">{perm.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-8">
                            <button type="submit" className="bg-primary-navy text-white px-6 py-3 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black shadow-xl shadow-primary-navy/20 hover:bg-black transition-all text-sm md:text-base">حفظ البيانات</button>
                            <button type="button" onClick={() => setIsEditingUser(false)} className="bg-gray-100 text-gray-600 px-6 py-3 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black hover:bg-gray-200 transition-all text-sm md:text-base">إلغاء</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 w-full overflow-hidden">
                    <div className="overflow-x-auto w-full print:overflow-visible">
                        <table className="w-full text-center border-collapse border border-[#cfdce9] table-auto">
                            <thead className="bg-[#5b9bd5] text-white">
                                <tr className="divide-x divide-x-reverse divide-[#ffffff]">
                                    <th className="p-3 sm:p-6 text-[10px] sm:text-sm font-black uppercase text-center whitespace-nowrap">الاسم</th>
                                    <th className="p-3 sm:p-6 text-[10px] sm:text-sm font-black uppercase text-center whitespace-nowrap hidden sm:table-cell">الحساب</th>
                                    <th className="p-3 sm:p-6 text-[10px] sm:text-sm font-black uppercase text-center whitespace-nowrap">الدور</th>
                                    <th className="p-3 sm:p-6 text-[10px] sm:text-sm font-black uppercase text-center whitespace-nowrap hidden md:table-cell">الصلاحيات</th>
                                    <th className="p-3 sm:p-6 text-[10px] sm:text-sm font-black uppercase text-center whitespace-nowrap">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#cfdce9]">
                                {users.map(user => (
                                    <tr key={user.id} className="even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50 transition-colors divide-x divide-x-reverse divide-[#cfdce9] text-center border-b border-[#cfdce9]">
                                        <td className="p-3 sm:p-6 font-black text-primary-navy align-middle text-[11px] sm:text-base">
                                            {user.full_name}
                                            <div className="sm:hidden text-[9px] font-mono text-gray-400 mt-1">@{user.username}</div>
                                        </td>
                                        <td className="p-6 font-mono text-sm text-gray-500 align-middle hidden sm:table-cell">@{user.username}</td>
                                        <td className="p-3 sm:p-6 align-middle">
                                            <span className={`px-2 sm:px-4 py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase border ${user.role === 'admin' ? 'bg-red-50 text-primary-crimson border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {user.role === 'admin' ? 'مدير' : 'محرر'}
                                            </span>
                                        </td>
                                        <td className="p-6 align-middle hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                                                {user.role === 'admin' ? (
                                                    <span className="text-[9px] font-black text-gray-400">وصول كامل</span>
                                                ) : (
                                                    (Array.isArray(user.permissions) ? user.permissions : []).map((p: string) => (
                                                        <span key={p} className="bg-gray-100 text-[10px] font-bold text-gray-500 px-2 py-0.5 rounded-md border border-gray-200">{availablePermissions.find(ap => ap.id === p)?.label || p}</span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 sm:p-6 align-middle">
                                            <div className="flex justify-center gap-1 sm:gap-3">
                                                <button onClick={() => { setCurrentUserData({ ...user, password: '', permissions: Array.isArray(user.permissions) ? user.permissions : [] }); setIsEditingUser(true); }} className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg sm:rounded-xl transition-all flex items-center justify-center group"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleUserDelete(user.id)} className="w-8 h-8 sm:w-10 sm:h-10 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg sm:rounded-xl transition-all flex items-center justify-center group"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
