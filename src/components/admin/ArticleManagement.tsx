import React from 'react';
import {
    Plus, Edit2, Trash2, Eye, Search, Hash, AlertCircle, FileText, User, Image, Play, Filter, Calendar
} from 'lucide-react';

interface ArticleManagementProps {
    articles: any[];
    filteredArticles: any[];
    categories: any[];
    writers: any[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isEditing: boolean;
    setIsEditing: (editing: boolean) => void;
    currentArticle: any;
    setCurrentArticle: (article: any) => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleToggleArticleStatus: (id: number, currentStatus: number) => void;
    handleArticleDelete: (id: number) => void;
    handleImageUpload: (file: File, target: string) => void;
    authenticatedFetch: (url: string, options: any) => Promise<any>;
    fetchArticles: () => void;
    fetchStats: () => void;
    fetchHistory: () => void;
    showNotification: (msg: string, type?: 'success' | 'error') => void;
}

const ArticleManagement: React.FC<ArticleManagementProps> = ({
    articles,
    filteredArticles,
    categories,
    writers,
    searchTerm,
    setSearchTerm,
    isEditing,
    setIsEditing,
    currentArticle,
    setCurrentArticle,
    handleSubmit,
    handleToggleArticleStatus,
    handleArticleDelete,
    handleImageUpload,
    authenticatedFetch,
    fetchArticles,
    fetchStats,
    fetchHistory,
    showNotification
}) => {
    const [filterUrgent, setFilterUrgent] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);

    const processedArticles = filterUrgent
        ? filteredArticles.filter(a => a.is_urgent === 1)
        : filteredArticles;

    const totalUrgent = articles.filter(a => a.is_urgent === 1).length;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(processedArticles.map(a => a.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const onBulkTrash = () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`هل أنت متأكد من نقل ${selectedIds.length} أخبار إلى سلة المحذوفات؟`)) {
            authenticatedFetch('/api/articles/bulk/trash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            })
                .then(() => {
                    fetchArticles();
                    fetchStats();
                    fetchHistory();
                    setSelectedIds([]);
                    showNotification('تم نقل الأخبار بنجاح');
                })
                .catch(() => showNotification('فشل نقل الأخبار', 'error'));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-2">إدارة الأخبار</h1>
                    <p className="text-gray-500 font-bold text-lg">تحكم في جميع أخبار ومقالات الموقع من هنا</p>
                </div>

                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full lg:w-auto">
                    {/* Stats */}
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full sm:w-auto overflow-x-auto custom-scrollbar">
                        <div className="flex items-center gap-3 px-6 py-3 bg-primary-navy/5 rounded-xl shrink-0">
                            <FileText className="w-6 h-6 text-primary-navy" />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 font-bold">إجمالي الأخبار</span>
                                <span className="text-2xl font-black text-primary-navy leading-none">{articles.length}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 py-3 bg-red-50 rounded-xl shrink-0">
                            <AlertCircle className="w-6 h-6 text-primary-crimson" />
                            <div className="flex flex-col">
                                <span className="text-xs text-red-500 font-bold">أخبار عاجلة</span>
                                <span className="text-2xl font-black text-primary-crimson leading-none">{totalUrgent}</span>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => { setIsEditing(true); setCurrentArticle({ title: '', content: '', category_id: categories[0]?.id || 1, image_url: '', video_url: '', is_urgent: false, writer_id: '', is_active: true }); }}
                            className="flex-1 sm:flex-none bg-primary-navy text-white px-4 py-3 md:px-6 md:py-4 mt-2 mb-2 rounded-xl text-sm md:text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-primary-navy/20 hover:bg-black transition-all"
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" /> إضافة خبر
                        </button>
                        <button
                            onClick={() => setFilterUrgent(!filterUrgent)}
                            className={`flex-1 sm:flex-none px-4 py-3 md:px-6 md:py-4 mt-2 mb-2 rounded-xl text-sm md:text-base font-black transition-all border-2 flex items-center justify-center gap-2 ${filterUrgent ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200' : 'bg-white text-gray-700 border-gray-100 hover:border-red-500 hover:bg-red-50'}`}
                        >
                            <Filter className="w-4 h-4 md:w-5 md:h-5" />
                            {filterUrgent ? 'عرض الكل' : 'العاجل'}
                        </button>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={onBulkTrash}
                                className="flex-1 sm:flex-none bg-red-50 text-red-600 px-4 py-3 md:px-6 md:py-4 mt-2 mb-2 rounded-xl text-sm md:text-base font-black flex items-center justify-center gap-2 border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-100"
                            >
                                <Trash2 className="w-4 h-4 md:w-5 md:h-5" /> حذف ({selectedIds.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isEditing ? (
                <div className="bg-white p-10 lg:p-16 rounded-[3rem] shadow-premium border border-gray-100 animate-in fade-in zoom-in duration-500" >
                    <div className="flex items-center gap-6 mb-12 pb-6 border-b border-gray-100">
                        <div className="w-16 h-16 bg-red-50 text-primary-crimson rounded-2xl flex items-center justify-center">
                            <Plus className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900">{currentArticle.id ? 'تعديل الخبر الحالي' : 'إنشاء ونشر خبر جديد'}</h2>
                            <p className="text-gray-400 font-bold">يرجى ملء كافة الحقول لضمان ظهور الخبر بشكل احترافي</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">عنوان الخبر الرئيسي</label>
                                <input
                                    type="text"
                                    value={currentArticle.title}
                                    onChange={e => setCurrentArticle({ ...currentArticle, title: e.target.value })}
                                    className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-black text-xl placeholder:text-gray-300"
                                    placeholder="أدخل عنواناً جذاباً وقصيراً..."
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">تصنيف القسم</label>
                                <select
                                    value={currentArticle.category_id}
                                    onChange={e => setCurrentArticle({ ...currentArticle, category_id: e.target.value })}
                                    className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold appearance-none bg-[url('https://www.svgrepo.com/show/511136/arrow-down-1.svg')] bg-[length:24px] bg-[right_20px_center] bg-no-repeat"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700 text-blue-600">رابط الفيديو (YouTube)</label>
                                <div className="relative">
                                    <Play className="absolute right-5 top-5 text-blue-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={currentArticle.video_url || ''}
                                        onChange={e => setCurrentArticle({ ...currentArticle, video_url: e.target.value })}
                                        className="w-full p-5 pr-14 bg-blue-50/30 border-2 border-blue-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold"
                                        placeholder="e.g., https://www.youtube.com/watch?v=..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">رابط صورة الخبر الرسمية</label>
                                <div className="relative">
                                    <Image className="absolute right-5 top-5 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={currentArticle.image_url}
                                        onChange={e => setCurrentArticle({ ...currentArticle, image_url: e.target.value })}
                                        className="w-full p-5 pr-14 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">أو رفع صورة من الجهاز</label>
                                <div className="relative pt-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'article')}
                                        className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl focus:border-red-500 transition-all outline-none font-bold cursor-pointer hover:bg-red-50/30"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">اسم الكاتب / المصدر</label>
                                <select
                                    value={currentArticle.writer_id || ''}
                                    onChange={e => setCurrentArticle({ ...currentArticle, writer_id: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold appearance-none"
                                >
                                    <option value="">هـدس (افتراضي)</option>
                                    {writers.map(writer => <option key={writer.id} value={writer.id}>{writer.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {!categories.find(c => String(c.id) === String(currentArticle.category_id))?.slug.includes('youtube') && (
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">محتوى الخبر التفصيلي</label>
                                <textarea
                                    rows={12}
                                    value={currentArticle.content}
                                    onChange={e => setCurrentArticle({ ...currentArticle, content: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold leading-relaxed"
                                    placeholder="اكتب تفاصيل الخبر هنا..."
                                    required
                                ></textarea>
                            </div>
                        )}

                        <div className="flex items-center gap-6 bg-red-50 p-6 rounded-2xl border border-red-100">
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    id="urgent"
                                    checked={Boolean(currentArticle.is_urgent)}
                                    onChange={e => setCurrentArticle({ ...currentArticle, is_urgent: e.target.checked })}
                                    className="w-6 h-6 accent-red-600 cursor-pointer"
                                />
                                <label htmlFor="urgent" className="font-black text-red-700 cursor-pointer flex flex-col">
                                    <span>تمييز كخبر عاجل</span>
                                    <span className="text-[10px] font-bold text-red-500/70">(يظهر في الهيرو الكبير وشريط الأخبار)</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button type="submit" className="bg-red-600 text-white px-6 py-3 md:px-12 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-base font-black shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all">حفظ ونشر الخبر</button>
                            <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-600 px-6 py-3 md:px-12 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-base font-black hover:bg-gray-200 transition-all">إلغاء</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] shadow-premium overflow-hidden border border-gray-100">
                    <div className="p-8 border-b flex flex-col md:flex-row justify-between gap-6 bg-gray-50/30">
                        <div className="relative flex-1">
                            <Search className="absolute right-5 top-4 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="ابحث بمنتهى الدقة عن خبر معين..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pr-14 pl-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary-crimson focus:ring-0 outline-none font-bold transition-all text-sm"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full border-separate border-spacing-0 min-w-[1000px]">
                            <thead>
                                <tr className="bg-primary-navy text-white">
                                    <th className="p-5 text-right font-black text-xs uppercase tracking-widest border-b border-white/10 rounded-tr-[2rem] w-12">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedIds.length === processedArticles.length && processedArticles.length > 0}
                                            className="w-5 h-5 accent-red-600 cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-5 text-right font-black text-xs uppercase tracking-widest border-b border-white/10">المعلومات الأساسية</th>
                                    <th className="p-5 text-center font-black text-xs uppercase tracking-widest border-b border-white/10">القسم</th>
                                    <th className="p-5 text-center font-black text-xs uppercase tracking-widest border-b border-white/10">التاريخ والوقت</th>
                                    <th className="p-5 text-center font-black text-xs uppercase tracking-widest border-b border-white/10">التفاعل</th>
                                    <th className="p-5 text-center font-black text-xs uppercase tracking-widest border-b border-white/10">الناشر</th>
                                    <th className="p-5 text-center font-black text-xs uppercase tracking-widest border-b border-white/10">الحالة</th>
                                    <th className="p-5 text-center font-black text-xs uppercase tracking-widest border-b border-white/10 rounded-tl-[2rem]">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {processedArticles.map(article => (
                                    <tr key={article.id} className={`hover:bg-gray-50/80 transition-all duration-300 group ${selectedIds.includes(article.id) ? 'bg-red-50/30' : ''}`}>
                                        <td className="p-5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(article.id)}
                                                onChange={() => handleSelectOne(article.id)}
                                                className="w-5 h-5 accent-red-600 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-20 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm ring-2 ring-gray-100 group-hover:ring-primary-crimson/30 transition-all">
                                                    <img
                                                        src={article.image_url || 'https://via.placeholder.com/150'}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        alt={article.title}
                                                    />
                                                    {article.is_urgent === 1 && (
                                                        <div className="absolute inset-x-0 bottom-0 bg-primary-crimson text-[8px] text-white font-black text-center py-0.5 animate-pulse">
                                                            عاجل
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <h3 className="text-gray-900 font-black text-sm line-clamp-1 group-hover:text-primary-crimson transition-colors">
                                                        {article.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-primary-navy/40 bg-gray-100 px-2 py-0.5 rounded-md">#{article.id}</span>
                                                        {article.video_url && (
                                                            <div className="w-5 h-5 bg-blue-50 text-blue-500 rounded-md flex items-center justify-center">
                                                                <Play className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-navy text-[11px] font-black text-white shadow-sm">
                                                {article.category_name}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1.5 text-gray-700 font-black text-xs">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    {new Date(article.created_at).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short' })}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-bold">
                                                    {new Date(article.created_at).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-center">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl border border-green-100/50">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-black">{article.views || 0}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center text-blue-600">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-600 truncate max-w-[80px]">
                                                    {article.writer_name || article.author || 'المسؤول'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleArticleStatus(article.id, article.is_active)}
                                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${article.is_active === 1 ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-sm ${article.is_active === 1 ? 'right-7' : 'right-1'}`}></div>
                                                </button>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${article.is_active === 1 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {article.is_active === 1 ? 'نشط' : 'مخفي'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => { setCurrentArticle(article); setIsEditing(true); }}
                                                    className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                                                    title="تعديل"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleArticleDelete(article.id)}
                                                    className="p-2.5 bg-red-50 text-primary-crimson hover:bg-primary-crimson hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ArticleManagement;
