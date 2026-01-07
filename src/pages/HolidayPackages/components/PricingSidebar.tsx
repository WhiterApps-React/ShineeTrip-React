import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface PricingSidebarProps {
  priceData: any;
  calculatedSummary: any;
  defaultOption?: 'flight' | 'land'; // Modal se 'flight' ya 'land' aa raha hai
  persons: number;
}

export const PricingSidebar = ({ priceData, calculatedSummary, defaultOption = 'flight', persons }: PricingSidebarProps) => {
  // 1. Local state taaki user detail page par bhi toggle kar sake
  const [selection, setSelection] = useState<'flight' | 'land'>(defaultOption);
  const navigate = useNavigate();
  const { id } = useParams();

  // Sync with defaultOption if it changes
  useEffect(() => {
    setSelection(defaultOption);
  }, [defaultOption]);

  if (!priceData) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-40 h-fit text-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-3/4 bg-gray-100 rounded"></div>
          <div className="h-12 w-full bg-gray-200 rounded-2xl"></div>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Syncing Price Details...</p>
        </div>
      </div>
    );
  }

  // 2. Extracting necessary price components (Per Person)
  const baseFare = Number(priceData?.base_fare || 0);
  const flightPrice = Number(priceData?.flight_logistics || priceData?.flight_price || 0);
  const tax = Number(priceData?.tax || 0);
  const discount = Number(calculatedSummary?.discount || priceData?.discount || 0);

  // 3. MAIN TOGGLE & MULTIPLICATION LOGIC
  // Sabhi components ko 'persons' se multiply kar rahe hain
  const perPersonTotal = selection === 'flight' 
    ? (baseFare + flightPrice + tax - discount)
    : (baseFare + tax - discount);

  const totalAmount = perPersonTotal * persons;

  const formatPrice = (val: any) => {
    return Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-40 h-fit">
      
      {/* Selection Toggle Design */}
      <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
        <button 
          onClick={() => setSelection('flight')}
          className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all tracking-tighter ${
            selection === 'flight' ? 'bg-white shadow-sm text-[#C9A961]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          WITH FLIGHT
        </button>
        <button 
          onClick={() => setSelection('land')}
          className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all tracking-tighter ${
            selection === 'land' ? 'bg-white shadow-sm text-[#C9A961]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          WITHOUT FLIGHT
        </button>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {selection === 'flight' ? "Full Experience" : "Ground Services Only"}
        </span>
        <span className="bg-green-50 text-green-600 text-[9px] font-black px-2 py-1 rounded-md uppercase">
          {persons} {persons > 1 ? 'Persons' : 'Person'}
        </span>
      </div>

      <button 
        onClick={() => {
          // Navigating to the booking page with dynamic total and persons
          navigate(
            `/package-booking?packageId=${id}&amount=${totalAmount}&adults=${persons}`, 
            { state: { type: selection } }
          );
        }}
        className="w-full bg-[#C9A961] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#b39552] shadow-lg shadow-yellow-100 transition-all mb-6 uppercase tracking-wide active:scale-95"
      >
        PAY & Book Now
      </button>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Base Fare ({persons}x)</span>
          <span className="text-gray-900 font-bold">₹{formatPrice(baseFare * persons)}</span>
        </div>
        
        {/* Dynamic Flight Row */}
        {selection === 'flight' && (
          <div className="flex justify-between items-center text-sm animate-in slide-in-from-left-2 duration-300">
            <span className="text-gray-500 font-medium">Flights ({persons}x)</span>
            <span className="text-gray-900 font-bold">+ ₹{formatPrice(flightPrice * persons)}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Taxes & Fees</span>
          <span className="text-gray-900 font-bold">₹{formatPrice(tax * persons)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-sm text-green-600">
            <span className="font-medium">Special Discount</span>
            <span className="font-bold">- ₹{formatPrice(discount * persons)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed pt-4 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">Total Amount</span>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
            *Total for {persons} {persons > 1 ? 'travelers' : 'traveler'}
          </span>
        </div>
        <span className="text-2xl font-extrabold text-[#2C4A5E]">
          ₹{formatPrice(totalAmount)}
        </span>
      </div>
    </div>
  );
};