import React, { useEffect, useState } from "react";
import { Search, MapPin, Star, ChevronDown } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

// --- Types matched to your JSON structure ---
interface Venue {
  id: number;
  name: string;
  cover_img: string;
  images: string[];
  desc: string;
  location: string;
  min_price: string | number; // JSON has it as string "20000"
  budget_range: string;
  venue_type: string;
  min_guest_capacity: number;
  max_guest_capacity: number;
  luxury: boolean;
  suitability: string[];
}

interface FilterOptions {
  locations: string[];
  budget_ranges: string[];
  venue_types: string[];
}

const API_BASE_URL = "http://46.62.160.188:3000";

const EventVenuesPage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  // State
  const [venues, setVenues] = useState<Venue[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ 
    locations: [], 
    budget_ranges: [], 
    venue_types: [] 
  });
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");

  // --- Fetch Filter Options ---
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/event-venue/filters/options`);
        const data = await res.json();
        setFilterOptions(data);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  // --- Fetch Venues (Corrected for Nested JSON) ---
  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const url = `${API_BASE_URL}/event-type/${id}`;
        const response = await fetch(url, { headers });
        const data = await response.json();

        // FIX: Extract venues from the parent object { name, desc, venues: [] }
        setCategoryName(data.name);
        const venuesList = data.venues || [];
          
        let filteredData = venuesList;

        // Search Filter
        if (searchQuery) {
            filteredData = filteredData.filter((v: Venue) => 
                v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                v.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Location Filter
        if (selectedLocation) {
            filteredData = filteredData.filter((v: Venue) => v.location === selectedLocation);
        }

        // Budget Filter
        if (selectedBudget) {
            filteredData = filteredData.filter((v: Venue) => v.budget_range === selectedBudget);
        }

        setVenues(filteredData);
      } catch (error) {
        console.error("Error fetching venues:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
        fetchVenues();
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedLocation, selectedBudget, searchQuery, id]);

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-opensans pb-20">
      
      {/* --- SEARCH & FILTER BAR SECTION --- */}
      <div className="py-10 px-4">
        <div className="container mt-20 mx-auto max-w-6xl">
           <div className="bg-white border border-gray-200 rounded-full shadow-md flex items-center p-2 max-w-4xl mx-auto h-16">
              
              <div className="flex items-center flex-1 px-4 border-r border-gray-200">
                <Search className="text-gray-400 w-5 h-5 mr-3" />
                <input 
                    type="text"
                    placeholder="Search Venues, Locations..."
                    className="w-full outline-none text-gray-700 placeholder-gray-400 text-sm md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="relative hidden md:flex items-center px-6 min-w-[200px] cursor-pointer group">
                  <MapPin className="text-[#D2A256] w-5 h-5 mr-2" />
                  <select 
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="appearance-none bg-transparent outline-none text-gray-700 font-medium w-full cursor-pointer z-10"
                  >
                      <option value="">All Locations</option>
                      {filterOptions.locations.map((loc, idx) => (
                          <option key={idx} value={loc}>{loc}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-4 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
           </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 max-w-7xl">
        <h2 className="text-center text-3xl font-bold text-[#CA9C43] mb-10 tracking-wide">
            {categoryName || "Select Your Perfect Venue"}
        </h2>

        {loading ? (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D2A256]"></div>
            </div>
        ) : (
            <>
                {venues.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No venues found matching your criteria.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {venues.map((venue) => (
                            <VenueCard key={venue.id} venue={venue} />
                        ))}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

// --- HELPER: Venue Card Component ---
const VenueCard = ({ venue }: { venue: Venue }) => {
    const navigate = useNavigate(); 
    
    const formatPrice = (price: string | number) => {
        const numPrice = typeof price === 'string' ? parseInt(price) : price;
        if (numPrice >= 100000) return `₹ ${(numPrice / 100000).toFixed(1)}L`;
        if (numPrice >= 1000) return `₹ ${(numPrice / 1000).toFixed(1)}k`;
        return `₹ ${numPrice}`;
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col group hover:shadow-2xl transition-all duration-300">
            <div className="relative h-64 w-full overflow-hidden">
                <img 
                    src={venue.cover_img || "https://via.placeholder.com/600x400?text=Venue"} 
                    alt={venue.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {venue.luxury && (
                    <div className="absolute top-4 right-4 bg-[#CA9C43] text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider shadow-md">
                        Luxury
                    </div>
                )}
            </div>

            <div className="p-6 md:p-8 flex-1 flex flex-col bg-gray-50/50">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                        {venue.name}
                    </h3>
                </div>

                <div className="flex items-center gap-2 mb-4">
                     <div className="flex text-[#D2A256]">
                        {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} className={i < 4 ? "" : "text-gray-300"} />)}
                     </div>
                     <span className="font-bold text-gray-800">4.5</span>
                     <span className="text-gray-500 text-sm">(112 reviews)</span>
                </div>

                <div className="flex items-center text-gray-600 mb-2">
                    <MapPin size={18} className="mr-2 text-gray-400" />
                    <span className="font-medium capitalize">{venue.location}</span>
                </div>
                
                <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">
                    {venue.venue_type} • {venue.max_guest_capacity} Guests Max
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Starting from</p>
                        <p className="text-2xl font-bold text-[#D2A256]">
                            {formatPrice(venue.min_price)}
                        </p>
                    </div>

                    <button 
                        onClick={() => navigate(`/venue-details/${venue.id}`)}
                        className="px-8 py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-transform hover:scale-105 active:scale-95"
                        style={{ background: 'linear-gradient(90deg, #CA9C43 0%, #916E2B 100%)' }}
                    >
                        Select Venue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventVenuesPage;