import React from 'react';
import { Trash2, RotateCcw, Trash, Hash } from 'lucide-react';

interface TrashManagementProps {
    trashArticles: any[];
    selectedTrashIds: number[];
    setSelectedTrashIds: (ids: number[]) => void;
    handleBulkTrashAction: (action: 'restore' | 'delete') => void;
    handleRestoreArticle: (id: number) => void;
    handlePermanentDelete: (id: number) => void;
    handleEmptyTrash: () => void;
}

const TrashManagement: React.FC<TrashManagementProps> = ({
    trashArticles,
    selectedTrashIds,
    setSelectedTrashIds,
    handleBulkTrashAction,
    handleRestoreArticle,
    handlePermanentDelete,
    handleEmptyTrash
}) => {
    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">سلة المحذوفات</h1>
                    <p className="text-gray-500 font-bold">يمكنك استعادة الأخبار المحذوفة أو حذفها نهائياً من النظام</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    {selectedTrashIds.length > 0 && (
                        <>
                            <button
                                onClick={() => handleBulkTrashAction('restore')}
                                className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-green-600/20 hover:bg-green-700 transition-all scale-in"
                            >
                                <RotateCcw className="w-5 h-5" /> استعادة المحدد ({selectedTrashIds.length})
                            </button>
                            <button
                                onClick={() => handleBulkTrashAction('delete')}
                                className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary-crimson/20 hover:bg-red-700 transition-all scale-in"
                            >
                                <Trash2 className="w-5 h-5" /> حذف المحدد ({selectedTrashIds.length})
                            </button>
                        </>
                    )}
                    {trashArticles.length > 0 && (
                        <button
                            onClick={handleEmptyTrash}
                            className="bg-primary-navy text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 hover:bg-black transition-all"
                        >
                            <Trash className="w-5 h-5" /> تفريغ السلة بالكامل
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 w-full overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-center border-collapse border border-[#cfdce9] min-w-[800px]">
                        <thead className="bg-[#5b9bd5] text-white">
                            <tr className="divide-x divide-x-reverse divide-[#ffffff]">
                                <th className="p-4 sm:p-6 w-16 text-center">
                                    <div className="flex justify-center">
                                        <input
                                            type="checkbox"
                                            className="w-6 h-6 accent-red-600 cursor-pointer"
                                            checked={trashArticles.length > 0 && selectedTrashIds.length === trashArticles.length}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedTrashIds(trashArticles.map(a => a.id));
                                                else setSelectedTrashIds([]);
                                            }}
                                        />
                                    </div>
                                </th>
                                <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-center"><Hash className="w-5 h-5" /> العنوان</div>
                                </th>
                                <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">تاريخ الحذف</th>
                                <th className="p-4 sm:p-6 text-sm font-black uppercase text-center whitespace-nowrap">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#cfdce9]">
                            {trashArticles.map(article => (
                                <tr key={article.id} className={`divide-x divide-x-reverse divide-[#cfdce9] text-center transition-colors transition-all duration-300 ${selectedTrashIds.includes(article.id) ? 'bg-red-50' : 'even:bg-[#e9f0f8] odd:bg-white hover:bg-blue-50/50'}`}>
                                    <td className="p-6 align-middle">
                                        <div className="flex justify-center">
                                            <input
                                                type="checkbox"
                                                className="w-6 h-6 accent-red-600 cursor-pointer"
                                                checked={selectedTrashIds.includes(article.id)}
                                                onChange={() => {
                                                    if (selectedTrashIds.includes(article.id)) {
                                                        setSelectedTrashIds(selectedTrashIds.filter(idx => idx !== article.id));
                                                    } else {
                                                        setSelectedTrashIds([...selectedTrashIds, article.id]);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="p-6 font-black text-lg text-primary-navy align-middle text-right">{article.title}</td>
                                    <td className="p-6 text-sm text-gray-500 font-bold align-middle">
                                        <div className="flex justify-center">
                                            <span className="bg-gray-100 px-4 py-1.5 rounded-xl border border-gray-200">{new Date(article.created_at).toLocaleDateString('ar-YE')}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => handleRestoreArticle(article.id)}
                                                className="w-12 h-12 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-2xl transition-all shadow-sm flex items-center justify-center group"
                                                title="استعادة"
                                            >
                                                <RotateCcw className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDelete(article.id)}
                                                className="w-12 h-12 bg-red-50 text-primary-crimson hover:bg-primary-crimson hover:text-white rounded-2xl transition-all shadow-sm flex items-center justify-center group"
                                                title="حذف نهائي"
                                            >
                                                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {trashArticles.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Trash className="w-16 h-16 text-gray-400" />
                                            <p className="text-gray-400 font-black text-2xl">سلة المحذوفات فارغة تماماً</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TrashManagement;
