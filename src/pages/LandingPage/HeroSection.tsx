import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Calendar, Users, Search, ChevronLeft, ChevronRight, ChevronDown, Plus, Minus, X, Bed } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LoginModal } from "../Login/Loginpage";
import { HolidaySearchWidget } from "./searchbars/HolidaySearchWidget";



interface Destination {
  id: number;
  name: string;
  index: number;
  image: string | null;
  redirect_url: string; 
  categoryId: number;
}

// 2. Home Category Structure
interface Category {
  id: number;
  name: string;
  index: number;
  destinations: Destination[]; 
}



export default function HeroSection() {
  const [activeTab, setActiveTab] = useState<string>("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Search Widget State
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchTab, setSearchTab] = useState("Hotels");
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [errorPopup, setErrorPopup] = useState<string>(""); 
  
  // Login Popup State
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // API & Autocomplete State
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const searchTabs = ["Hotels", "Flights", "Trains", "Holiday Packages", "Events"];

  const [categories, setCategories] = useState<Category[]>([]);



  
  const activeCategory = categories.find(cat => cat.name === activeTab) || { destinations: [] };
  const currentDestinations = activeCategory.destinations || [];


  const cardsPerSlide = 4;
  const maxSlide = Math.ceil(currentDestinations.length / cardsPerSlide) - 1;

  const handlePrev = () => setSlideIndex((p) => (p > 0 ? p - 1 : 0));
  const handleNext = () => setSlideIndex((p) => (p < maxSlide ? p + 1 : maxSlide));

  const visibleDestinations = currentDestinations.slice(slideIndex * cardsPerSlide, slideIndex * cardsPerSlide + cardsPerSlide);


  const getFutureDateString = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isFormFilled = location.trim() !== "" || checkIn.trim() !== "" || checkOut.trim() !== "";
  
  const isDetailedSearchReady = location.trim() !== "" && checkIn.trim() !== "" && checkOut.trim() !== "";


useEffect(() => {
  const fetchLocations = async () => {
    try {
      const token = sessionStorage.getItem("shineetrip_token");
      const res = await fetch("http://46.62.160.188:3000/properties/search", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        setAvailableLocations([]);
        return;
      }

      const { data } = await res.json();

      const locations: string[] = Array.from(
        new Set(
          data
            .filter((p: any) => p.city && p.country)
            .map((p: any) => {
              const city = String(p.city || "").trim();
              const country = String(p.country || "").trim().toUpperCase();
              return city && country ? `${city}, ${country}` : null;
            })
            .filter((loc: string | null): loc is string => loc !== null && loc !== ", ")
        )
      ).sort() as string[];

      setAvailableLocations(locations);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      setAvailableLocations([]);
    }
  };

  fetchLocations();
}, []);  
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://46.62.160.188:3000/home-cat-dests/categorized");
      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      const cleaned = data.map((cat: any) => ({
        ...cat,
        name: cat.name.replace(/[\u00A0\s]+/g, ' ').trim()
      }));

      setCategories(cleaned);
      if (cleaned.length > 0 && activeTab === "") {
        setActiveTab(cleaned[0].name); 
      }
    } catch (error) {
      console.error(error);
      setCategories([]);
    }
  };

  fetchCategories();
}, []);

useEffect(() => {
  console.log('Active tab updated to:', activeTab);
  console.log('New destinations:', currentDestinations);
}, [activeTab, currentDestinations]);


  useEffect(() => {
    const widgetState = searchParams.get("searchWidget");
    const type = searchParams.get("type");
    
    if (widgetState === "open") {
      setIsSearchVisible(true);
    } else {
      setIsSearchVisible(false);
    }

    if (type && searchTabs.includes(type)) {
      setSearchTab(type);
    }
  }, [searchParams]);


useEffect(() => {
  if (location.trim()) {
    const userInput = location.toLowerCase().trim();
    const filtered = availableLocations.filter(loc => {
      const [city, country] = loc.toLowerCase().split(',').map(s => s.trim());
      return city.includes(userInput) || country.includes(userInput);
    });
    setFilteredLocations(filtered);
  } else {
    setFilteredLocations([]);
  }
}, [location, availableLocations]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // ✅ NEW: Handle View All Hotels click
  const handleViewAllHotels = () => {
  const token = sessionStorage.getItem("shineetrip_token");
  if (!token) {
    setShowLoginPopup(true);
    return; 
  }


  const safeCheckIn = getFutureDateString(1); // Tomorrow
  const safeCheckOut = getFutureDateString(2); // Day after

  const searchQuery = new URLSearchParams({
    location: "", // All hotels
    checkIn: safeCheckIn,
    checkOut: safeCheckOut,
    adults: '2',
    children: '0',
    rooms: '1',
  }).toString();

  navigate(`/hotellists?${searchQuery}`);
};



const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;

    try {
        // 1. Get the Payload part (second segment)
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error("Token format invalid.");
            return true; // Invalid format
        }
        
        const payloadBase64 = parts[1];

        const decodedPayload = atob(payloadBase64);
        const payload = JSON.parse(decodedPayload);

        // 3. Get expiration time (exp)
        if (!payload.exp) {
            console.error("Token missing expiration time.");
            return true;
        }

        const currentTimeInSeconds = Date.now() / 1000;

        return payload.exp < currentTimeInSeconds;

    } catch (error) {
        console.error("Error decoding or parsing token:", error);
        return true; 
    }
};


const extractCity = (loc: string): string => {
  return loc.split(",")[0].trim();
};


const handleSearch = () => {
    // 1. Authentication Check
    const token = sessionStorage.getItem("shineetrip_token");
    if (!token) {
        setShowLoginPopup(true);
        return;
    }

    // 2. Location Presence Check
    if (!location.trim()) {
        setErrorPopup("Please enter a location.");
        return;
    }

    // if (searchTab === "Holiday Packages") {
    //   const cityOnly = location.split(",")[0].trim();
    //   const query = new URLSearchParams({
    //     city: cityOnly,
    //     departureDate: checkIn || new Date().toISOString().split("T")[0],
    //   }).toString();
    //   navigate(`/holiday-packages?${query}`); // Corrected route for packages
    //   return;
    // }

    // 3. Location Validity Check (using current available locations)
    const userInput = location.trim().toLowerCase();

    const isValid = availableLocations.some(loc => {
        const lowerLoc = loc.toLowerCase();                   
        const cityOnly = loc.split(",")[0].trim().toLowerCase(); 

        return (
            lowerLoc === userInput || 
            lowerLoc.includes(userInput) || 
            cityOnly === userInput || 
            cityOnly.includes(userInput) || 
            userInput.includes(cityOnly) || 
            userInput.includes(loc.split(",")[1]?.trim().toLowerCase()) 
        );
    });

    if (!isValid) {
        setErrorPopup("Location not found. Please select from the suggestions.");
        return;
    }

    // 4. Date Validation Check
    let finalCheckIn = checkIn || getFutureDateString(1);
    let finalCheckOut = checkOut || getFutureDateString(2);

    const today = new Date().toISOString().split("T")[0];

    if (checkIn && checkOut) {
   
        if (checkIn < today || checkOut < today || checkIn >= checkOut) {
            setErrorPopup("Please select valid dates. Check-out must be after Check-in.");
            return;
        }
    } else if (checkIn || checkOut) {
      
         setErrorPopup("Please enter both Check-in and Check-out dates.");
        return;
    }
    

    const cityOnly = location.split(",")[0].trim();

    const query = new URLSearchParams({
        location: cityOnly,
        checkIn: finalCheckIn,
        checkOut: finalCheckOut,
        adults: adults.toString(),
        children: children.toString(),
        rooms: rooms.toString(),
    }).toString();

    navigate(`/hotellists?${query}`);
};

 
  const handleButtonClick = () => {
  const token = sessionStorage.getItem("shineetrip_token");
  if (!token || isTokenExpired(token)) {
        
        if (token) {
             sessionStorage.removeItem("shineetrip_token"); 
        }
        
        
        setShowLoginPopup(true);
        return;
    }
  if (isFormFilled) {
    if (!token) {
      setShowLoginPopup(true);
      return;
    }
    handleSearch();
  } 
  else {
    if (!token) {
      setShowLoginPopup(true);
      return;
    }
    handleViewAllHotels();
  }
};

const handleDestinationClick = (destination: Destination) => {
 
    const token = sessionStorage.getItem("shineetrip_token");
    if (!token || isTokenExpired(token)) {
        
   
        if (token) {
            sessionStorage.removeItem("shineetrip_token"); 
        }
        
        
        setShowLoginPopup(true);
        return; 
    }
    if (!token) {
        setShowLoginPopup(true);
        return; 
    }


    const destinationName = destination.name.trim();
    const safeCheckIn = checkIn || getFutureDateString(1); 
    const safeCheckOut = checkOut || getFutureDateString(2); 


    const searchQuery = new URLSearchParams({
        location: destinationName,
        checkIn: safeCheckIn,
        checkOut: safeCheckOut,
        adults: adults.toString(),
        children: children.toString(),
        rooms: rooms.toString(),
    }).toString();

    // /hotellists page par redirect karo
    navigate(`/hotellists?${searchQuery}`);
};

  const closeSearchWidget = () => {
    setIsSearchVisible(false);
    setSearchParams({});
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 font-opensans">

{errorPopup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-300">
    {/* Backdrop – Click to Close */}
    <div 
      className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
      onClick={() => setErrorPopup("")}
    />

    {/* Popup Card */}
    <div className="relative w-full max-w-md animate-in zoom-in-95 duration-300">
      <div 
        className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{
          border: "2px solid rgba(210, 162, 86, 0.3)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)"
        }}
      >
        {/* Golden Top Border */}
        <div className="h-2 bg-gradient-to-r from-[#AB7E29] via-[#EFD08D] to-[#AB7E29]" />

        <div className="p-8 text-center">
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 shadow-md">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-[#5A5550] mb-3 tracking-wide">
            Error Fetching Results
          </h3>

          {/* Error Message */}
          <p className="text-gray-600 text-base leading-relaxed mb-8 max-w-xs mx-auto font-medium">
            {errorPopup}
          </p>

          {/* Close Button – Exact Golden Gradient Match */}
          <button
            onClick={() => setErrorPopup("")}
            className="relative inline-flex items-center gap-3 px-10 py-4 
                       text-white font-bold text-lg rounded-2xl
                       transition-all transform hover:scale-105 active:scale-95
                       shadow-lg hover:shadow-xl"
            style={{
              background: "linear-gradient(180.95deg, #AB7E29 0.87%, #EFD08D 217.04%)",
              boxShadow: "0px 4px 15px rgba(171, 126, 41, 0.4)"
            }}
          >
            Close & Try Again
            <X size={18} className="ml-2" />
          </button>
        </div>

        {/* Bottom Golden Fade */}
        <div className="h-2 bg-gradient-to-r from-transparent via-[#D2A256]/20 to-transparent" />
      </div>
    </div>
  </div>
)}
      {/* Login Modal */}
      <LoginModal isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />

      {/* HERO SECTION */}
      <div className="relative w-full h-screen overflow-hidden">
        {/* Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80" 
          alt="Himalayan Landscape" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 h-full flex flex-col px-4">
          
          {/* Search Widget Container */}
          {isSearchVisible && (
            <div 
              className="w-full max-w-5xl mx-auto backdrop-blur-xl rounded-[28px] p-4 sm:p-6 md:p-8 text-white relative animate-in fade-in zoom-in duration-300 mt-20 mb-32"
              style={{
                background: 'rgba(0, 0, 0, 0.6)'
              }}
            >
              
              {/* Close Button */}
              <button 
                onClick={closeSearchWidget}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X size={24} />
              </button>
              
                {searchTab === "Holiday Packages" ? (
                <HolidaySearchWidget /> 
              ) : (
                <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pr-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-opensans mb-2 text-[32px] tracking-wide">PLAN YOUR JOURNEY</h2>
                  <p className="text-gray-300 text-[18px] sm:text-sm">Select your travel dates and destination to find the perfect getaway</p>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Location */}
                {/* Location */}
<div className="space-y-2 relative" ref={wrapperRef}>
  <div className="flex items-center gap-2 text-white text-xs font-opensans font-semibold text-[18px] tracking-wider uppercase">
    <MapPin size={14} className="text-[#D2A256]" />
    NAME OF LOCATION
  </div>
  

  <div className="relative">
    <input 
      type="text" 
      value={location}
      onFocus={() => setShowSuggestions(true)}
      onChange={(e) => setLocation(e.target.value)}
      placeholder="Enter the location"
      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A961] transition-colors"
    />
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />


    {showSuggestions && filteredLocations.length > 0 && (
      <div 
        className="absolute top-full z-[100] w-full rounded-2xl mt-2 shadow-2xl overflow-hidden border animate-in slide-in-from-top-2 duration-200 backdrop-blur-2xl"
        style={{ 
          background: 'rgba(30, 30, 30, 0.85)',
          borderColor: 'rgba(210, 162, 86, 0.3)'
        }}
      >
        {/* Header with Golden Accent */}
        <div className="px-4 py-2 text-[10px] font-bold text-[#EFD08D] uppercase tracking-widest border-b border-white/10 bg-white/5">
          Suggested Locations
        </div>

        <ul className="max-h-72 overflow-y-auto custom-scrollbar">
          {filteredLocations.map((loc, index) => {
            const [cityName, countryName] = loc.split(', ');
            return (
              <li 
                key={index}
                onClick={() => {
                  setLocation(loc);
                  setShowSuggestions(false);
                }}
                className="group flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-all border-b border-white/5 last:border-0"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[#AB7E29] group-hover:to-[#EFD08D] transition-all duration-300">
                  <MapPin size={18} className="text-[#D2A256] group-hover:text-white" />
                </div>
                
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-white group-hover:text-[#EFD08D] transition-colors truncate tracking-wide">
                    {cityName}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium uppercase tracking-tighter group-hover:text-gray-300">
                    {countryName}
                  </span>
                </div>

                <div className="ml-auto opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                   <span 
                     className="text-[10px] font-black text-white px-3 py-1 rounded-lg shadow-lg"
                     style={{ background: 'linear-gradient(180.95deg, #AB7E29 0.87%, #EFD08D 217.04%)' }}
                    >
                     SELECT
                   </span>
                </div>
              </li>
            );
          })}
        </ul>
        
        {/* Bottom Accent Line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#AB7E29] to-transparent opacity-50" />
      </div>
    )}
  </div>
</div>
                {/* Check In */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-opensans font-semibold text-[18px] mb-1 tracking-wider uppercase">
                    <Calendar size={14} className="text-[#D2A256]" />
                    CHECK-IN DATE *
                  </div>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                  />

                </div>

                {/* Check Out */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-opensans font-semibold text-[18px] mb-1 tracking-wider uppercase">
                    <Calendar size={14} className="text-[#D2A256]" />
                    CHECK-OUT DATE *
                  </div>
                  <input
                    type="date"
                    min={checkIn || new Date().toISOString().split("T")[0]}
                   value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    disabled={!checkIn}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white disabled:opacity-50"
                  />

                </div>
              </div>

              {/* Counters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-opensans font-semibold text-[18px] tracking-wider uppercase">
                    <Users size={14} className="text-[#D2A256]" />
                    ADULTS *
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <button 
                      onClick={() => setAdults(Math.max(1, adults - 1))} 
                      className="w-14 h-14 bg-[#5A5550] hover:bg-[#6A6560] rounded-2xl flex items-center justify-center text-[#C9A961] transition-all"
                    >
                      <Minus size={24} strokeWidth={3} />
                    </button>
                    <div 
                      className="flex-1 h-14 bg-white/10 rounded-lg flex items-center justify-center font-medium text-lg text-white"
                      style={{ border: '1.95px solid rgba(210, 162, 86, 0.3)' }}
                    >
                      {adults}
                    </div>
                    <button 
                      onClick={() => setAdults(adults + 1)} 
                      className="w-14 h-14 bg-[#5A5550] hover:bg-[#6A6560] rounded-2xl flex items-center justify-center text-[#C9A961] transition-all"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-opensans font-semibold text-[18px] tracking-wider uppercase">
                    <Users size={14} className="text-[#D2A256]" />
                    CHILDREN
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <button 
                      onClick={() => setChildren(Math.max(0, children - 1))} 
                      className="w-14 h-14 bg-[#5A5550] hover:bg-[#6A6560] rounded-2xl flex items-center justify-center text-[#C9A961] transition-all"
                    >
                      <Minus size={24} strokeWidth={3} />
                    </button>
                    <div 
                      className="flex-1 h-14 bg-white/10 rounded-lg flex items-center justify-center font-medium text-lg text-white"
                      style={{ border: '1.95px solid rgba(210, 162, 86, 0.3)' }}
                    >
                      {children}
                    </div>
                    <button 
                      onClick={() => setChildren(children + 1)} 
                      className="w-14 h-14 bg-[#5A5550] hover:bg-[#6A6560] rounded-2xl flex items-center justify-center text-[#C9A961] transition-all"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-opensans font-semibold text-[18px] tracking-wider uppercase">
                    <Bed size={14} className="text-[#D2A256]" />
                    ROOMS
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <button 
                      onClick={() => setRooms(Math.max(0, rooms - 1))} 
                      className="w-14 h-14 bg-[#5A5550] hover:bg-[#6A6560] rounded-2xl flex items-center justify-center text-[#C9A961] transition-all"
                    >
                      <Minus size={24} strokeWidth={3} />
                    </button>
                    <div 
                      className="flex-1 h-14 bg-white/10 rounded-lg flex items-center justify-center font-medium text-lg text-white"
                      style={{ border: '1.95px solid rgba(210, 162, 86, 0.3)' }}
                    >
                      {rooms}
                    </div>
                    <button 
                      onClick={() => setRooms(rooms + 1)} 
                      className="w-14 h-14 bg-[#5A5550] hover:bg-[#6A6560] rounded-2xl flex items-center justify-center text-[#C9A961] transition-all"
                    >
                      <Plus size={24} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <div className="relative md:absolute md:-bottom-6 left-1/2 transform -translate-x-1/2">

                <button 
                  // ✅ FIX: Using the unified click handler
                  onClick={handleButtonClick}
                  className="text-white font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                  style={{
                    borderRadius: '15px',
                    padding: '12px 40px',
                    background: 'linear-gradient(180.95deg, #AB7E29 0.87%, #EFD08D 217.04%)',
                    boxShadow: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {isFormFilled && <Search size={20} />}
                  {isFormFilled ? 'Search' : 'View All Hotels'}
                </button>
              </div>
              </>
              )}
            </div>
          )}
        </div>
      </div>


      <div className="pb-10 bg-white">
        <div className="max-w-7xl mx-auto px-2">
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(255,255,255,0.7)] border border-gray-300 p-8 md:p-12 pb-6 pt-20 md:pt-24 -mt-70 relative ">
          
            {/* STATS BAR - Overlapping Top Edge */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-2 sm:px-4 z-0">
              <div className="bg-white rounded-full shadow-xl py-3 sm:py-4 px-4 sm:px-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0 border border-gray-100">
                 {[
                   ["50+", "DESTINATIONS"],
                   ["10K+", "HAPPY TRAVELERS"],
                   ["15+", "YEARS EXPERIENCE"],
                   ["100%", "SATISFACTION"],
                 ].map(([num, label], i) => (
                   <div key={i} className={`flex flex-col items-center px-2 sm:px-6 ${i === 1 || i === 3 ? '' : 'sm:border-r'} ${i < 2 ? '' : 'sm:border-r'} border-gray-200`}>
                     <div className="text-lg sm:text-2xl font-bold text-[#D2A256] mb-1">
                       {num}
                     </div>
                     <div className="text-[8px] sm:text-[10px] text-gray-500 font-semibold font-opensans tracking-wider text-center">
                       {label}
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          
          {/* Tabs */}
          <div className="flex justify-center mb-4   relative z-10">
            <div className="flex  gap-8 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                       console.log('Clicked tab:', cat.name); 
                       setActiveTab(cat.name);
                       setSlideIndex(0);
                     }}
                     
                    className={`pb-3 whitespace-nowrap transition-all relative text-[18px] font-opensans ${
                      activeTab === cat.name ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {cat.name}
                    {activeTab === cat.name && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>
                    )}
                  </button>
                ))}
                
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {visibleDestinations.map((dest: any, i: number) => (
                  <div 
                    key={i}
                    className="group cursor-pointer"
                    onClick={() => handleDestinationClick(dest)}
                  >
                    <div className="relative overflow-hidden rounded-3xl aspect-[4/3.5] mb-2 shadow-sm">
                      <img
                        src={dest.image}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    <h3 className="text-center text-gray-900 text-xl font-bold">{dest.name}</h3>
                  </div>
                ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-3">
              <button 
                onClick={handlePrev} 
                disabled={slideIndex === 0}
                className={`w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center transition-all ${
                  slideIndex === 0 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "hover:bg-[#C9A961] hover:text-white"
                }`}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={handleNext} 
                disabled={slideIndex >= maxSlide}
                className={`w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center transition-all ${
                  slideIndex >= maxSlide 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "hover:bg-[#C9A961] hover:text-white"
                }`}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}