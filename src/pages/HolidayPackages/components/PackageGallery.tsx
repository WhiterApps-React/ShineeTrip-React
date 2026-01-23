import { ImageIcon } from "lucide-react";

interface PackageGalleryProps {
  heroImage: string;
  title: string;
  onOpenGallery: () => void;
  imageCategories: any[]; 
}

export const PackageGallery = ({ heroImage, title, onOpenGallery, imageCategories }: PackageGalleryProps) => {
  
 
  const validCategories = imageCategories?.filter(cat => cat.images && cat.images.length > 0) || [];


  const activitiesCat = validCategories.find(cat => 
    cat.title.toLowerCase().includes('activities') || 
    cat.title.toLowerCase().includes('sightseeing') ||
    cat.title.toLowerCase().includes('destination')
  ) || validCategories[0]; 

  const propertyCat = validCategories.find(cat => 
    (cat.title.toLowerCase().includes('property') || 
     cat.title.toLowerCase().includes('hotel') ||
     cat.title.toLowerCase().includes('luxury')) && 
     cat.id !== activitiesCat?.id 
  ) || validCategories[1] || validCategories[0];

  // 3. Total Photos count for the button
  const totalPhotos = imageCategories?.reduce((sum, cat) => sum + (cat.images?.length || 0), 0) || 0;

  return (
   <div className="max-w-[1400px] mx-auto px-8 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[450px] md:h-[600px]">
        
        {/* 1. Main Hero Image - Left Side */}
        <div className="md:col-span-4 relative rounded-3xl overflow-hidden group shadow-lg">
          <img 
            src={heroImage || "https://images.unsplash.com/photo-1512100356956-c1227c331701"} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
       <button 
  onClick={onOpenGallery}
  className="absolute bottom-6 right-6 bg-[#C9A961] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-2xl hover:bg-[#b39552] transition-all flex items-center gap-2 whitespace-nowrap z-10 active:scale-95"
>
  <ImageIcon size={18} /> View Gallery
</button>

        </div>

        {/* 2. Center Image - Dynamic from validCategories */}
        <div 
          onClick={onOpenGallery} 
          className="md:col-span-4 relative rounded-3xl overflow-hidden cursor-pointer group shadow-lg"
        >
          <img 
            src={activitiesCat?.images?.[0]?.image_url || "https://images.unsplash.com/photo-1590050751117-2c819df9e94e"} 
            className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700" 
            alt="Activities"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <span className="text-white font-bold text-lg block translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              {activitiesCat?.title || "Explore Destination"}
            </span>
            <p className="text-[#C9A961] text-[10px] font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {activitiesCat?.images?.length || 0} Photos Available
            </p>
          </div>
        </div>

        {/* 3. Right Image - Dynamic from validCategories */}
        <div 
          onClick={onOpenGallery}
          className="md:col-span-4 relative rounded-3xl overflow-hidden cursor-pointer group shadow-lg"
        >
          <img 
            src={propertyCat?.images?.[0]?.image_url || "https://images.unsplash.com/photo-1566665797739-1674de7a421a"} 
            className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700" 
            alt="Property"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <span className="text-white font-bold text-lg block translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              {propertyCat?.title || "Luxury Stays"}
            </span>
            <p className="text-[#C9A961] text-[10px] font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {propertyCat?.images?.length || 0} Photos Available
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};