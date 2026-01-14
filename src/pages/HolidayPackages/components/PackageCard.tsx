import { useState } from "react";
import { Briefcase, X, ChevronRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PackageCardProps {
  data: any;
  persons : number;
}

export const PackageCard = ({ data , persons }: PackageCardProps) => {
  const [showPricePopup, setShowPricePopup] = useState(false);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false); // New Details Popup
  const navigate = useNavigate();

  const parsePrice = (price: any) => {
    const val = typeof price === 'string' ? parseFloat(price) : price;
    return (val || 0).toLocaleString();
  };

  // Limits set kar rahe hain
  const maxInclusions = 3;
  const maxHighlights = 4;

  return (
    <div onClick={() => setShowPricePopup(true)} className="relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 font-opensans flex flex-col h-full group">
      
      {/* Content Wrapper */}
      <div className={`transition-all duration-300 ${(showPricePopup || showDetailsPopup) ? "opacity-10 scale-[0.98]" : "opacity-100 scale-100"}`}>
        
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={data.hero_image}
            alt={data.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col grow">
          <div className="flex justify-between items-start gap-4 mb-4">
            <h3 className="font-bold text-xl text-gray-900 leading-tight">{data.title}</h3>
            <span className="bg-[#E3F2FD] text-[#3A96DA] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#B3D9F2] shrink-0">
              {data.nights}N/{data.days}D
            </span>
          </div>

          {/* Inclusions (Limited to 3) */}
          <div className="flex flex-wrap gap-2 mb-6">
            {data.inclusions?.slice(0, maxInclusions).map((item: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-[#F8F9FA] px-3 py-1.5 rounded-lg">
                <Briefcase size={14} className="text-gray-400" />
                <span className="text-xs text-gray-600 font-medium">{item}</span>
              </div>
            ))}
            {data.inclusions?.length > maxInclusions && (
              <button 
                onClick={() => setShowDetailsPopup(true)}
                className="text-[10px] font-bold text-[#3A96DA] hover:underline"
              >
                +{data.inclusions.length - maxInclusions} More
              </button>
            )}
          </div>

          {/* Highlights (Limited to 4) */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold text-gray-800">{data.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.highlights?.slice(0, maxHighlights).map((highlight: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 border border-gray-50 bg-white px-4 py-3 rounded-xl shadow-sm">
                  <Briefcase size={16} className="text-gray-800 shrink-0" />
                  <span className="text-[13px] text-[#4CAF50] font-semibold truncate">{highlight}</span>
                </div>
              ))}
            </div>
            {data.highlights?.length > maxHighlights && (
              <button 
                onClick={() => setShowDetailsPopup(true)}
                className="mt-3 text-xs font-bold text-[#2EB159] flex items-center gap-1"
              >
                <Info size={14} /> View All Highlights
              </button>
            )}
          </div>

          {/* Price Section */}
          <div className="mt-auto pt-4 flex justify-between items-end border-t border-gray-50">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">No Cost EMI at</span>
              <span className="text-lg font-bold text-gray-800">₹ {parsePrice(data.price?.emi_per_month)}/mo</span>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400 line-through">Total Price ₹ {parsePrice(data.price?.total_price_per_adult)}</p>
              <button
                onClick={() => setShowPricePopup(true)}
                className="bg-[#2EB159] text-white px-5 py-2 rounded-2xl font-bold text-lg"
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
            <h3 className="font-bold text-lg text-gray-900">Package Details</h3>
            <button onClick={() =>  setShowDetailsPopup(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          <div className="overflow-y-auto space-y-6 flex-grow pr-2 custom-scrollbar">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">All Inclusions</p>
              <div className="grid grid-cols-1 gap-2">
                {data.inclusions?.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                    <Briefcase size={16} className="text-[#3A96DA]" />
                    <span className="text-sm text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">Trip Highlights</p>
              <div className="grid grid-cols-1 gap-2">
                {data.highlights?.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 border border-gray-100 p-3 rounded-xl">
                    <Briefcase size={16} className="text-[#2EB159]" />
                    <span className="text-sm text-gray-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => { setShowDetailsPopup(false); setShowPricePopup(true); }}
            className="mt-4 w-full bg-[#2EB159] text-white py-3 rounded-xl font-bold"
          >
            Check Prices
          </button>
        </div>
      )}

      {/* ================= PRICE POPUP (Existing) ================= */}
      {showPricePopup && (
        <div className="absolute left-0 right-0 bottom-0 py-10 z-20 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 border-t">
          <div className="flex justify-between items-center px-6 mb-6">
            <h3 className="font-bold text-gray-900 truncate pr-4">{data.title}</h3>
            <button onClick={(e) =>{ e.stopPropagation(); setShowPricePopup(false)}}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="px-6 space-y-3">
            <div onClick={() => navigate(`/package-detail/${data.id}?persons=${persons}`)} className="border border-gray-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">With Flight</p>
                <h4 className="font-bold text-xl text-gray-900">₹{parsePrice(data.price?.flight_price)}</h4>
              </div>
              <ChevronRight size={24} className="text-[#2EB159]" />
            </div>
            <div onClick={() => navigate(`/package-detail/${data.id}?persons=${persons}`)} className="border-2 border-[#EAD8B1] bg-[#F9F3E5] rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-[#f3ead4] transition-colors">
              <div>
                <p className="text-[10px] text-gray-700 font-bold uppercase">Without Flight</p>
                <h4 className="font-bold text-xl text-gray-900">₹{parsePrice(data.price?.base_fare)}</h4>
              </div>
              <ChevronRight size={24} className="text-[#2EB159]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};