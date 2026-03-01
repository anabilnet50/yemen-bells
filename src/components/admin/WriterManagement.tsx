import React from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface WriterManagementProps {
    writers: any[];
    isEditingWriter: boolean;
    setIsEditingWriter: (editing: boolean) => void;
    currentWriter: any;
    setCurrentWriter: (writer: any) => void;
    handleWriterSubmit: (e: React.FormEvent) => void;
    handleWriterDelete: (id: number) => void;
    handleImageUpload: (file: File, target: string) => void;
    authenticatedFetch: (url: string, options: any) => Promise<any>;
    fetchWriters: () => void;
}

const WriterManagement: React.FC<WriterManagementProps> = ({
    writers,
    isEditingWriter,
    setIsEditingWriter,
    currentWriter,
    setCurrentWriter,
    handleWriterSubmit,
    handleWriterDelete,
    handleImageUpload,
    authenticatedFetch,
    fetchWriters
}) => {
    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-gray-900">إدارة الكتاب</h1>
                <button
                    onClick={() => { setIsEditingWriter(true); setCurrentWriter({ name: '', bio: '', image_url: '' }); }}
                    className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-primary-crimson/20 hover:bg-primary-crimson/80 transition-all"
                >
                    <Plus className="w-6 h-6" /> إضافة كاتب جديد
                </button>
            </div>

            {isEditingWriter ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <form onSubmit={handleWriterSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">اسم الكاتب</label>
                                <input type="text" value={currentWriter.name} onChange={e => setCurrentWriter({ ...currentWriter, name: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold focus:border-red-500" required />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-black text-gray-700">رابط الصورة</label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-3">
                                        <input type="text" value={currentWriter.image_url} onChange={e => setCurrentWriter({ ...currentWriter, image_url: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold focus:border-red-500" placeholder="https://..." />
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-gray-700">أو رفع من الجهاز</label>
                                            <input type="file" accept="image/*" onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(file, 'writer');
                                            }} className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl outline-none font-bold cursor-pointer hover:bg-red-50" />
                                        </div>
                                    </div>
                                    {currentWriter.image_url && (
                                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm shrink-0 bg-gray-50">
                                            <img src={currentWriter.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-black text-gray-700">نبذة تعريفية</label>
                            <textarea value={currentWriter.bio} onChange={e => setCurrentWriter({ ...currentWriter, bio: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold focus:border-red-500" rows={4}></textarea>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-red-600/20">حفظ الكاتب</button>
                            <button type="button" onClick={() => setIsEditingWriter(false)} className="bg-gray-100 text-gray-600 px-12 py-4 rounded-2xl font-black">إلغاء</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {writers.map(writer => (
                        <div key={writer.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <img src={writer.image_url || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-full object-cover border-2 border-gray-50 shadow-sm" />
                            <div className="flex-1">
                                <p className="font-black text-lg text-primary-navy">{writer.name}</p>
                                <p className="text-sm text-gray-500 line-clamp-2">{writer.bio}</p>
                                <div className="flex gap-3 mt-3">
                                    <button onClick={() => { setCurrentWriter(writer); setIsEditingWriter(true); }} className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg transition-colors">تعديل</button>
                                    <button onClick={() => handleWriterDelete(writer.id)} className="text-red-600 hover:text-red-700 font-bold text-sm bg-red-50 px-3 py-1 rounded-lg transition-colors">حذف</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WriterManagement;
