import React from 'react';
import {
    LayoutDashboard, FileText, Settings, LogOut, Users,
    MessageCircle, ExternalLink, Hash, Image, Play, TrendingUp,
    Trash2, User, Globe, Shield
} from 'lucide-react';

interface SidebarProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    currentUser: any;
    handleLogout: () => void;
    setIsSidebarOpen: (open: boolean) => void;
}

const AdminSidebar: React.FC<SidebarProps> = ({
    activeSection,
    setActiveSection,
    currentUser,
    handleLogout,
    setIsSidebarOpen
}) => {
    const menuItems = [
        { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
        { id: 'news', label: 'الأخبار', icon: FileText, permission: 'news' },
        { id: 'categories', label: 'الأقسام', icon: Hash, permission: 'categories' },
        { id: 'writers', label: 'الكتاب', icon: User, permission: 'writers' },
        { id: 'comments', label: 'التعليقات', icon: MessageCircle, permission: 'comments' },
        { id: 'ads', label: 'الإعلانات', icon: DollarSignShort, icon_fallback: TrendingUp, permission: 'ads' },
        { id: 'trash', label: 'المحذوفات', icon: Trash2, permission: 'trash' },
    ];

    // Manual fallback for icons not in the common set if needed, or just use what works.
    // Using DollarSign locally since it wasn't in the provided list if I recall, but let's stick to the sidebar logic in AdminDashboard.

    const hasPermission = (id: string) => {
        if (currentUser?.role === 'admin') return true;
        return currentUser?.permissions?.includes(id);
    };

    return (
        <aside className="w-80 bg-white border-l border-gray-100 flex flex-col sticky top-0 h-screen shadow-sm z-40 lg:z-auto">
            <div className="p-8 border-b border-gray-50">
                <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-primary-navy rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-navy/20 group-hover:scale-105 transition-transform">
                        <Globe className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-primary-navy">هـدس</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Control Panel</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                {menuItems.map(item => {
                    if (item.permission && !hasPermission(item.permission)) return null;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => { setActiveSection(item.id); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl font-black transition-all group ${activeSection === item.id
                                ? 'bg-primary-crimson text-white shadow-xl shadow-primary-crimson/20 translate-x-1'
                                : 'text-gray-500 hover:bg-red-50 hover:text-primary-crimson'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${activeSection === item.id ? 'animate-pulse' : 'group-hover:scale-110'}`} />
                            <span className="text-sm">{item.label}</span>
                        </button>
                    );
                })}

                {currentUser?.role === 'admin' && (
                    <div className="pt-6 mt-6 border-t border-gray-50 space-y-2">
                        <p className="px-5 text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">النظام</p>
                        <button
                            onClick={() => { setActiveSection('history'); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl font-black transition-all ${activeSection === 'history' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <FileText className="w-5 h-5" />
                            <span className="text-sm">سجل الأنشطة</span>
                        </button>
                        <button
                            onClick={() => { setActiveSection('users'); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl font-black transition-all ${activeSection === 'users' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="text-sm">المستخدمين</span>
                        </button>
                        <button
                            onClick={() => { setActiveSection('security'); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl font-black transition-all ${activeSection === 'security' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Shield className="w-5 h-5" />
                            <span className="text-sm">الأمان والحظر</span>
                        </button>
                        <button
                            onClick={() => { setActiveSection('settings'); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl font-black transition-all ${activeSection === 'settings' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <Settings className="w-5 h-5" />
                            <span className="text-sm">الإعدادات</span>
                        </button>
                    </div>
                )}
            </nav>

            <div className="p-6 border-t border-gray-50">
                <div className="bg-gray-50 p-4 rounded-[2rem] flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-navy font-black shadow-sm">
                        {currentUser?.full_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{currentUser?.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{currentUser?.role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 md:px-5 md:py-4 bg-white border-2 border-gray-100 text-gray-400 rounded-xl md:rounded-2xl font-black hover:bg-red-50 hover:text-primary-crimson hover:border-red-100 transition-all group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1" />
                    <span className="text-sm">تسجيل الخروج</span>
                </button>
            </div>
        </aside>
    );
};

const DollarSignShort = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);

export default AdminSidebar;
