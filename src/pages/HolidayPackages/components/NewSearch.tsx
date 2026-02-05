import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, Users, Minus, Plus } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LoginModal } from "../../Login/Loginpage";

interface NewSearchProps {
  isDetailsPage?: boolean;
  persons?: number;
  setPersons?: (count: number) => void;
  initialCity?: string;
  initialDate?: string;
  packageDuration?: number; // ✅ NEW PROP: Package ke total days
}

export const NewSearch = ({
  isDetailsPage = false,
  persons = 1,
  setPersons = () => { },
  initialCity = "",
  initialDate = "",
  packageDuration = 0 // Default 0
}: NewSearchProps) => {

  const dateRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const [city, setCity] = useState(initialCity || searchParams.get("city") || "");
  const [date, setDate] = useState(initialDate || searchParams.get("departureDate") || "");

  // --- Date Range Formatter Logic ---
  const getFormattedDateRange = () => {
    if (!date) return "Select Dates";

    const startDate = new Date(date);

    // Agar packageDuration diya hai (Details Page), to End Date calculate karo
    if (packageDuration > 1) {
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (packageDuration - 1));

      const startStr = startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const endStr = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      return `${startStr} - ${endStr}`; // Output: 1 Feb - 8 Feb
    }

    // Agar normal search hai (Home Page)
    return startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    if (initialCity) setCity(initialCity);
    if (initialDate) setDate(initialDate);
  }, [initialCity, initialDate]);


  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleListingSearch = () => {
    const token = sessionStorage.getItem("shineetrip_token");
    if (!token) {
      setShowLoginPopup(true);
      return;
    }

    const params: any = { page: "1", limit: "10" };
    if (city.trim()) params.city = city.trim();
    if (date) params.departureDate = date;
    params.persons = persons.toString();

    setSearchParams(params);
    setShowSuggestions(false);
  };

  return (
    <>
      <div className={`w-full transition-all duration-300 font-opensans ${isDetailsPage ? "bg-white py-4" : "-mt-8 relative z-50"
        }`}>
        <div className="max-w-5xl mx-auto px-4"> {/* Width reduced to 5xl */}

          {/* Main Search Container - Gray Pill Design, Compact Height */}
          <div className="bg-[#F3F4F6] rounded-full shadow-lg border border-gray-200 flex items-center p-1.5 relative h-[60px]">

            {/* DESTINATION SECTION */}
            <div className="flex-1 flex items-center gap-3 px-5 relative" ref={wrapperRef}>
              <div className="shrink-0">
                <MapPin size={20} className="text-[#C9A961]" />
              </div>
              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <input
                  type="text"
                  value={city}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Where to?"
                  // Font size reduced to 15px for compact look
                  className="text-[15px] font-opensans font-bold text-gray-800 focus:outline-none bg-transparent w-full placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>

              {showSuggestions && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 mt-4 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 text-[12px] font-opensans font-bold text-[#C9A961] uppercase border-b border-gray-100">
                    Suggested Destinations
                  </div>
                  <ul className="max-h-52 overflow-y-auto">
                    {filteredCities.map((item, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          setCity(item);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                      >
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-[14px] font-opensans font-bold text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Vertical Separator */}
            <div className="w-[1px] h-8 bg-gray-300 hidden md:block"></div>

            {/* DATE SECTION (With Range Logic) */}
         <div
  className="flex-1 flex items-center gap-3 px-5 hidden md:flex relative group cursor-pointer"
  onClick={() => {
    const el = dateRef.current;
    if (!el) return;
    // @ts-ignore
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  }}
>
  <div className="shrink-0">
    <Calendar size={20} className="text-[#C9A961]" />
  </div>

  <div className="flex flex-col flex-1 justify-center relative">
    {/* Visible text */}
    <span
      className={`text-[15px] font-opensans font-bold ${
        date ? "text-gray-800" : "text-gray-400 font-normal"
      }`}
    >
      {getFormattedDateRange()}
    </span>

    {/* Hidden input */}
    <input
      ref={dateRef}
      type="date"
      value={date}
      onChange={(e) => setDate(e.target.value)}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:hidden"
    />
  </div>
</div>

            {/* Vertical Separator */}
            <div className="w-[1px] h-8 bg-gray-300 hidden lg:block"></div>

            {/* PERSONS SECTION */}
            <div className="flex-1 flex items-center gap-3 px-5 hidden lg:flex min-w-[160px]">
              <div className="shrink-0">
                <Users size={20} className="text-[#C9A961]" />
              </div>
              <div className="flex items-center gap-3 flex-1 justify-between">
                <span className="text-[15px] font-opensans font-bold text-gray-800 whitespace-nowrap">
                  {persons} Guests
                </span>

<div className="flex items-center gap-1">
  <button
    onClick={() => persons > 1 && setPersons(persons - 1)}
    className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-400 text-gray-500 hover:text-[#C9A961] hover:border-[#C9A961] transition-colors"
  >
    <Minus size={18} />
  </button>

  <span className="text-sm font-semibold text-gray-800 w-6 text-center">
    {persons}
  </span>

  <button
    onClick={() => setPersons(persons + 1)}
    className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-400 text-gray-500 hover:text-[#C9A961] hover:border-[#C9A961] transition-colors"
  >
    <Plus size={18} />
  </button>
</div>

              </div>
            </div>

            {/* SEARCH BUTTON */}
            <div className="pl-2 pr-1">
              <button
                onClick={handleListingSearch}
                // Size thoda chota kiya (w-12 h-12)
                className="w-[48px] h-[48px] bg-[#D4AF37] rounded-full hover:bg-[#b39552] transition-all shadow-md flex items-center justify-center active:scale-95 group"
                style={{ background: 'linear-gradient(135deg, #DFBD69 0%, #926F34 100%)' }}
              >
                <Search size={20} className="text-white" />
              </button>
            </div>

          </div>
        </div>
      </div>

      <LoginModal isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </>
  );
};