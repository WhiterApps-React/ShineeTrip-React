import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
// Required icons for Search Bar
import { MapPin, Calendar, Search, Users, Plus, Minus } from 'lucide-react'; 

import { RoomDetailsModal } from './Rooms_details_page'; 
import RoomCard from '../components/ui/RoomCard'; 
import { AvailabilityCheckModal } from '../components/ui/AvailabilityCheckModal'; 
import HotelReviews from '../components/ui/HotelReviews'; 
import { PolicyModal } from '../components/ui/PolicyModal';
import { ServiceDetailsModal } from '../components/ui/ServiceDetailsModal';

// --- HELPER COMPONENT FOR DROPDOWN ROWS ---
const GuestRow = ({ label, value, min, onMinus, onPlus }: { label: string; value: string; min: number; onMinus: () => void; onPlus: () => void }) => {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-gray-700 font-medium">{label}</span>
  
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinus();
            }}
            className="w-8 h-8 rounded-full border flex items-center justify-center
                       hover:border-[#D2A256] hover:text-[#D2A256]"
          >
            <Minus size={14} />
          </button>
  
          <span className="w-6 text-center font-semibold">{value}</span>
  
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlus();
            }}
            className="w-8 h-8 rounded-full border flex items-center justify-center
                       hover:border-[#D2A256] hover:text-[#D2A256]"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    );
  };

// Main Component: RoomBookingPage
export default function RoomBookingPage() {

    
    // 1. FETCHING LOGIC (hotelId path se, Filters query se)
    const { hotelId } = useParams<{ hotelId: string }>(); // ✅ Path parameter uthaya
    const hotelIdNumber = hotelId ? Number(hotelId) : null;
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);

    // --- Component States ---
    const [hotelData, setHotelData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [services, setServices] = useState<any[]>([]);

    // NOTE: Availability check states
    const [isAvailabilityCheckOpen, setIsAvailabilityCheckOpen] = useState(false);
    const [roomForCheck, setRoomForCheck] = useState<any>(null);

    // --- NEW STATES FOR GUEST PICKER DROPDOWN ---
    const [showGuestPicker, setShowGuestPicker] = useState(false);
    const guestPickerRef = useRef<HTMLDivElement | null>(null);

    const checkinRef = useRef<HTMLInputElement>(null);
    const checkoutRef = useRef<HTMLInputElement>(null);

    // --- Initial Filter Values from URL ---
    const initialLocation = searchParams.get("location") || "";
    const initialCheckIn = searchParams.get("checkIn") || "";
    const initialCheckOut = searchParams.get("checkOut") || "";
    const initialAdults = searchParams.get("adults") || "2";
    const initialChildren = searchParams.get("children") || "0";
    const initialRooms = searchParams.get("rooms") || "1";
    
    // Original filters for API call
    const checkIn = initialCheckIn;
    const checkOut = initialCheckOut;

    // ✅ New States for Editable Fields
    const [currentLocation, setCurrentLocation] = useState(initialLocation);
    const [currentCheckIn, setCurrentCheckIn] = useState(initialCheckIn);
    const [currentCheckOut, setCurrentCheckOut] = useState(initialCheckOut);
    const [currentAdults, setCurrentAdults] = useState(initialAdults);
    const [currentChildren, setCurrentChildren] = useState(initialChildren);
    const [currentRooms, setCurrentRooms] = useState(initialRooms);
        
    // Search data for modal forwarding
    const searchParamData = { 
        location: currentLocation, 
        checkIn: currentCheckIn, 
        checkOut: currentCheckOut, 
        adults: currentAdults, 
        children: currentChildren,
        rooms: currentRooms,
    };
    
    // --- Handlers (Modal & Booking) ---
    const handleOpenPolicyModal = () => { setIsPolicyModalOpen(true); };
    const handleClosePolicyModal = () => { setIsPolicyModalOpen(false); };
    const handleOpenModal = (roomData: any) => { setSelectedRoom(roomData); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedRoom(null); };
    const handleCloseAvailabilityCheck = () => { setIsAvailabilityCheckOpen(false); setRoomForCheck(null); }; 
    
    const handleOpenServiceModal = (serviceData: any) => {
        setSelectedService(serviceData);
        setIsServiceModalOpen(true);
    };
    
  
    // 🟢 CRITICAL FIX: Navigation to Payment Page
    const handleProceedToPayment = (roomData: any) => { 
 
    const params = new URLSearchParams();

    // 1. Basic Search Info (Editable states se lo)
    params.set('location', currentLocation);
    params.set('checkIn', currentCheckIn);
    params.set('checkOut', currentCheckOut);
    params.set('adults', currentAdults);
    params.set('children', currentChildren);
    params.set('rooms', currentRooms);

    // 2. Property & Room Info
    params.set('propertyId', hotelId || ''); 
    params.set('roomId', roomData.id);
    params.set('roomName', roomData.room_type);
    
    // 3. Price Details (roomData se fresh values uthao)
    const retailPrice = parseFloat(roomData.price.retail_price) || 0;
    const taxPrice = parseFloat(roomData.price.retail_tax_price) || 0;
    
    params.set('retailPrice', retailPrice.toFixed(2));
    params.set('taxPrice', taxPrice.toFixed(2));
    
    // 4. Navigate
    navigate(`/booking?${params.toString()}`);
    
    handleCloseAvailabilityCheck(); 
};
    
  
    const handleBookNow = (roomData: any) => { 
        handleProceedToPayment(roomData);
    };
    
    // ✅ NEW: Function to trigger a fresh search
    const handleSearch = () => {
        const newSearchParams = new URLSearchParams({
            location: currentLocation,
            checkIn: currentCheckIn,
            checkOut: currentCheckOut,
            adults: currentAdults,
            children: currentChildren,
            rooms: currentRooms,
        }).toString();
        
       
        navigate(`/hotellists?${newSearchParams}`);
    };
     
    // --- DROPDOWN CLICK OUTSIDE HANDLER ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                guestPickerRef.current &&
                !guestPickerRef.current.contains(event.target as Node)
            ) {
                setShowGuestPicker(false);
            }
        };

        if (showGuestPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showGuestPicker]);

   
useEffect(() => {
    const fetchServices = async () => {
        try {
            const token = sessionStorage.getItem('shineetrip_token');
            const response = await fetch('http://46.62.160.188:3000/service-prod-info', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setServices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch services", err);
            setServices([]); 
        }
    };
    fetchServices();
}, [hotelId]);

useEffect(() => {
    const urlLoc = searchParams.get("location") || "";
    const urlCin = searchParams.get("checkIn") || "";
    const urlCout = searchParams.get("checkOut") || "";
    const urlAdl = searchParams.get("adults") || "2";
    const urlChl = searchParams.get("children") || "0";
    const urlRms = searchParams.get("rooms") || "1";

    setCurrentLocation(urlLoc);
    setCurrentCheckIn(urlCin);
    setCurrentCheckOut(urlCout);
    setCurrentAdults(urlAdl);
    setCurrentChildren(urlChl);
    setCurrentRooms(urlRms); // Sync rooms
}, [searchParams]);
    // --- Data Fetching (Fetch Hotel Details ONLY - Unchanged) ---
    useEffect(() => {
        const fetchHotelData = async () => {
            // ... (Fetching logic remains unchanged)
            if (!hotelId) { setError('No hotel ID provided'); setLoading(false); return; }
            
            const token = sessionStorage.getItem('shineetrip_token');
            
            if (!token) {
                console.error("Authorization Required: Token missing. Redirecting to home/login.");
                setError("You must be logged in to view property details.");
                setLoading(false);
                navigate('/'); 
                return; 
            }
            
            try {
                const response = await fetch(`http://46.62.160.188:3000/properties/${hotelId}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
                
                if (!response.ok) {
                    const errorStatus = response.status;
                    if (errorStatus === 403 || errorStatus === 401) {
                        sessionStorage.removeItem('shineetrip_token'); 
                        navigate('/'); 
                        throw new Error("Session expired. Please log in again.");
                    }
                    throw new Error(`Failed to fetch hotel data: ${errorStatus}`);
                }
                
                const data = await response.json();
                setHotelData(data);
                setLoading(false);
            } catch (err) { 
                setError(err instanceof Error ? err.message : 'Failed to load hotel data'); 
                setLoading(false); 
            }
        };
        fetchHotelData();
    }, [hotelId, navigate]);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    // --- Conditional Render (Pre-JSX Checks) ---
    const token = sessionStorage.getItem('shineetrip_token');    
    // Check if redirect was triggered (token missing but not loading anymore)
    if (!token && !loading && !hotelData) {
        return (
            <div className="min-h-screen bg-gray-50 font-opensans pt-[116px] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Please log in to access this page.</p>
                </div>
            </div>
        );
    }
    
    // 1. Loading State UI
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 font-opensans pt-[116px] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading hotel details...</p>
                </div>
            </div>
        );
    }

    // 2. Error/Data Not Found State UI
    if (error || !hotelData) {
        return (
            <div className="min-h-screen bg-gray-50 font-opensans pt-[116px] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Hotel not found'}</p>
                    <button onClick={() => window.history.back()} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }
    
    // --- Data Calculation (Only runs if data is available) ---
    const hotelImages = hotelData?.images?.map((img: any) => img.image) || []; 
    const roomTypes = hotelData?.roomTypes?.filter((room: any) => room.show_front_office && room.is_active) || [];

    // --- Main Component Render ---
    return (
        <div className="min-h-screen bg-gray-50 font-opensans pt-[116px]">
            {/* FULL SEARCH BAR & PROGRESS STEPS UI */}
            <div className="bg-white border-b border-gray-200 pt-6 sticky top-[90px] z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-3">
                    {/* Search Fields (Now Editable) */}
                   {/* Search Fields */}
                    <div className="
                        flex flex-col sm:flex-row items-stretch sm:items-center 
                        justify-center gap-0 mb-4 
                        border border-gray-300 bg-[#F4F1EC]/20
                        rounded-[24px]
                    ">

                        {/* Location Field */}
                        <div className="flex-1 w-full sm:max-w-[250px] px-4 py-3 sm:border-r border-gray-300">
                            <div className="text-[16px] font-bold text-gray-900 mb-1 uppercase tracking-wide">
                                CITY, AREA OR PROPERTY
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#D2A256]" />
                                <input
                                    type="text"
                                    value={currentLocation}
                                    onChange={(e) => setCurrentLocation(e.target.value)}
                                    className="text-[18px] font-bold text-gray-900 bg-transparent w-full focus:outline-none"
                                    placeholder="Enter location"
                                />
                            </div>
                        </div>

                        {/* Check-in Field - FIXED REF */}
                        <div 
                            className="flex-1 w-full sm:max-w-[200px] px-4 py-3 border-b sm:border-r sm:border-b-0 border-gray-300 cursor-pointer" 
                            onClick={() => checkinRef.current?.showPicker()} // ✅ Click handler
                        >
                            <div className="text-[18px] font-bold text-gray-900 mb-1 uppercase tracking-wide" >
                                CHECK-IN
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#D2A256]" />
                                <input
                                    ref={checkinRef} // ✅ YE MISSING THA
                                    type="date"
                                    value={currentCheckIn}
                                    onChange={(e) => setCurrentCheckIn(e.target.value)}
                                    className="text-[18px] font-bold text-gray-900 bg-transparent w-full focus:outline-none cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Check-out Field - FIXED REF & ONCLICK */}
                        <div 
                            className="flex-1 w-full sm:max-w-[200px] px-4 py-3 border-b sm:border-r sm:border-b-0 border-gray-300 cursor-pointer" 
                            onClick={() => checkoutRef.current?.showPicker()} // ✅ Corrected to checkoutRef
                        >
                            <div className="text-[18px] font-bold text-gray-900  mb-1 uppercase tracking-wide">
                                CHECK-OUT
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#D2A256]" />
                                <input
                                    ref={checkoutRef} // ✅ YE MISSING THA
                                    type="date"
                                    value={currentCheckOut}
                                    onChange={(e) => setCurrentCheckOut(e.target.value)}
                                    className="text-[18px] font-bold text-gray-900 bg-transparent w-full focus:outline-none cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Rooms & Guests */}
                        <div
                            ref={guestPickerRef}
                            className="flex-1 w-full sm:max-w-[320px] px-4 py-3 border-b sm:border-r sm:border-b-0 border-gray-300 cursor-pointer relative"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowGuestPicker(!showGuestPicker);
                            }}
                        >
                            <div className="text-[18px] font-bold text-gray-900 mb-1 uppercase tracking-wide">
                                Room & Guest
                            </div>

                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-[#D2A256]" />
                                <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                                    <span spellCheck={false} className="text-[16px] font-semibold text-gray-900">
                                        {currentRooms} Room{Number(currentRooms) > 1 ? "s" : ""}, {currentAdults} Adult{Number(currentAdults) > 1 ? "s" : ""}
                                        {Number(currentChildren) > 0 ? `, ${currentChildren} Child` : ""}
                                    </span>
                                </div>
                            </div>

                            {/* DROPDOWN */}
                            {showGuestPicker && (
                                <div
                                    className="absolute top-full left-0 mt-4 bg-white rounded-xl shadow-xl p-4 w-[320px] z-[9999] border border-gray-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <GuestRow
                                        label="Rooms"
                                        value={currentRooms}
                                        min={1}
                                        onMinus={() => setCurrentRooms(String(Math.max(1, parseInt(currentRooms) - 1)))}
                                        onPlus={() => setCurrentRooms(String(parseInt(currentRooms) + 1))}
                                    />
                                    <GuestRow
                                        label="Adults"
                                        value={currentAdults}
                                        min={1}
                                        onMinus={() => setCurrentAdults(String(Math.max(1, parseInt(currentAdults) - 1)))}
                                        onPlus={() => setCurrentAdults(String(parseInt(currentAdults) + 1))}
                                    />
                                    <GuestRow
                                        label="Children"
                                        value={currentChildren}
                                        min={0}
                                        onMinus={() => setCurrentChildren(String(Math.max(0, parseInt(currentChildren) - 1)))}
                                        onPlus={() => setCurrentChildren(String(parseInt(currentChildren) + 1))}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Search Button */}
                        <div className="flex-shrink-0 p-2">
                            <button
                                onClick={handleSearch}
                                className="bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors shadow-lg"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>

                    </div>


                    {/* Progress Steps */}

                </div>
            </div>
            <div className='max-w-7xl mx-auto my-5 px-6'>
<div className="flex flex-col md:flex-row justify-between items-center mt-6 pb-2 border-b border-gray-100">
    
    {/* LEFT SIDE: Heading */}
    <h2 className="text-[22px] font-bold text-gray-900">
        Review your booking
    </h2>

    {/* RIGHT SIDE: Progress Steps */}
    <div className="flex items-center gap-4">
        
        {/* Step 1: Active */}
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-medium text-sm">
                1
            </div>
            <span className="font-medium text-sm text-gray-900">Room 1</span>
        </div>

        {/* Connector Line */}
        <div className="w-16 h-px bg-gray-300"></div>

        {/* Step 2: Inactive */}
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-medium text-sm">
                2
            </div>
            <span className="text-gray-500 text-sm">Reservation</span>
        </div>
        
    </div>
</div>
</div>


            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 pb-8">
                {/* Hotel Header */}
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-gray-900">{hotelData?.name}</h1> 
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <span>{hotelData?.city || location}</span> 
                        <span>|</span>
                        <span>{hotelData?.address}</span>
                    </div>
                </div>
                
                {/* <button 
                  onClick={handleOpenPolicyModal}
                  className="mb-6 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                  View Hotel Policies & Rules
                  </button> */}

                {/* Room Types - Using imported RoomCard */}
                <div className="mb-8">
                    {roomTypes.length > 0 ? (
                        roomTypes.map((room: any) => (
                            <RoomCard 
                                key={room.id} 
                                room={room} 
                                hotelImages={hotelImages} 
                                onMoreInfoClick={handleOpenModal} 
                                onBookNowClick={handleBookNow} 
                                services={services}
                                onServiceDetailClick={handleOpenServiceModal}
                                onPolicyClick={handleOpenPolicyModal} 
                            />
                        ))
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <p className="text-gray-600">No rooms available at this time.</p>
                        </div>
                    )}
                </div>

                {/* GUEST FAVORITE REVIEWS SECTION */}
                {hotelIdNumber && <HotelReviews hotelId={hotelIdNumber} />}
                
            </div>
            
            {/* 1. Room Details Modal Render */}
            {selectedRoom && (
                <RoomDetailsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    roomName={selectedRoom.room_type || 'Room Details'}
                    roomImages={hotelImages} 
                    roomData={selectedRoom}               />
            )}
            
            {/* 2. Availability Check Modal Render */}
            {roomForCheck && (
                <AvailabilityCheckModal
                    isOpen={isAvailabilityCheckOpen}
                    onClose={handleCloseAvailabilityCheck}
                    roomData={roomForCheck}
                    searchParams={searchParamData}
                    onProceed={handleProceedToPayment}
                />
            )}
            {/* 3. ✅ NEW: Policy Modal Render */}
            {isPolicyModalOpen && hotelData && (
                <PolicyModal
                    isOpen={isPolicyModalOpen}
                    onClose={handleClosePolicyModal}
                    hotelName={hotelData.name || 'Selected Property'}
                    policiesHTML={hotelData.policies || ''}       // Data source: hotelData
                    refundRulesHTML={hotelData.refundRules || ''} // Data source: hotelData
                />
            )}

            <ServiceDetailsModal 
                isOpen={isServiceModalOpen}
                onClose={() => setIsServiceModalOpen(false)}
                serviceData={selectedService}
            />
        </div>
    );
}