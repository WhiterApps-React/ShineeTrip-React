import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tag } from "lucide-react";

interface PricingSidebarProps {
  priceData: any;
  calculatedSummary: any;
  defaultOption?: 'flight' | 'land';
  persons: number;
}

export const PricingSidebar = ({ priceData, calculatedSummary, defaultOption = 'flight', persons }: PricingSidebarProps) => {

  const [selection, setSelection] = useState<'flight' | 'land'>(defaultOption);
  const navigate = useNavigate();
  const { id } = useParams();

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

  // --- DATA EXTRACTION (SAME LOGIC) ---
  const baseFare = Number(priceData?.base_fare || 0);
  const tax = Number(priceData?.tax || 0);
  const reservationCharge = Number(priceData?.reservation_charge || 0);
  const superfastCharge = Number(priceData?.superfast_charge || 0);
  const tatkalFare = Number(priceData?.tatkal_fare || 0);
  const flightPrice = Number(priceData?.flight_price || 0);
  const discountPerPerson = Number(priceData?.discount || 0);

  // --- CALCULATIONS (SAME LOGIC) ---
  const landTotalPerPerson = Number(priceData?.total_price_per_adult || 0);
  const flightTotalPerPerson = Number(priceData?.total_with_flight || 0);
  const grossTotalPerPerson = selection === 'flight' ? flightTotalPerPerson : landTotalPerPerson;
  const totalGrossAmount = grossTotalPerPerson * persons;
  const totalDiscount = discountPerPerson * persons;
  const finalPayableAmount = totalGrossAmount - totalDiscount;

  const formatPrice = (val: number) => {
    return Math.round(val).toLocaleString('en-IN');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-40 h-fit font-sans">

      {/* 1. TOP SECTION: SELECTION TOGGLE */}
      <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
        <button
          onClick={() => setSelection('flight')}
          className={`flex-1 py-2.5 text-[16px] font-opensans rounded-xl transition-all tracking-tighter ${selection === 'flight' ? 'bg-white shadow-sm text-[#C9A961]' : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          WITH FLIGHT
        </button>
        <button
          onClick={() => setSelection('land')}
          className={`flex-1 py-2.5 text-[16px] font-opensans rounded-xl transition-all tracking-tighter ${selection === 'land' ? 'bg-white shadow-sm text-[#C9A961]' : 'text-gray-400 hover:text-gray-600'
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
          navigate(
            `/package-booking?packageId=${id}&amount=${finalPayableAmount}&adults=${persons}`,
            { state: { type: selection } }
          );
        }}
        className="w-full bg-[#C9A961] text-white py-4 rounded-2xl font-opensans text-lg hover:bg-[#b39552] shadow-lg shadow-yellow-100 transition-all mb-6 uppercase tracking-wide active:scale-95"
      >
        PAY & Book Now
      </button>

      {/* 2. MIDDLE SECTION: PRICE BREAKDOWN LIST */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Base Fare ({persons}x)</span>
          <span className="text-gray-900 font-bold">₹{formatPrice(baseFare * persons)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Tax</span>
          <span className="text-gray-900 font-bold">₹{formatPrice(tax * persons)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Reservation Charge</span>
          <span className="text-gray-900 font-bold">₹{formatPrice(reservationCharge * persons)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Superfast Charge</span>
          <span className="text-gray-900 font-bold">₹{formatPrice(superfastCharge * persons)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Tatkal Fare</span>
          <span className="text-gray-900 font-bold">₹{formatPrice(tatkalFare * persons)}</span>
        </div>

        {selection === 'flight' && (
          <div className="flex justify-between items-center text-sm animate-in slide-in-from-left-2 duration-300 pt-2 border-t border-dashed border-gray-100">
            <span className="text-gray-500 font-medium">Flights ({persons}x)</span>
            <span className="text-gray-900 font-bold">+ ₹{formatPrice(flightPrice * persons)}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-[16px] pt-2 border-t border-gray-100">
          <span className="text-gray-900 font-opensans ">Total Price per adult</span>
          <span className="text-gray-900 font-bold">₹{formatPrice(grossTotalPerPerson)}</span>
        </div>
      </div>

      {/* 3. SEPARATE DIV SECTION: COUPONS */}
      {discountPerPerson > 0 && (
        <div className="mb-6 pt-4 border-t border-dashed border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Coupons</h3>
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 bg-gray-200/50 px-2 py-1 rounded-md">
                <Tag className="w-3 h-3 text-red-500 fill-red-500" />
                <span className="text-[10px] font-bold text-gray-700 uppercase">Discount</span>
              </div>
              <span className="text-green-600 font-bold text-sm">
                ₹ {formatPrice(totalDiscount)} OFF
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Pay using Credit Cards EMI to avail the offer with No Cost EMI
            </p>
          </div>
        </div>
      )}

      {/* 4. SEPARATE DIV SECTION: FINAL PRICE FOOTER */}
      <div className="mt-auto border-t border-dashed border-gray-200 pt-5">
        <div className="flex justify-between items-center">

          {/* Left Side: Label */}
          <div className="flex flex-col">
            <span className="font-bold text-gray-800">Total Amount</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
              *Includes all taxes
            </span>
          </div>

          {/* Right Side: Price Box */}
          <div className="flex items-center gap-3">
            {discountPerPerson > 0 && (
              <span className="text-sm font-bold text-gray-400 line-through decoration-gray-400">
                ₹{formatPrice(totalGrossAmount)}
              </span>
            )}

            {/* Green Pill Box for Price */}
            <div className="bg-[#22C55E] text-white px-5 py-2.5 rounded-xl shadow-lg shadow-green-100 flex items-center justify-center">
              <span className="text-[18px] font-opensans  tracking-tight">
                ₹{formatPrice(finalPayableAmount)}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};