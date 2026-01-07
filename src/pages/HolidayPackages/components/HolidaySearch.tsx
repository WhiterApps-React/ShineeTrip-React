import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, Users, X } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LoginModal } from "../../Login/Loginpage";

interface HolidaySearchProps {
  isDetailsPage?: boolean;
  persons?: number; 
  setPersons?: (count: number) => void;
}

export const HolidaySearch = ({ isDetailsPage = false , persons = 1 , setPersons = () => {} }: HolidaySearchProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  
  // States sync with URL
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [date, setDate] = useState(searchParams.get("departureDate") || "");

  // --- AUTOCOMPLETE STATES ---
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Unique Cities from API
  useEffect(() => {
    const fetchPackageCities = async () => {
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const res = await fetch("http://46.62.160.188:3000/holiday-package?limit=100", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const result = await res.json();
        const packages = result.data || result;

        if (Array.isArray(packages)) {
          const allCities = packages.flatMap((pkg: any) => pkg.included_cities || []);
          const uniqueCities: string[] = Array.from(new Set(allCities)).sort() as string[];
          setAvailableCities(uniqueCities);
        }
      } catch (error) {
        console.error("Failed to fetch cities:", error);
      }
    };
    fetchPackageCities();
  }, []);

  // 2. Filter Suggestions
  useEffect(() => {
    if (city.trim()) {
      const filtered = availableCities.filter(c => 
        c.toLowerCase().includes(city.toLowerCase().trim())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [city, availableCities]);

  // 3. Click Outside logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- UPDATED Search Action ---
  const handleListingSearch = () => {
    const token = sessionStorage.getItem("shineetrip_token");
    if (!token) {
      setShowLoginPopup(true);
      return;
    }

    // Ab hum alert nahi dikhayenge agar city khali hai
    // Kyunki user sirf date se bhi search kar sakta hai
    const params: any = {
      page: "1",
      limit: "10"
    };

    // Agar city hai toh add karo, warna skip
    if (city.trim()) params.city = city.trim();
    
    // Agar date hai toh add karo, warna default empty string
    if (date) params.departureDate = date;

    // URL update hoga, HolidayPackages.tsx isey pick kar lega
    setSearchParams(params);
    setShowSuggestions(false);
  };

  return (
    <>
      <div className={`w-full transition-all duration-300 ${
        isDetailsPage ? "bg-white py-4" : "-mt-10 relative z-50"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#e9e9e9] rounded-full shadow-xl flex items-center p-1 border border-gray-100 relative">
            
            {/* DESTINATION SECTION with Autocomplete */}
            <div className="flex-1 flex items-center gap-3 px-6 border-r border-gray-300 relative" ref={wrapperRef}>
              <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                <MapPin size={18} className="text-[#C9A961]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Destination</span>
                <input 
                  type="text" 
                  value={city}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Where to?" 
                  className="text-sm font-bold text-gray-800 focus:outline-none bg-transparent w-full"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 mt-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 bg-gray-50 text-[9px] font-bold text-[#C9A961] uppercase border-b border-gray-100">
                    Suggested Destintations
                  </div>
                  <ul className="max-h-60 overflow-y-auto">
                    {filteredCities.map((item, idx) => (
                      <li 
                        key={idx}
                        onClick={() => {
                          setCity(item);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                      >
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-sm font-bold text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* DATE SECTION */}
            <div className="flex-1 flex items-center gap-3 px-6 border-r border-gray-300 hidden md:flex">
              <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                <Calendar size={18} className="text-[#C9A961]" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Departure</span>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-sm font-bold text-gray-800 focus:outline-none bg-transparent w-full [color-scheme:light]"
                />
              </div>
            </div>

            {/* PERSONS SECTION */}
            <div className="flex-1 flex items-center gap-3 px-6 hidden lg:flex min-w-[180px]">
            <div className="p-2 bg-orange-50 rounded-lg shrink-0">
              <Users size={18} className="text-[#C9A961]" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Number of Persons</span>
              <div className="flex items-center gap-4 mt-0.5">
                <button 
                  onClick={() => persons > 1 && setPersons(persons - 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors"
                >—</button>
                <span className="text-sm font-black text-gray-800 w-4 text-center">{persons}</span>
                <button 
                  onClick={() => setPersons(persons + 1)}
                  className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors"
                >+</button>
              </div>
            </div>
          </div>
            {/* SEARCH BUTTON */}
            <div className="p-1">
              <button 
                onClick={handleListingSearch}
                className="bg-black text-white p-4 rounded-full hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center active:scale-95"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <LoginModal isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </>
  );
};