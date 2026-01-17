"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Star,
  Check,
  MapPin,
  Users,
  Calendar,
  Search,
  SlidersHorizontal,
  X, 
  Wifi,
  Minus,
  Plus,
} from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewsCount: number;
  images: string[];
  amenities: string[];
  price: number;
  originalPrice: number;
  taxes: number;
  description: string;
}

// Helper to format date to YYYY-MM-DD for input value/default
const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const HotelListingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ✅ Editable States
  const [currentLocation, setCurrentLocation] = useState(
    searchParams.get("location") || "" 
  );
  const [currentCheckIn, setCurrentCheckIn] = useState(
    searchParams.get("checkIn") || getTodayDateString()
  );
  const [currentCheckOut, setCurrentCheckOut] = useState(
    searchParams.get("checkOut") || getTodayDateString()
  );
  const [currentAdults, setCurrentAdults] = useState(
    searchParams.get("adults") || "2"
  );
  const [currentChildren, setCurrentChildren] = useState(
    searchParams.get("children") || "0"
  );
  const [rooms, setRooms] = useState(
    searchParams.get("rooms") || "1"
  );

  const [sortBy, setSortBy] = useState("Most Popular");
  const [selectedImages, setSelectedImages] = useState<{ [key: number]: number }>({});
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
    
  // 💡 PAGINATION STATES:
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false); 
  const limit = 10 // API limit set kar diya

  // API Fetch parameters
  const location = searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adults = searchParams.get("adults") || "2";
  const children = searchParams.get("children") || "0";

  const sortOptions = [
    "Most Popular",
    "Price- Low to high",
    "Price- High to low",
    "Best Rated",
    "Lowest Price & Best Rated",
  ];

  // ✅ Function to handle navigation with new search parameters
  const handleSearch = () => {
  setLoading(true);
    setFetchError(null);

    const searchLoc = currentLocation || searchParams.get("location") || "";
    const searchCin = currentCheckIn; 
    const searchCout = currentCheckOut;
    const searchRooms = rooms || searchParams.get("rooms") || "1";

    const today = getTodayDateString();
    if (currentCheckIn < today) {
      alert("Check-in date cannot be in the past. Please select today or a future date.");
      return;
    }
   
    if (currentCheckOut <= currentCheckIn) {
        alert("Check-out date must be after Check-in date.");
        return;
    }

const newSearchParams = new URLSearchParams({
      location: searchLoc,
      checkIn: searchCin,
      checkOut: searchCout,
      adults: currentAdults,
      children: currentChildren,
      rooms: String(searchRooms), // Ensure rooms is added here
    }).toString();

    navigate(`/hotellists?${newSearchParams}`);
  };

// ----------------------------------------------------------------------
// 🔄 Function 1: fetchHotels - INITIAL SEARCH (Page 1 Only - Overwrite)
// ----------------------------------------------------------------------
  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setPage(1); // Page reset here
    

    try {
      const token = sessionStorage.getItem("shineetrip_token");
      if (!token) {
        console.warn("No token found — please log in first.");
        setLoading(false);
        setHasSearched(true);
        return;
      }

      const queryParams = new URLSearchParams();
      const currentUrlLoc = searchParams.get("location") || "";
    const currentUrlCin = searchParams.get("checkIn") || "";
    const currentUrlCout = searchParams.get("checkOut") || "";
    const currentUrlAdl = searchParams.get("adults") || "2";
    const currentUrlChl = searchParams.get("children") || "0";
    const currentUrlRms = searchParams.get("rooms") || "1";

    if (currentUrlLoc) queryParams.append("city", currentUrlLoc); 
    if (currentUrlCin) queryParams.append("checkIn", currentUrlCin);
    if (currentUrlCout) queryParams.append("checkOut", currentUrlCout);
    if (currentUrlAdl) queryParams.append("adults", currentUrlAdl);
    if (currentUrlChl) queryParams.append("children", currentUrlChl);
    queryParams.append("rooms", currentUrlRms);

    queryParams.append("page", "1");
queryParams.append("limit", limit.toString());

      const apiUrl = `http://46.62.160.188:3000/properties/search?${queryParams.toString()}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          setFetchError(errorData.message || `Failed to fetch hotels: ${response.status}`);
        } catch {
          setFetchError(`Failed to fetch hotels: ${response.status}`);
        }
        throw new Error(`Failed to fetch hotels: ${response.status} ${errorText}`);
      }

      const responseData = await response.json(); 
      const data = responseData.data || [];
      const meta = responseData.meta || {}; 
console.log("META FROM API:", meta);


      // FIX 1: Map function is now generating an array of Promises for parallel fetching
      const hotelPromises = (Array.isArray(data) ? data : [])
        .map(async (item: any) => { 
           const hotel = item;
                const roomType = hotel.roomTypes && hotel.roomTypes.length > 0 ? hotel.roomTypes[0] : null;
                const roomDetails = roomType?.price;

                if (!roomDetails) return null;
          
          // --- Fetch Dynamic Reviews Data (Individual Hotel) ---
          const summaryUrl = `http://46.62.160.188:3000/ratings/average/summary?propertyId=${hotel.id}`;
          let reviewsCount = 0; 
          let avgRating = parseFloat(hotel.rating) || 4.2; 
          
          try {
              const reviewResponse = await fetch(summaryUrl, { 
                  headers: { 'Authorization': `Bearer ${token}` } 
              });

              if (reviewResponse.ok) {
                  const reviewData = await reviewResponse.json();
                  if (reviewData) {
                      reviewsCount = parseInt(reviewData.totalReviews, 10) || 0; 
                      avgRating = parseFloat(reviewData.averageRating) || avgRating; 
                  }
              }
          } catch (e) {
              console.error(`Failed to fetch reviews for hotel ${hotel.id}:`, e);
          }
          
          return {
            id: String(hotel.id),
            name: hotel.name || "",
            location: `${hotel.city || ""}, ${hotel.country || ""}`.trim(),
            rating: avgRating, 
            reviewsCount: reviewsCount, 
            images:
              hotel.images
                ?.map((img: any) => img.image)
                .filter((url: string | null) => url && typeof url === "string") || [],
            amenities: hotel.selectedFeatures?.map((f: any) => f.name) || ["Gym", "Restaurant"],
            price: parseFloat(roomDetails.retail_price || 8999),
            originalPrice: parseFloat(roomDetails?.totalPricePerNight || 8999),
            taxes: parseFloat(roomDetails?.taxAmount || 144),
            description: hotel.short_description || hotel.description || "",
          };
        });
      
      // FIX 1: Wait for all Promises to resolve (all hotel and review fetches)
      const resolvedHotelList = await Promise.all(hotelPromises); 

      const finalHotelList = resolvedHotelList.filter((item): item is Hotel => item !== null);

      setHotels(finalHotelList); // Overwrite old data
      setHasMore(meta.hasNextPage || false); // HasMore set kiya

      // Initialize selected images
      const initialImages: { [key: number]: number } = {};
      finalHotelList.forEach((_: any, index: number) => { 
        initialImages[index] = 0;
      });
      setSelectedImages(initialImages);
    } catch (error) {
      console.error("Error fetching hotels:", error);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, [location, checkIn, checkOut, adults, children, navigate, limit, searchParams]);


// ----------------------------------------------------------------------
// ➕ Function 2: fetchMoreHotels - LOAD MORE (Separate function, NOT useCallback)
// ----------------------------------------------------------------------
const fetchMoreHotels = async (nextPage: number) => {
    setLoading(true);

    try {
        const token = sessionStorage.getItem("shineetrip_token");
        if (!token) {
            setLoading(false);
            return;
        }

        const queryParams = new URLSearchParams();
        if (location) queryParams.append("city", location);
        if (checkIn) queryParams.append("checkIn", checkIn);
        if (checkOut) queryParams.append("checkOut", checkOut);
        if (adults) queryParams.append("adults", adults);
        if (children) queryParams.append("children", children);
        
        // Next Page aur Limit set karna
        queryParams.append("page", nextPage.toString()); 
        queryParams.append("limit", limit.toString());

        const apiUrl = `http://46.62.160.188:3000/properties/search?${queryParams.toString()}`;
        
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (!response.ok) {
            console.error("Failed to fetch more hotels:", response.status);
            setLoading(false);
            return;
        }

        const responseData = await response.json(); 
        const data = responseData.data || [];
        const meta = responseData.meta || {};

        // Mapping logic ko reuse karna (review fetching same rahega)
        const hotelPromises = (Array.isArray(data) ? data : [])
            .map(async (item: any) => { 
                const hotel = item;
                const roomType = hotel.roomTypes && hotel.roomTypes.length > 0 ? hotel.roomTypes[0] : null;
                const roomDetails = roomType?.price;

                if (!roomDetails) return null;
                // --- Review fetching logic (same as in fetchHotels) ---
                const summaryUrl = `http://46.62.160.188:3000/ratings/average/summary?propertyId=${hotel.id}`;
                let reviewsCount = 0; 
                let avgRating = parseFloat(hotel.rating) || 4.2; 
                
                try {
                    const reviewResponse = await fetch(summaryUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (reviewResponse.ok) {
                        const reviewData = await reviewResponse.json();
                        if (reviewData) {
                            reviewsCount = parseInt(reviewData.totalReviews, 10) || 0; 
                            avgRating = parseFloat(reviewData.averageRating) || avgRating; 
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch reviews for hotel ${hotel.id}:`, e);
                }
                
                return {
                    id: String(hotel.id),
                    name: hotel.name || "",
                    location: `${hotel.city || ""}, ${hotel.country || ""}`.trim(),
                    rating: avgRating, 
                    reviewsCount: reviewsCount, 
                    images: hotel.images?.map((img: any) => img.image).filter((url: string | null) => url && typeof url === "string") || [],
                    amenities: hotel.selectedFeatures?.map((f: any) => f.name) || ["Gym", "Restaurant"],
                    price: parseFloat(roomDetails.retail_price || 8999),
                    originalPrice: parseFloat(roomDetails?.totalPricePerNight || 8999),
                    taxes: parseFloat(roomDetails?.taxAmount || 144),
                    description: hotel.short_description || hotel.description || "",
                };
            });

        const resolvedHotelList = await Promise.all(hotelPromises); 
        const finalHotelList = resolvedHotelList.filter((item): item is Hotel => item !== null);

        // State Update: Append naye hotels
        setHotels((prev) => [...prev, ...finalHotelList]);
        setHasMore(meta.hasNextPage || false); 
        
        // Naye images ke liye selectedImages update karna
        const newInitialImages: { [key: number]: number } = {};
        const currentHotelCount = hotels.length; // hotels.length will give the starting index for new data
        finalHotelList.forEach((_, index) => {
            newInitialImages[currentHotelCount + index] = 0;
        });
        setSelectedImages(prev => ({ ...prev, ...newInitialImages }));

    } catch (error) {
        console.error("Error fetching more hotels:", error);
    } finally {
        setLoading(false);
    }
};

// Load More button ka click handler
const handleLoadMore = () => {
    // Check if loading is already in progress
    if (loading) return; 
    
    const nextPage = page + 1;
    setPage(nextPage);
    // Asynchronous call to fetchMoreHotels
    fetchMoreHotels(nextPage); 
};

  // Initial Fetch Effect (Unchanged)
  useEffect(() => {
    fetchHotels(); // Calls the fetchHotels (Page 1 Only) function
  }, [fetchHotels, searchParams]); // searchParams dependency added

  // UI Rendering ke pehle, total reviews calculate karein
  
  const totalReviewsCount = hotels.reduce((sum, hotel) => sum + hotel.reviewsCount, 0);
  // --------------------------------------------------
// Sorting Logic Effect (Unchanged)
// --------------------------------------------------
useEffect(() => {
// ... (Sorting logic remains the same)
  if (!hotels.length) return;

  let sorted = [...hotels];

  switch (sortBy) {
    case "Price- Low to high":
      sorted.sort((a, b) => a.price - b.price);
      break;

    case "Price- High to low":
      sorted.sort((a, b) => b.price - a.price);
      break;

    case "Best Rated":
      sorted.sort((a, b) => b.rating - a.rating);
      break;

    case "Lowest Price & Best Rated":
      sorted.sort((a, b) => {
        if (a.price === b.price) return b.rating - a.rating;
        return a.price - b.price;
      });
      break;

    default:
      break;
  }

  setHotels(sorted);
}, [sortBy]);


  // Sync internal states when URL changes (Unchanged)
// Sync internal states when URL changes
useEffect(() => {
  // console.log("Syncing states with URL...");
  const urlLoc = searchParams.get("location") || "";
  const urlCin = searchParams.get("checkIn") || getTodayDateString();
  const urlCout = searchParams.get("checkOut") || getTodayDateString();
  const urlAdl = searchParams.get("adults") || "2";
  const urlChl = searchParams.get("children") || "0";
  const urlRms = searchParams.get("rooms") || "1";

  // 💡 Ye saari states update karna zaroori hai
  setCurrentLocation(urlLoc);
  setCurrentCheckIn(urlCin);
  setCurrentCheckOut(urlCout);
  setCurrentAdults(urlAdl);
  setCurrentChildren(urlChl);
  setRooms(urlRms); // Isse rooms gayab nahi honge
}, [searchParams]); // Jab bhi URL badle, ye states ko fresh kar dega

  // Scroll to top when component mounts (Unchanged)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleImageSelect = (hotelIndex: number, imageIndex: number) => {
    setSelectedImages((prev) => ({
      ...prev,
      [hotelIndex]: imageIndex,
    }));
  };

  const handleHotelClick = (hotelId: string) => {
    const currentSearchParams = new URLSearchParams(searchParams.toString()); 

    // 💡 FIX 2 (CRITICAL): Yahan propertyId ko query parameter mein add karein
    currentSearchParams.set('propertyId', hotelId);
    if (!currentSearchParams.has('rooms')) {
        currentSearchParams.set('rooms', String(rooms));
    }
    navigate(`/room-booking/${hotelId}?${currentSearchParams}`);
  };
  
  // ===============================================
  // VIEW ALL & SEARCH LOGIC (Unchanged)
  // ===============================================
  
  // Helper to check if location is currently empty or not
  const isLocationEmpty = currentLocation.trim() === "";
  
  // Function to navigate to View All Hotels (No location filter)
const handleViewAllHotels = () => {
    // 1. Safe dates: Check-in aaj ki, aur Check-out kal ki (Kam se kam 1 din ka gap)
    const safeCheckIn = getTodayDateString(); 
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    const safeCheckOut = `${yyyy}-${mm}-${dd}`; 

    const searchQuery = new URLSearchParams({
        location: '', 
        checkIn: safeCheckIn,
        checkOut: safeCheckOut,
        adults: currentAdults,
        children: currentChildren,
        rooms: rooms || '1', // 💡 YE ZAROORI HAI: Rooms parameter add karo
    }).toString();
    
    navigate(`/hotellists?${searchQuery}`);
};


  const handleSearchClick = () => {
    const token = sessionStorage.getItem("shineetrip_token");
    if (!token) {
        alert("Please log in to search for hotels.");
        return;
    }

    // Agar location khali hai, toh View All logic chalao
    if (isLocationEmpty) {
        handleViewAllHotels();
    } else {
        // Agar location filled hai, toh detailed search chalao (handleSearch)
        handleSearch();
    }
  };
  // ===============================================
  // END NEW LOGIC BLOCK
  // ===============================================


const SearchBar = (
    <div className="bg-white border-b border-gray-200 pt-6 sticky top-[64px] sm:top-[90px] z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        
        {/* Search Fields - FULLY RESPONSIVE */}
        <div className="
             flex flex-col sm:flex-row items-stretch sm:items-center 
             justify-center gap-0 mb-4 rounded-lg overflow-hidden 
             border border-gray-300 bg-[#F4F1EC]/20
             rounded-tl-[24px] rounded-bl-[24px] 
             rounded-tr-[24px] rounded-br-[24px] 
        ">
          
          {/* Location Field */}
          <div className="flex-1 w-full sm:max-w-[250px] bg-[#F4F1EC]/20 px-4 py-3 rounded-tl-[24px] rounded-bl-[24px]  sm:border-r sm:border-b-0 border-gray-300">
            <div className="text-[14px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              CITY, AREA OR PROPERTY
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D2A256]" />
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="text-base font-[700] text-[18px] text-gray-900 bg-transparent w-full focus:outline-none"
                placeholder="Enter location"
              />
            </div>
          </div>

          {/* Check-in Field */}
          <div className="flex-1 w-full sm:max-w-[200px] bg-[#F4F1EC]/20  px-4 py-3 border-b sm:border-r sm:border-b-0 border-gray-300">
            <div className="text-[14px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">CHECK-IN</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D2A256]" />
              <input
                type="date"
                value={currentCheckIn}
                onChange={(e) => setCurrentCheckIn(e.target.value)}
                className="text-base font-[700] text-[18px] text-gray-900 bg-transparent w-full focus:outline-none"
              />
            </div>
          </div>

          {/* Check-out Field */}
          <div className="flex-1 w-full sm:max-w-[200px] bg-[#F4F1EC]/20 px-4 py-3 border-b sm:border-r sm:border-b-0 border-gray-300">
            <div className="text-[14px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">CHECK-OUT</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D2A256]" />
              <input
                type="date"
                value={currentCheckOut}
                onChange={(e) => setCurrentCheckOut(e.target.value)}
                className="text-base font-[700] text-[18px] text-gray-900 bg-transparent w-full focus:outline-none"
              />
            </div>
          </div>

          {/* Room & Guest Field */}
          {/* Note: Isme right border sirf sm:screen par chahiye, mobile par nahi, isliye border-r hataya */}
        {/* 🟢 UPDATED: ROOMS & GUESTS (With Rooms and Better Design) */}
<div className="flex-1 w-full sm:max-w-[320px] bg-[#F4F1EC]/20 px-4 py-3 border-b sm:border-r sm:border-b-0 border-gray-300">
  <div className="text-[14px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">
    ROOMS & GUESTS
  </div>
  <div className="flex items-center gap-3">
    <Users className="w-4 h-4 text-[#D2A256]" />
    
    <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
      {/* Rooms Section */}
      <div className="flex items-center gap-1 bg-white/40 px-2 py-1 rounded-md">
        <button 
          onClick={(e) => {e.preventDefault(); setRooms(String(Math.max(1, parseInt(rooms) - 1)))}}
          className="hover:text-[#D2A256] transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="min-w-[20px] text-center">{rooms || 1}</span>
        <button 
          onClick={(e) => { e.preventDefault();setRooms(String(parseInt(rooms) + 1))}}
          className="hover:text-[#D2A256] transition-colors"
        >
          <Plus size={12} />
        </button>
        <span className="text-[10px] text-gray-500 ml-0.5">Rm</span>
      </div>

      <span className="text-gray-400">|</span>

      {/* Adults Section */}
      <div className="flex items-center gap-1 bg-white/40 px-2 py-1 rounded-md">
        <button 
          onClick={(e) => { e.preventDefault(); setCurrentAdults(String(Math.max(1, parseInt(currentAdults) - 1)))}}
          className="hover:text-[#D2A256] transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="min-w-[20px] text-center">{currentAdults}</span>
        <button 
          onClick={(e) => { e.preventDefault(); setCurrentAdults(String(parseInt(currentAdults) + 1))}}
          className="hover:text-[#D2A256] transition-colors"
        >
          <Plus size={12} />
        </button>
        <span className="text-[10px] text-gray-500 ml-0.5">Ad</span>
      </div>

      <span className="text-gray-400">|</span>

      {/* Children Section */}
      <div className="flex items-center gap-1 bg-white/40 px-2 py-1 rounded-md">
        <button 
          onClick={(e) => { e.preventDefault(); setCurrentChildren(String(Math.max(0, parseInt(currentChildren) - 1)))}}
          className="hover:text-[#D2A256] transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="min-w-[20px] text-center">{currentChildren}</span>
        <button 
          onClick={(e) => { e.preventDefault(); setCurrentChildren(String(parseInt(currentChildren) + 1))}}
          className="hover:text-[#D2A256] transition-colors"
        >
          <Plus size={12} />
        </button>
        <span className="text-[10px] text-gray-500 ml-0.5">Ch</span>
      </div>
    </div>
  </div>
</div>

          {/* Search Button - Yellow/Gold color as in Figma */}
          <div className="bg-[#F4F1EC]/20 flex-shrink-0 p-2">
            <button
              onClick={handleSearchClick}
              className="bg-black text-white p-3 rounded-full hover:bg-[#c2934b] transition-colors shadow-lg"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sort Options / Mobile Filter Toggle */}
        {/* OUTER WRAPPER → poora block center */}
<div className="flex justify-center mt-2">
  
  {/* INNER WRAPPER → equal spacing + alignment */}
  <div className="flex items-center gap-6 flex-wrap justify-center">
    
    {/* 1. Sort Label (Desktop Only) */}
    <div className="hidden sm:flex items-center gap-2 text-gray-900 font-[700] text-sm">
      <SlidersHorizontal className="w-4 h-4 text-[#D2A256]" />
      <span>Sort By:</span>
    </div>

    {/* 2. Sort Options Buttons (Desktop Only) */}
    <div className="hidden sm:flex gap-4 flex-wrap justify-center">
      {sortOptions.map((option) => (
        <button
  key={option}
  onClick={() => setSortBy(option)}
  className="
    px-4 py-1.5 rounded-full text-[15px] font-[600] border
    bg-[#F4F1EC]/20 text-gray-700 border-[#E0DACF]
    hover:bg-[#D2A256] hover:text-white hover:border-[#D2A256]
    transition-all duration-200
  "
>
  {option}
</button>
      ))}
    </div>

    {/* 3. Mobile Filter/Sort Button (Mobile Only) */}
    <button
      onClick={() => setIsSideBarOpen(true)}
      className="sm:hidden flex items-center gap-2 px-5 py-2 bg-[#D2A256] text-white rounded-lg font-semibold"
    >
      <SlidersHorizontal className="w-4 h-4" />
      Sort & Filter
    </button>

  </div>
</div>

        
        {/* Temporary Button for Figma Style (Hata diya gaya hai jaisa aapne pichle response mein suggest kiya tha) */}
      </div>
    </div>
);

  // --- Rendering UI ---

  // Handle Loading State
  if (loading && !hasSearched) { // FIX: Only show full loading screen initially
    return (
      <div className="min-h-screen bg-gray-50 font-opensans pt-[116px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for properties...</p>
        </div>
      </div>
    );
  }
  
 
  
  // Handle No Results State / Error State
  if (hasSearched && hotels.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 font-opensans pt-[116px]">
        {SearchBar}
        <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Showing Properties in {location || "All Destinations"}</h1>
            <div className="text-center p-10 bg-white rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-red-600 mb-4">
                    No Properties Found
                </h2>
                <p className="text-gray-600">
                    Sorry, we could not find any properties in {location || "this destination"} for your selected dates.
                </p>
                {fetchError && <p className="text-red-500 mt-2 text-sm">Error Details: {fetchError}</p>}
            </div>
        </div>
      </div>
    );
  }
// Rendering section mein:
if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 pt-[116px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D2A256] mx-auto mb-4"></div>
        <p className="text-gray-600">Updating results...</p>
      </div>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gray-50 font-opensans pt-[116px]">
      {SearchBar}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Results Header */}
        <div className="mb-6">
          <h1 className="text-[24px] font-[600] text-gray-900">
            Showing Properties in {location || "All Destinations"}
          </h1>
          <span className="text-sm text-gray-600">
{/*              {totalReviewsCount.toLocaleString()} Ratings found  */}
          </span> 
        </div>

        {/* Hotel Cards - EXACT FIGMA LAYOUT */}
        <div className="space-y-6">
          {hotels.map((hotel, index) => {
            const currentImageIndex = selectedImages[index] || 0;
            const discountAmount = hotel.originalPrice - hotel.price;

            return (
              <div
                key={hotel.id}
                onClick={() => handleHotelClick(hotel.id)}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex flex-col  md:flex-row">
                  {/* Image Section */}
<div className="md:w-[380px] flex-shrink-0 p-4">
  
  {/* Main Image */}
  <div className="relative h-[240px] md:h-[260px] rounded-xl overflow-hidden mb-3 group">
    <img
      src={
        hotel.images[currentImageIndex] ||
        "https://placehold.co/550x320/cccccc/333333?text=No+Image"
      }
      alt={hotel.name}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  </div>

  {/* Thumbnails BELOW main image */}
  {hotel.images.length > 1 && (
    <div className="flex gap-2 overflow-x-auto items-center scrollbar-hide">
      {hotel.images.slice(0, 6).map((img, imgIndex) => (
        <button
          key={imgIndex}
          onClick={(e) => {
            e.stopPropagation();
            handleImageSelect(index, imgIndex);
          }}
          className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
            currentImageIndex === imgIndex
              ? "border-[#22C55E] opacity-100"
              : "border-transparent opacity-60 hover:opacity-100"
          }`}
        >
          <img
            src={img}
            alt={`Thumbnail ${imgIndex + 1}`}
            className="w-full h-full object-cover block"
          />
        </button>
      ))}
    </div>
  )}
</div>


                  {/* Content Section - EXACT FIGMA STRUCTURE */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row h-full gap-6">
                      {/* Left Column: Hotel Details */}
                      <div className="flex-1 ">
                        {/* Hotel Name and Location */}
                        <h2 className="text-[24px] font-[600] text-gray-900 mb-1">
                          {hotel.name}
                        </h2>
                        {/* FIX 3: ADDED DYNAMIC RATING AND REVIEW COUNT DISPLAY HERE */}
                        {/* <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                            i < Math.round(hotel.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-700 font-semibold">{hotel.rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">| {hotel.reviewsCount.toLocaleString()} Reviews</span>
                        </div> */}
                        {/* END FIX 3 */}
                        
                        <div className="flex items-center gap-2 text-gray-600 mb-4">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                                {hotel.location || location} 
                                {hotel.location && ' | 1.5Km drive to city center'} {/* Optional static distance re-added */}
                            </span>
                        </div>

                        {/* Amenities - Simple checkboxes like Figma */}
  <div className="flex flex-wrap gap-3 mb-4">
    {hotel.amenities.slice(0, 3).map((amenity, idx) => (
      <div
        key={idx}
        className="px-4 py-1.5 text-sm text-gray-700 rounded-full border border-gray-300 bg-white"
      >
        {amenity}
      </div>
    ))}
  </div>

                        {/* Features List - EXACT FIGMA STYLE */}
                        <div className=" mt-44 space-y-3">

                          {/* Additional features from API if available */}
                          {hotel.amenities.slice(3, 6).map((amenity, idx) => (
                            <div key={idx} className="flex  items-center gap-3">
                              <svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle
    cx="12"
    cy="12"
    r="11"
    stroke="#22C55E"
    strokeWidth="2"
  />
  <path
    d="M7 12.5L10.5 16L17 9"
    stroke="#22C55E"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>

                              <span className="text-gray-700">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Column: Price and Booking - EXACT FIGMA STYLE */}
                      <div className="lg:w-[300px] border-l flex flex-col justify-between h-full border-gray-200 pl-6">
                        {/* Coupon Section - RED BADGE LIKE FIGMA */}
<div className="mb-6">
  {/* Coupons Heading */}
  <h3 className="text-[18px] font-semibold text-gray-900 mb-3">
    Coupons
  </h3>

  {/* Coupon Card */}
  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
    
    {/* Top Row: Discount chip + amount */}
    <div className="flex items-center justify-between mb-2">
      
      {/* Discount Chip */}
      <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-800">
        <svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="#EF4444"
  xmlns="http://www.w3.org/2000/svg"
>
  <path d="M3 12.5V7a2 2 0 0 1 2-2h5.5a2 2 0 0 1 1.4.6l7.5 7.5a2 2 0 0 1 0 2.8l-4.2 4.2a2 2 0 0 1-2.8 0l-7.5-7.5a2 2 0 0 1-.6-1.4z"/>
  <circle cx="8" cy="9" r="1.5" fill="white"/>
</svg>

        <span>Discount</span>
      </div>

      {/* Discount Amount */}
      <span className="text-green-500 font-semibold text-sm">
        ₹ {discountAmount} OFF
      </span>
    </div>

    {/* Coupon Description */}
    <p className="text-sm text-gray-600 leading-relaxed">
      Pay using  Credit Cards EMI to avail the offer with No Cost EMI
    </p>
  </div>
</div>


                        {/* Price Section */}
<div className="mt-6">

  {/* Tax Info */}
  <div className="text-right mb-2">
    <span className="text-xs text-gray-400">
      + ₹{hotel.taxes} taxes & fees per night
    </span>
  </div>

  {/* Prices */}
  <div className="flex flex-col items-end mb-4">
    {/* Original Price */}
    <div className="text-sm text-gray-400 line-through">
      ₹{hotel.originalPrice.toLocaleString()}
    </div>

    {/* Discounted Price */}
    <div className="text-[30px] font-[600] text-green-500">
      ₹{hotel.price.toLocaleString()}
    </div>
  </div>

  {/* Additional Info */}
  <div className="text-xs text-gray-500 space-y-1 mb-4">
    <div className="flex items-center gap-1 justify-end">
      <Check className="w-3 h-2 text-green-600" />
      <span>Book @ 0 available</span>
    </div>
  </div>

  {/* Book Now Button */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleHotelClick(hotel.id);
    }}
    className="w-full bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-[18px]"
  >
    Book Now
  </button>
</div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center mt-10">
          {hasSearched && hotels.length > 0 && hasMore && !loading && (
            <button 
              onClick={handleLoadMore} 
              className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Load More
            </button>
          )}
          {loading && page > 1 && (
              <div className="text-gray-600">Loading more hotels...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelListingPage;