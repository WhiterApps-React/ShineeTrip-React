import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, Users, X, Minus, Plus } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LoginModal } from "../../Login/Loginpage";

interface HolidaySearchProps {
  isDetailsPage?: boolean;
  persons?: number;
  setPersons?: (count: number) => void;
  initialCity?: string;
  initialDate?: string;
}

export const HolidaySearch = ({
  isDetailsPage = false,
  persons = 1,
  setPersons = () => { },
  initialCity = "",
  initialDate = ""
}: HolidaySearchProps) => {

  const departureRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // States sync with URL
  const [city, setCity] = useState(initialCity || searchParams.get("city") || "");
  const [date, setDate] = useState(initialDate || searchParams.get("departureDate") || "");

  useEffect(() => {
    if (initialCity) setCity(initialCity);
    if (initialDate) setDate(initialDate);
  }, [initialCity, initialDate]);


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

    const params: any = {
      page: "1",
      limit: "10"
    };

    if (city.trim()) params.city = city.trim();
    if (date) params.departureDate = date;
    params.persons = persons.toString();

    setSearchParams(params);
    setShowSuggestions(false);
  };

  return (
    <>
      <div className={`w-full transition-all duration-300 font-opensans ${isDetailsPage ? "bg-white py-6" : "-mt-10 relative z-50"
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#e9e9e9] rounded-full shadow-xl flex items-center p-4 border border-gray-100 relative">

            {/* DESTINATION SECTION with Autocomplete */}
            <div className="flex-1 flex items-center gap-3 px-6 border-r border-gray-300 relative" ref={wrapperRef}>
              <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                <MapPin size={18} className="text-[#C9A961]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                {/* Changed font size to 18px and font-opensans */}
                <span className="text-[18px] font-opensans font-bold text-gray-400 uppercase tracking-tight">Destination</span>
                <input
                  type="text"
                  value={city}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Where to?"
                  // Changed font size to 18px and font-opensans
                  className="text-[18px] font-opensans font-bold text-gray-800 focus:outline-none bg-transparent w-full"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 mt-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Changed font size to 18px and font-opensans */}
                  <div className="px-4 py-2 bg-gray-50 text-[18px] font-opensans font-bold text-[#C9A961] uppercase border-b border-gray-100">
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
                        {/* Changed font size to 18px and font-opensans */}
                        <span className="text-[18px] font-opensans font-bold text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* DATE SECTION */}
            <div className="flex-1 flex items-center gap-3 px-6 border-r border-gray-300 hidden md:flex">
             <div className="p-2 bg-orange-50 rounded-lg shrink-0">
  <button
    type="button"
    onClick={() => {
      const el = departureRef.current;
      if (!el) return;
      // @ts-ignore
      if (typeof el.showPicker === "function") el.showPicker();
      else el.focus();
    }}
    aria-label="Open calendar"
    className="block"
  >
    <Calendar size={18} className="text-[#C9A961]" />
  </button>
</div>
              <div className="flex flex-col flex-1">
                {/* Changed font size to 18px and font-opensans */}
                <span className="text-[18px] font-opensans font-bold text-gray-400 uppercase tracking-tight">Departure</span>
               <input
  ref={departureRef}
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  className="text-[18px] font-opensans font-bold text-gray-800 focus:outline-none bg-transparent w-full [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:hidden"
/>
              </div>
            </div>

            {/* PERSONS SECTION */}
            <div className="flex-1 flex items-center gap-3 px-6 hidden lg:flex min-w-[180px]">
              <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                <Users size={18} className="text-[#C9A961]" />
              </div>
              <div className="flex flex-col flex-1">
                {/* Changed font size to 18px and font-opensans */}
                <span className="text-[18px] font-opensans font-bold text-gray-400 uppercase tracking-tight">Number of Persons</span>
                <div className="flex items-center gap-4 mt-0.5">
<button
  onClick={() => persons > 1 && setPersons(persons - 1)}
  className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors"
>
  <Minus size={16} />
</button>

<span className="text-[18px] font-opensans font-black text-gray-800 w-6 text-center">
  {persons}
</span>

<button
  onClick={() => setPersons(persons + 1)}
  className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors"
>
  <Plus size={16} />
</button>

                </div>
              </div>
            </div>

            {/* SEARCH BUTTON */}
            <div className="p-1">
              <button
                onClick={handleListingSearch}
                // Updated: bg-black -> bg-[#C9A961] and hover color adjusted
                className="bg-[#C9A961] text-white p-4 rounded-full hover:bg-[#b39552] transition-all shadow-lg flex items-center justify-center active:scale-95"
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