import React, { useEffect, useState } from "react";
import { Search, MapPin, Filter, Heart, X, Star, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- Types based on Swagger Schema ---
interface OrgEvent {
  id: number;
  title: string;
  cover_img: string;
  date_time: string;
  lat: number;
  long: number;
  desc: string;
  tags: string[];
  addr: string;
  price: string[];
  category: string;
  formate: string;
  max_capacity: number;
  current_booked: number;
}

const API_BASE_URL = "http://46.62.160.188:3000";

const PreOrganizedEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Responsive State
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // Filters State
  const [selectedLocation, setSelectedLocation] = useState("Mumbai");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [filters, setFilters] = useState({
    is_free: null as boolean | null,
    date: "", 
    category: [] as string[],
    formate: [] as string[]
  });

  // Fetch Events from API
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const queryParams = new URLSearchParams();
        
        if (filters.date === "Today") {
            queryParams.append("date", new Date().toISOString().split('T')[0]);
        }
        if (filters.is_free !== null) {
            queryParams.append("is_free", filters.is_free.toString());
        }
        if (filters.category.length > 0) {
            queryParams.append("category", filters.category[0]);
        }
        if (filters.formate.length > 0) {
            queryParams.append("formate", filters.formate[0]);
        }

        const url = `${API_BASE_URL}/org-event?${queryParams.toString()}`;
        const response = await fetch(url, { headers });
        const data = await response.json();

        let filteredData = data;
        if (searchQuery) {
            filteredData = data.filter((ev: OrgEvent) => 
                ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ev.addr.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setEvents(filteredData);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchEvents(), 500);
    return () => clearTimeout(timer);
  }, [filters, searchQuery]);

  const toggleFilter = (type: 'category' | 'formate', value: string) => {
    setFilters(prev => {
        const current = prev[type];
        const updated = current.includes(value) 
            ? current.filter(item => item !== value)
            : [...current, value];
        return { ...prev, [type]: updated };
    });
  };

  const loadMore = () => {
      setVisibleCount(prev => prev + 6);
  };

  // --- REUSABLE FILTER CONTENT (Used in Sidebar & Mobile Modal) ---
  const FilterContent = () => (
    <div className="space-y-8">
        {/* Price Filter */}
        <div className="pb-6 border-b border-gray-100">
            <h4 className="font-bold text-gray-700 mb-3">Price</h4>
            <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                    type="checkbox" 
                    className="accent-[#CA9C43] w-5 h-5"
                    checked={filters.is_free === true}
                    onChange={() => setFilters(p => ({...p, is_free: p.is_free === true ? null : true}))}
                    />
                    <span className="text-gray-600 group-hover:text-[#CA9C43] transition-colors">Free Events</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                    type="checkbox" 
                    className="accent-[#CA9C43] w-5 h-5"
                    checked={filters.is_free === false}
                    onChange={() => setFilters(p => ({...p, is_free: p.is_free === false ? null : false}))}
                    />
                    <span className="text-gray-600 group-hover:text-[#CA9C43] transition-colors">Paid Events</span>
                </label>
            </div>
        </div>

        {/* Date Filter */}
        <div className="pb-6 border-b border-gray-100">
            <h4 className="font-bold text-gray-700 mb-3">Date</h4>
            <div className="space-y-3">
                {["Today", "Tomorrow", "This Week", "This Weekend"].map((d, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                        type="radio" 
                        name="date_filter"
                        className="accent-[#CA9C43] w-5 h-5"
                        checked={filters.date === d}
                        onChange={() => setFilters(p => ({...p, date: d}))}
                    />
                    <span className="text-gray-600 group-hover:text-[#CA9C43] transition-colors">{d}</span>
                </label>
                ))}
            </div>
        </div>

        {/* Category Filter */}
        <div>
            <h4 className="font-bold text-gray-700 mb-3">Category</h4>
            <div className="space-y-3">
                {["Entertainment", "Educational", "Technology", "Sports", "Business"].map((c, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        className="accent-[#CA9C43] w-5 h-5"
                        checked={filters.category.includes(c)}
                        onChange={() => toggleFilter('category', c)}
                    />
                    <span className="text-gray-600 group-hover:text-[#CA9C43] transition-colors">{c}</span>
                </label>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-opensans pb-20 pt-28">
      
      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[350px] md:h-[400px] flex items-center">
        <div 
            className="absolute inset-0 z-0"
            style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
             <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-12 w-full">
            <div className="max-w-3xl text-left">
                <h1 className="text-3xl md:text-6xl font-bold text-white mb-4 leading-tight">
                    Plan Extraordinary Events<br/>with Shineetrip
                </h1>
                <p className="text-gray-200 text-sm md:text-xl mb-8 max-w-xl">
                    Discover and book the best events happening around you.
                </p>
            </div>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 -mt-8 relative z-20">
        <div className="bg-white rounded-xl shadow-xl p-3 flex flex-col md:flex-row gap-4 items-center max-w-5xl mx-auto border border-gray-100">
            <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 py-3 w-full border border-gray-200 focus-within:border-[#CA9C43] transition-colors">
                <Search className="text-gray-400 w-5 h-5 mr-3" />
                <input 
                    type="text"
                    placeholder="Search Events..."
                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg w-full md:w-auto border border-gray-200">
                <MapPin className="text-[#CA9C43] w-5 h-5 mr-2" />
                <span className="text-gray-700 font-medium">{selectedLocation}</span>
            </div>
        </div>
      </div>

      {/* --- EXPLORE CATEGORIES (Static) --- */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 mt-12 mb-8">
         <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Explore Categories</h2>
         <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar">
             {[
                 { name: "Entertainment", img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop" },
                 { name: "Educational", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b955?q=80&w=2073&auto=format&fit=crop" },
                 { name: "Cultural", img: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=2070&auto=format&fit=crop" },
                 { name: "Sports", img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop" },
                 { name: "Tech", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop" },
             ].map((cat, idx) => (
                 <div 
                    key={idx} 
                    className="flex flex-col items-center min-w-[90px] cursor-pointer group"
                    onClick={() => toggleFilter('category', cat.name)}
                 >
                     <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-white shadow-md mb-2 group-hover:scale-110 group-hover:border-[#CA9C43] transition-all duration-300">
                         <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                     </div>
                     <span className="text-xs md:text-sm font-semibold text-center text-gray-700">{cat.name}</span>
                 </div>
             ))}
         </div>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl flex flex-col lg:flex-row gap-10 mt-8">
        
        {/* --- SIDEBAR (Desktop Only) --- */}
        <div className="hidden lg:block w-1/4 h-fit sticky top-28 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                 <Filter size={20} className="text-[#CA9C43]" />
                 <h3 className="text-xl font-bold text-[#1A1A1A]">Filters</h3>
             </div>
             <FilterContent />
        </div>

        {/* --- CONTENT (Right Side) --- */}
        <div className="w-full lg:w-3/4">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-[#1A1A1A]">Popular Events</h2>
                 
                 {/* MOBILE FILTER BUTTON (Visible only on lg:hidden) */}
                 <button 
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full shadow-sm text-gray-700 font-semibold text-sm"
                 >
                    <Filter size={16} /> Filters
                 </button>
             </div>

             {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CA9C43]"></div>
                </div>
             ) : (
                <>
                    {events.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                            <p className="text-gray-500">No events found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {events.slice(0, visibleCount).map((event) => (
                                <OrgEventCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </>
             )}
            
            {/* Pagination */}
            {!loading && events.length > visibleCount && (
                <div className="mt-12 flex justify-center">
                     <button 
                        onClick={loadMore}
                        className="px-10 py-3 border-2 border-gray-200 rounded-full text-gray-600 font-bold hover:bg-[#CA9C43] hover:text-white hover:border-[#CA9C43] transition-all"
                     >
                        See More Events
                     </button>
                </div>
            )}
        </div>

      </div>

      {/* --- MOBILE FILTER MODAL --- */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowMobileFilters(false)}
            ></div>
            <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Filters</h3>
                    <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                <FilterContent />
                <button 
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full mt-6 py-3 rounded-xl text-white font-bold bg-[#CA9C43]"
                >
                    Apply Filters
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

// --- NEW CARD DESIGN (Based on Image 3) ---
const OrgEventCard = ({ event }: { event: OrgEvent }) => {
    const eventDate = new Date(event.date_time);
    const day = eventDate.getDate().toString().padStart(2, '0');
    // Month short name (e.g., DEC)
    const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
    const time = eventDate.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });

    const getPriceDisplay = () => {
        if (!event.price || event.price.length === 0) return "Free";
        const prices = event.price.map(p => {
            const parts = p.split(':');
            return parts.length > 1 ? parseInt(parts[1]) : 0;
        });
        const minPrice = Math.min(...prices);
        return minPrice === 0 ? "Free" : `₹ ${minPrice}`;
    };
    const navigate = useNavigate();

    return (
        // Card Container with Padding
        <div className="bg-white p-3 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
            
            {/* Image (Top) - Rounded Corners */}
            <div className="relative h-48 w-full overflow-hidden rounded-[1.5rem]">
                <img 
                    src={event.cover_img || "https://via.placeholder.com/400x250?text=Event"} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white transition-all">
                     <Heart className="text-white hover:text-red-500 w-5 h-5" />
                </button>
            </div>

            {/* Info Section (Row Layout) */}
            <div className="flex mt-4 gap-4 px-2">
                
                {/* Left: Date Block */}
                <div className="flex flex-col items-center min-w-[3rem]">
                    <span className="text-blue-600 font-bold text-sm tracking-wide">{month}</span>
                    <span className="text-gray-900 font-bold text-2xl leading-none">{day}</span>
                </div>

                {/* Right: Details */}
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 line-clamp-2">
                        {event.title}
                    </h3>
                    
                    <p className="text-xs text-gray-500 font-medium mb-1 line-clamp-1">
                        {event.addr}
                    </p>

                    <p className="text-xs text-gray-400 mb-2">
                        {time}
                    </p>

                    {/* Price & Interested Row */}
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-800 font-bold">
                             <Tag size={14} className="text-gray-400" />
                             {getPriceDisplay()}
                        </div>
                        <div className="flex items-center gap-1 text-purple-600 font-medium text-xs">
                             <Star size={12} fill="currentColor" />
                             <span>150 interested</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Button (Full Width) */}
            <button 
                onClick={() => navigate(`/org-event-detail/${event.id}`)}
                className="mt-5 w-full py-3 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
                style={{
                    background: 'linear-gradient(90deg, #B58D3F 0%, #916E2B 100%)', // Gold/Brown Gradient
                }}
            >
                Select Venue
            </button>

        </div>
    );
};

export default PreOrganizedEventsPage;