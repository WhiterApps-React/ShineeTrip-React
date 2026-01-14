import { X, Camera } from "lucide-react";
import { useState, useEffect } from "react";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageCategories: any[]; 
  onImageClick: (imageData: any) => void;
}

export const GalleryModal = ({ isOpen, onClose, title, imageCategories, onImageClick }: GalleryModalProps) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeCity, setActiveCity] = useState("All");

  const validCategories = imageCategories?.filter(cat => cat.images && cat.images.length > 0) || [];

  useEffect(() => {
    if (isOpen && activeCategoryIndex >= validCategories.length) {
      setActiveCategoryIndex(0);
    }
  }, [isOpen, validCategories.length]);

  if (!isOpen) return null;

  const currentCategory = validCategories[activeCategoryIndex] || { images: [], title: "Gallery" };
  const cities = ["All", ...Array.from(new Set(currentCategory.images?.map((img: any) => img.city).filter(Boolean) as string[]))];

  const filteredImages = activeCity === "All" 
    ? currentCategory.images || []
    : (currentCategory.images || []).filter((img: any) => img.city === activeCity);

  return (
    // ✅ FIX: z-[9999] ko hata kar z-[60] kiya taki Login Modal (z-100) iske upar dikhe
    <div className="fixed inset-0 z-20 mt-14 bg-white/95 backdrop-blur-sm overflow-y-auto font-opensans animate-in fade-in slide-in-from-bottom-10 duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/80 backdrop-blur-md z-50 py-4 border-b border-gray-100 rounded-b-2xl px-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[#C9A961] text-[10px] font-black uppercase tracking-[0.2em]">Official Visual Gallery</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-all shadow-sm"
          >
            <X size={24} className="text-gray-800" />
          </button>
        </div>

        {/* City Tabs */}
        {cities.length > 1 && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
            {cities.map((city: string) => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCity === city 
                  ? "bg-black text-white shadow-lg scale-105" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((img: any, i: number) => (
            <div 
                key={i} 
                onClick={() => onImageClick(img)}
                className="aspect-[4/3] rounded-[24px] overflow-hidden shadow-md group relative cursor-pointer border border-gray-100 hover:shadow-2xl transition-all duration-300"
            >
              <img 
                src={img.image_url}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                alt={img.caption || "Gallery item"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-lg font-bold leading-tight">
                    {img.city}
                  </p>
                  <span className="text-[#C9A961] text-[10px] font-black uppercase tracking-widest mt-1 block">
                    Click to Explore Properties
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-20"></div>
      </div>
    </div>
  );
};