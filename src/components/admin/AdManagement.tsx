import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface AdManagementProps {
    ads: any[];
    isEditingAd: boolean;
    setIsEditingAd: (editing: boolean) => void;
    currentAd: any;
    setCurrentAd: (ad: any) => void;
    handleAdSubmit: (e: React.FormEvent) => void;
    handleAdDelete: (id: number) => void;
    handleImageUpload: (file: File, target: string) => void;
    authenticatedFetch: (url: string, options: any) => Promise<any>;
    fetchAds: () => void;
}

const AdManagement: React.FC<AdManagementProps> = ({
    ads,
    isEditingAd,
    setIsEditingAd,
    currentAd,
    setCurrentAd,
    handleAdSubmit,
    handleAdDelete,
    handleImageUpload,
    authenticatedFetch,
    fetchAds
}) => {
    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-gray-900">إدارة الإعلانات</h1>
                <button
                    onClick={() => { setIsEditingAd(true); setCurrentAd({ title: '', image_url: '', link_url: '', adsense_code: '', position: 'sidebar', is_active: 1, start_date: '', end_date: '' }); }}
                    className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all font-bold"
                >
                    <Plus className="w-6 h-6" /> إضافة إعلان جديد
                </button>
            </div>

            {isEditingAd ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <form onSubmit={handleAdSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700">عنوان الإعلان</label>
                                <input type="text" placeholder="مثلاً: عرض شهر رمضان" value={currentAd.title} onChange={e => setCurrentAd({ ...currentAd, title: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-red-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700">رابط التوجه (URL)</label>
                                <input type="text" placeholder="https://example.com" value={currentAd.link_url} onChange={e => setCurrentAd({ ...currentAd, link_url: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-red-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700">رابط صورة الإعلان</label>
                                <input type="text" placeholder="https://..." value={currentAd.image_url} onChange={e => setCurrentAd({ ...currentAd, image_url: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-red-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700">أو رفع صورة من الجهاز</label>
                                <input type="file" accept="image/*" onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, 'ad');
                                }} className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl outline-none font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700">مكان العرض</label>
                                <select value={currentAd.position} onChange={e => setCurrentAd({ ...currentAd, position: e.target.value })} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-red-500 outline-none">
                                    <option value="sidebar">جانبي | Sidebar</option>
                                    <option value="top">بجانب الخبر الرئيسي | Hero Section</option>
                                    <option value="inline">داخل المحتوى | Middle Section</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl h-[72px] self-end">
                                <input
                                    type="checkbox"
                                    id="ad_active"
                                    checked={currentAd.is_active === 1}
                                    onChange={e => setCurrentAd({ ...currentAd, is_active: e.target.checked ? 1 : 0 })}
                                    className="w-6 h-6 accent-red-600"
                                />
                                <label htmlFor="ad_active" className="font-black text-gray-700 cursor-pointer text-sm">تفعيل الإعلان فوراً</label>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700">تاريخ بدء العرض</label>
                                <input
                                    type="datetime-local"
                                    value={currentAd.start_date || ''}
                                    onChange={e => setCurrentAd({ ...currentAd, start_date: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-red-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-700">تاريخ انتهاء العرض</label>
                                <input
                                    type="datetime-local"
                                    value={currentAd.end_date || ''}
                                    onChange={e => setCurrentAd({ ...currentAd, end_date: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-red-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 text-orange-600">أو وضع كود AdSense البرمجي</label>
                            <textarea placeholder="<ins class='adsbygoogle' ...></ins>" value={currentAd.adsense_code} onChange={e => setCurrentAd({ ...currentAd, adsense_code: e.target.value })} className="w-full p-5 bg-orange-50/20 border-2 border-orange-100 rounded-2xl font-mono text-sm focus:border-orange-400 outline-none" rows={4}></textarea>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all font-bold">حفظ الإعلان</button>
                            <button type="button" onClick={() => setIsEditingAd(false)} className="bg-gray-100 text-gray-600 px-12 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all font-bold">إلغاء</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {ads.map(ad => (
                        <div key={ad.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-md transition-shadow group">
                            <div className="w-32 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-50 relative">
                                <img src={ad.image_url || 'https://via.placeholder.com/150x100'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {ad.is_active === 0 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-[10px] text-white font-black uppercase bg-red-600 px-2 py-0.5 rounded">معطل</span></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <p className="font-black text-lg text-primary-navy truncate">{ad.title || 'إعلان بدون عنوان'}</p>
                                    <span className={`w-2 h-2 rounded-full ${ad.is_active === 1 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                                </div>
                                <p className="text-sm text-gray-400 font-bold truncate mb-2">{ad.link_url || 'لا يوجد رابط توجه'}</p>
                                <div className="flex gap-2">
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                                        {ad.position === 'top' ? 'بجانب الخبر الرئيسي' : ad.position === 'sidebar' ? 'جانبي' : 'داخل المحتوى'}
                                    </span>
                                    {ad.adsense_code && <span className="text-[10px] bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-black uppercase tracking-wider">AdSense</span>}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setCurrentAd(ad); setIsEditingAd(true); }} className="p-3 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button>
                                <button onClick={() => handleAdDelete(ad.id)} className="p-3 text-red-600 bg-red-50 hover:bg-primary-crimson hover:text-white rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                    {ads.length === 0 && (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-20 rounded-[3rem] text-center">
                            <p className="text-gray-400 font-black text-xl">لا توجد إعلانات نشطة حالياً</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdManagement;
