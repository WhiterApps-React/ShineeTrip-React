import { X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Navigation ke liye

interface PackageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // API se aane wala holiday package data
  persons: number;
}

export const PackageSelectionModal = ({ isOpen, onClose, data, persons }: PackageSelectionModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Navigation Logic
  const handleNavigation = (selectionType: 'flight' | 'land') => {
    onClose(); // Pehle modal band karein
    // Detail page par navigate karein dynamic ID ke saath
    // Saath mein state bhej rahe hain taaki details page ko pata ho kya select kiya tha
    navigate(`/package-detail/${data.id}?persons=${persons}`, { 
      state: { type: selectionType } 
    });
  };

  // Price formatting helper
  const formatPrice = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return (num || 0).toLocaleString('en-IN');
  };

  // API fields mapping
  const withFlightPrice = data?.price?.total_price_per_adult ?? 0;
  const withoutFlightPrice = data?.price?.base_fare ?? 0;
  
  // Discount logic check
  const discountPercent = data?.price?.discount ?? 10;
  const originalWithFlight = Math.round(withFlightPrice / (1 - discountPercent / 100));
  const originalWithoutFlight = Math.round(withoutFlightPrice / (1 - discountPercent / 100));

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-t-[30px] md:rounded-[30px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-blue-50 bg-[#F0F7FF]">
          <h3 className="font-bold text-gray-800 text-lg truncate pr-4">{data.title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Option 1: With Flight */}
          <div 
            onClick={() => handleNavigation('flight')}
            className="group relative border border-gray-100 rounded-[20px] p-5 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Starting from New Delhi</p>
                <h4 className="font-bold text-gray-700 text-lg mt-1">With Flight</h4>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 line-through">₹{formatPrice(originalWithFlight)}</p>
                <p className="font-extrabold text-gray-800 text-xl">
                    ₹{formatPrice(withFlightPrice)}
                    <span className="text-[10px] font-medium block">/person</span>
                </p>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              <ChevronRight className="text-blue-500" size={24} />
            </div>
          </div>

          {/* Option 2: Without Flight */}
          <div 
            onClick={() => handleNavigation('land')}
            className="group relative border-2 border-[#EAD8B1] bg-[#F9F3E5] rounded-[20px] p-5 hover:bg-[#F1E4C3] transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-800/60 font-bold uppercase tracking-wider">Land Package Only</p>
                <h4 className="font-bold text-gray-800 text-lg mt-1">Without Flight</h4>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-800/40 line-through">₹{formatPrice(originalWithoutFlight)}</p>
                <p className="font-extrabold text-gray-900 text-xl">
                  ₹{formatPrice(withoutFlightPrice)}
                  <span className="text-[10px] font-medium block text-gray-600">/person</span>
                </p>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <ChevronRight className="text-[#AB7E29]" size={24} />
            </div>
          </div>

          {/* EMI Indicator */}
          {data?.price?.emi_per_month > 0 && (
            <p className="text-[10px] text-gray-400 text-center font-medium italic pt-2">
              * Low cost EMI available starting from ₹{formatPrice(data.price.emi_per_month)}/month
            </p>
          )}

        </div>
      </div>
    </div>
  );
};