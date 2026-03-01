import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface CategoryManagementProps {
    categories: any[];
    isEditingCategory: boolean;
    setIsEditingCategory: (editing: boolean) => void;
    currentCategory: any;
    setCurrentCategory: (category: any) => void;
    handleCategorySubmit: (e: React.FormEvent) => void;
    handleCategoryDelete: (id: number) => void;
    handleImageUpload: (file: File, target: string) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
    categories,
    isEditingCategory,
    setIsEditingCategory,
    currentCategory,
    setCurrentCategory,
    handleCategorySubmit,
    handleCategoryDelete,
    handleImageUpload
}) => {
    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-gray-900">إدارة الأقسام</h1>
                <button
                    onClick={() => { setIsEditingCategory(true); setCurrentCategory({ name: '', slug: '', background_url: '' }); }}
                    className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all"
                >
                    <Plus className="w-6 h-6" /> إضافة قسم جديد
                </button>
            </div>

            {isEditingCategory ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <form onSubmit={handleCategorySubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">اسم القسم</label>
                                <input
                                    type="text"
                                    value={currentCategory.name}
                                    onChange={e => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">الرابط اللطيف (Slug)</label>
                                <input
                                    type="text"
                                    value={currentCategory.slug}
                                    onChange={e => setCurrentCategory({ ...currentCategory, slug: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white transition-all outline-none font-bold"
                                    placeholder="e.g., local-news"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 pt-6">
                            <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all">حفظ القسم</button>
                            <button type="button" onClick={() => setIsEditingCategory(false)} className="bg-gray-100 text-gray-600 px-12 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">إلغاء</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-center border-collapse min-w-[600px]">
                            <thead className="bg-[#5b9bd5] text-white">
                                <tr>
                                    <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">الاسم</th>
                                    <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">الرابط (Slug)</th>
                                    <th className="p-4 sm:p-6 font-black border-l border-white last:border-l-0 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#cfdce9] border-b border-x border-[#cfdce9]">
                                {categories.map(cat => (
                                    <tr key={cat.id} className="even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50 transition-colors text-center border-b border-[#cfdce9]">
                                        <td className="p-4 sm:p-6 font-bold border-l border-[#cfdce9] last:border-l-0">{cat.name}</td>
                                        <td className="p-4 sm:p-6 font-mono text-sm text-gray-600 border-l border-[#cfdce9] last:border-l-0">{cat.slug}</td>
                                        <td className="p-4 sm:p-6 border-l border-[#cfdce9] last:border-l-0">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => { setCurrentCategory(cat); setIsEditingCategory(true); }} className="p-3 text-blue-600 hover:bg-blue-100/50 rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button>
                                                <button onClick={() => handleCategoryDelete(cat.id)} className="p-3 text-primary-crimson hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
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

export default CategoryManagement;
