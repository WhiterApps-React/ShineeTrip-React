import { useState } from "react";
import { Briefcase, X, ChevronRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PackageCardProps {
  data: any;
  persons: number;
  currentCity?: string;
  currentDate?: string;
}

export const PackageCard = ({ data, persons, currentCity, currentDate }: PackageCardProps) => {
  const [showPricePopup, setShowPricePopup] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const navigate = useNavigate();

  const parsePrice = (price: any) => {
    const val = typeof price === 'string' ? parseFloat(price) : price;
    return (val || 0).toLocaleString();
  };

  // ✅ LOGIC FIX: Smart Calculation for Days & Nights
  // Agar API se direct data nahi aaya, to Itinerary ki length se calculate karega
  const daysCount = Number(data.days) || (data.itinerary?.days?.length) || 0;
  const nightsCount = Number(data.nights) || (daysCount > 0 ? daysCount - 1 : 0);

  const handleNavigate = (type: 'flight' | 'land') => {
    let url = `/package-detail/${data.id}?persons=${persons}`;
    
    if (currentCity) {
      url += `&city=${currentCity}`;
    }
    if (currentDate) {
      url += `&departureDate=${currentDate}`;
    }

    navigate(url, { state: { type } });
  };

  const maxInclusions = 3;
  const maxHighlights = 4;

  return (
    <div onClick={() => setShowPricePopup(true)} className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 font-opensans flex flex-col h-full group">
      
      {/* Content Wrapper */}
      <div className={`transition-all duration-300 ${(showPricePopup || showDetailsPopup) ? "opacity-10 scale-[0.98]" : "opacity-100 scale-100"}`}>
        
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={data.hero_image || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000"}
            alt={data.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000";
            }}
          />
        </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col grow">
          <div className="flex justify-between items-start gap-4 mb-4">
            {/* Updated font size */}
            <h3 className="font-bold text-[20px] text-gray-900 leading-tight font-opensans">{data.title}</h3>
            {/* Updated font size & Logic */}
            <span className="bg-[#E3F2FD] text-[#3A96DA] text-[14px] font-bold px-3 py-1.5 rounded-xl border border-[#B3D9F2] shrink-0 font-opensans">
              {nightsCount}N / {daysCount}D
            </span>
          </div>

          {/* Inclusions (Limited to 3) */}
          <div className="flex flex-wrap gap-2 mb-6">
            {data.inclusions?.slice(0, maxInclusions).map((item: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-[#F8F9FA] px-3 py-1.5 rounded-lg">
                <Briefcase size={14} className="text-gray-400" />
                {/* Updated font size */}
                <span className="text-[14px] text-gray-600 font-medium font-opensans">{item}</span>
              </div>
            ))}
            {data.inclusions?.length > maxInclusions && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDetailsPopup(true); }}
                className="text-[12px] font-bold text-[#3A96DA] hover:underline font-opensans"
              >
                +{data.inclusions.length - maxInclusions} More
              </button>
            )}
          </div>

          {/* Highlights (Limited to 4) */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              {/* Updated font size */}
              <p className="text-[16px] font-bold text-gray-800 font-opensans">Highlights</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.highlights?.slice(0, maxHighlights).map((highlight: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 border border-gray-50 bg-white px-4 py-3 rounded-xl shadow-sm">
                  <Briefcase size={16} className="text-gray-800 shrink-0" />
                  {/* Updated font size */}
                  <span className="text-[14px] text-[#4CAF50] font-semibold truncate font-opensans">{highlight}</span>
                </div>
              ))}
            </div>
            {data.highlights?.length > maxHighlights && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDetailsPopup(true); }}
                className="mt-3 text-[14px] font-bold text-[#2EB159] flex items-center gap-1 font-opensans"
              >
                <Info size={16} /> View All Highlights
              </button>
            )}
          </div>

          {/* Price Section */}
          <div className="mt-auto pt-4 flex justify-between items-end border-t border-gray-50">
            <div className="flex flex-col">
              <span className="text-[12px] text-gray-400 font-bold uppercase tracking-tight font-opensans">No Cost EMI at</span>
              <span className="text-[18px] font-bold text-gray-800 font-opensans">₹ {parsePrice(data.price?.emi_per_month)}/mo</span>
            </div>
            <div className="text-right">
              <p className="text-[14px] text-gray-400 line-through font-opensans">Total ₹ {parsePrice(data.price?.total_price_per_adult)}</p>
              <button
                onClick={(e) => { e.stopPropagation(); setShowPricePopup(true); }}
                className="bg-[#2EB159] text-white px-5 py-2 rounded-2xl font-bold text-[18px] font-opensans shadow-md hover:bg-[#25964a] transition-all active:scale-95"
              >
                ₹{parsePrice(data.price?.base_fare)}/person
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for Popups */}
      {(showPricePopup || showDetailsPopup) && (
        <div className="absolute inset-0 bg-gray-600/10 z-10 pointer-events-none" />
      )}

      {/* ================= DETAILS POPUP (View More) ================= */}
      {showDetailsPopup && (
        <div className="absolute inset-0 z-30 bg-white p-6 flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[20px] text-gray-900 font-opensans">Package Details</h3>
            <button onClick={(e) => { e.stopPropagation(); setShowDetailsPopup(false)}} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={24} className="text-gray-500" />
            </button>
          </div>
          
          <div className="overflow-y-auto space-y-6 flex-grow pr-2 custom-scrollbar">
            <div>
              <p className="text-[14px] font-bold text-gray-400 uppercase mb-3 font-opensans">All Inclusions</p>
              <div className="grid grid-cols-1 gap-2">
                {data.inclusions?.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                    <Briefcase size={18} className="text-[#3A96DA]" />
                    <span className="text-[16px] text-gray-700 font-medium font-opensans">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[14px] font-bold text-gray-400 uppercase mb-3 font-opensans">Trip Highlights</p>
              <div className="grid grid-cols-1 gap-2">
                {data.highlights?.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 border border-gray-100 p-3 rounded-xl">
                    <Briefcase size={18} className="text-[#2EB159]" />
                    <span className="text-[16px] text-gray-700 font-semibold font-opensans">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setShowDetailsPopup(false); setShowPricePopup(true); }}
            className="mt-4 w-full bg-[#2EB159] text-white py-3 rounded-xl font-bold text-[18px] font-opensans"
          >
            Check Prices
          </button>
        </div>
      )}

      {/* ================= PRICE POPUP (Existing) ================= */}
      {showPricePopup && (
        <div className="absolute left-0 right-0 bottom-0 pb-10 z-20 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 border-t overflow-hidden">
          <div className="flex justify-between items-center py-6 bg-blue-300/20 px-6 mb-6">
            <h2 className="font-semibold text-gray-900 truncate pr-4">{data.title}</h2>
            <button onClick={(e) =>{ e.stopPropagation(); setShowPricePopup(false)}}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="px-6 space-y-3">
            
            <div 
              onClick={() => handleNavigate('flight')} 
              className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <div>
                <p className="text-[12px] text-gray-400 font-bold uppercase font-opensans">With Flight</p>
                <h4 className="font-bold text-[20px] text-gray-900 font-opensans">₹{parsePrice(data.price?.flight_price)}</h4>
              </div>
              <ChevronRight size={24} className="text-[#2EB159]" />
            </div>

            <div 
              onClick={() => handleNavigate('land')} 
              className="border-2 border-[#EAD8B1] bg-[#F9F3E5] rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-[#f3ead4] transition-colors"
            >
              <div>
                <p className="text-[12px] text-gray-700 font-bold uppercase font-opensans">Without Flight</p>
                <h4 className="font-bold text-[20px] text-gray-900 font-opensans">₹{parsePrice(data.price?.base_fare)}</h4>
              </div>
              <ChevronRight size={24} className="text-[#2EB159]" />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};