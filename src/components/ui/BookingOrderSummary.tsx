import React, { useEffect, useState } from 'react';
import { MapPin, X, CheckCircle } from 'lucide-react';

interface BookingOrderSummaryProps {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  adults: string;
  children: string;
  roomName: string;
  roomCount: string;
}

const BookingOrderSummary: React.FC<BookingOrderSummaryProps> = ({
  propertyId,
  checkIn,
  checkOut,
  adults,
  children,
  roomName,
  roomCount
}) => {
  const [hotelDetails, setHotelDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInclusionModal, setShowInclusionModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // --- Helper Functions ---

  const getNights = () => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/,/g, '');
  };

  // Convert "15:00:00" to "3 PM"
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h} ${ampm}`;
  };

  // --- Data Fetching ---

  useEffect(() => {
    const fetchHotelInfo = async () => {
      if (!propertyId) return;
      try {
        const token = sessionStorage.getItem('shineetrip_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await fetch(`http://46.62.160.188:3000/properties/${propertyId}`, {
          headers: headers as any
        });

        if (response.ok) {
          const data = await response.json();
          setHotelDetails(data);
        }
      } catch (error) {
        console.error("Failed to fetch hotel summary info", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotelInfo();
  }, [propertyId]);

  if (loading) return <div className="p-4 bg-white rounded-lg animate-pulse h-64">Loading Summary...</div>;

  // --- Derived Data ---

  // Image
  const hotelImage = hotelDetails?.images?.[0]?.image || "https://placehold.co/600x400?text=Hotel+Image";

  // Check-in/Check-out Times (Dynamic from API)
  const checkInTime = hotelDetails?.checkIn ? formatTime(hotelDetails.checkIn) : "2 PM";
  const checkOutTime = hotelDetails?.checkOut ? formatTime(hotelDetails.checkOut) : "11 AM";

  // Location
  const locationString = hotelDetails ? `${hotelDetails.address}, ${hotelDetails.city}` : "Location info";

  // Room Specific Data (Try to find the selected room in the fetched property details)
  const selectedRoomData = hotelDetails?.roomTypes?.find((r: any) => r.room_type === roomName);
  
  // Inclusions: Use room specific short description (e.g., "Breakfast included") or fallback to property features
  const roomInclusionText = selectedRoomData?.short_description || "Room Only";
  const propertyFeatures = hotelDetails?.selectedFeatures || [];

  // --- Render ---

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">

        {/* 1. Hotel Header Section */}
        <div className="p-4 flex gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {hotelDetails?.name || "Hotel Name"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
              <MapPin size={12} className="mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{locationString}</span>
            </p>
          </div>
          <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={hotelImage}
              alt="Hotel"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 2. Dates & Guests Grey Box */}
        <div className="bg-gray-100 mx-4 p-4 rounded-lg flex items-center justify-between text-sm">
          {/* Check In */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Check IN &nbsp; {checkInTime}</span>
            <span className="font-bold text-gray-800 text-sm mt-1">{formatDisplayDate(checkIn)}</span>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 mx-2"></div>

          {/* Check Out */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Check OUT &nbsp; {checkOutTime}</span>
            <span className="font-bold text-gray-800 text-sm mt-1">{formatDisplayDate(checkOut)}</span>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 mx-2"></div>

          {/* Summary Count */}
          <div className="flex flex-col items-end">
            <span className="font-bold text-gray-800 text-sm">
              {getNights()} Night | {adults} Adults
            </span>
            <span className="text-xs text-gray-600">{roomCount} Room</span>
          </div>
        </div>

        {/* 3. Room Details Section */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-gray-800 line-clamp-1">{roomName}</h4>
            <button 
              onClick={() => setShowInclusionModal(true)}
              className="text-xs font-bold text-blue-600 hover:underline shrink-0 ml-2"
            >
              See Inclusion
            </button>
          </div>
          <p className="text-sm font-semibold text-gray-700">{adults} Adult</p>
          <ul className="mt-2 space-y-1">
             {/* Dynamic Inclusion Text */}
            <li className="text-xs text-gray-500 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
              {roomInclusionText}
            </li>
            {/* Show 'No meals' if inclusion text suggests it, or general disclaimer */}
            {(!roomInclusionText.toLowerCase().includes('breakfast') && !roomInclusionText.toLowerCase().includes('meal')) && (
               <li className="text-xs text-gray-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                 No meals included
               </li>
            )}
          </ul>
        </div>

        {/* 4. Policies Section */}
        <div className="p-4 bg-white">
          <div className="mb-2">
            <span className="text-xs font-bold text-gray-800">Booking Policies</span>
          </div>
          <div className="text-xs text-gray-500 leading-relaxed line-clamp-3">
             {/* Show a snippet of plain text from policy if possible, or generic text */}
             Please review the cancellation and refund rules before proceeding.
          </div>
          <button 
             onClick={() => setShowPolicyModal(true)}
             className="mt-3 text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            Cancellation & Policy Details
          </button>
        </div>

      </div>

      {/* --- MODALS --- */}

      {/* Inclusions Modal */}
      {showInclusionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInclusionModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
            <button onClick={() => setShowInclusionModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Room Inclusions & Features</h3>
            
            <div className="space-y-4">
              {/* Specific Room Description */}
              <div className="bg-blue-50 p-4 rounded-lg">
                 <h4 className="font-bold text-sm text-blue-800 mb-1">Package</h4>
                 <p className="text-sm text-blue-700">{roomInclusionText}</p>
              </div>

              {/* Property Features List */}
              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-2">Property Amenities</h4>
                <div className="grid grid-cols-2 gap-2">
                  {propertyFeatures.length > 0 ? (
                    propertyFeatures.map((feature: any) => (
                      <div key={feature.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} className="text-green-500" />
                        {feature.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No specific amenities listed.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policies Modal (HTML Content) */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPolicyModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[80vh] overflow-y-auto">
            <button onClick={() => setShowPolicyModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Hotel Policies</h3>
            
            <div className="space-y-6 text-sm text-gray-600">
              {/* Refund Rules */}
              {hotelDetails?.refundRules && (
                <div>
                   <h4 className="font-bold text-gray-900 mb-2 text-base">Refund & Cancellation Rules</h4>
                   <div 
                     className="prose prose-sm max-w-none text-gray-600 [&>b]:text-gray-800"
                     dangerouslySetInnerHTML={{ __html: hotelDetails.refundRules }} 
                   />
                </div>
              )}

              {/* General Policies */}
              {hotelDetails?.policies && (
                <div>
                   <h4 className="font-bold text-gray-900 mb-2 text-base">Property Policies</h4>
                   <div 
                     className="prose prose-sm max-w-none text-gray-600 [&>ul]:list-disc [&>ul]:pl-5 [&>p]:mb-2"
                     dangerouslySetInnerHTML={{ __html: hotelDetails.policies }} 
                   />
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setShowPolicyModal(false)}
                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default BookingOrderSummary;