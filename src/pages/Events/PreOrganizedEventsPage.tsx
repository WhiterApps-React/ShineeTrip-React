import React, { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Filter, Star, Tag , Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ================= TYPES ================= */
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
  city: string;
  country: string;
}

const API_BASE_URL = "http://46.62.160.188:3000";

/* ================= PAGE ================= */
const PreOrganizedEventsPage = () => {
  const navigate = useNavigate();
  const [allEvents, setAllEvents] = useState<OrgEvent[]>([]);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [visibleCount, setVisibleCount] = useState(4);
  const [searchQuery, setSearchQuery] = useState("");
const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [filters, setFilters] = useState({
    is_free: null as boolean | null,
    date: "",
    category: [] as string[],
  });

  /* ================= FETCH EVENTS ================= */
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/org-event`, { headers });
        const data = await res.json();

        setAllEvents(data);
        setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  /* ================= DATE HELPERS ================= */
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();

  const isTomorrow = (d: Date) => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return d.toDateString() === t.toDateString();
  };

  const isThisWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  const isThisMonth = (d: Date) => {
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const locations = useMemo(() => {
  const set = new Set<string>();

  allEvents.forEach(ev => {
    if (ev.city) set.add(ev.city);
    if (ev.country) set.add(ev.country);
  });

  return Array.from(set).sort();
}, [allEvents]); 
  /* ================= APPLY FILTERS ================= */
  useEffect(() => {
  let filtered = [...allEvents];

  // CATEGORY
  if (filters.category.length) {
    filtered = filtered.filter(ev =>
      filters.category.includes(ev.category)
    );
  }

  // PRICE
  if (filters.is_free !== null) {
    filtered = filtered.filter(ev =>
      filters.is_free ? ev.price.length === 0 : ev.price.length > 0
    );
  }

  // DATE
  if (filters.date) {
    filtered = filtered.filter(ev => {
      const d = new Date(ev.date_time);
      switch (filters.date) {
        case "today":
          return isToday(d);
        case "tomorrow":
          return isTomorrow(d);
        case "weekend":
          return isThisWeekend(d);
        case "month":
          return isThisMonth(d);
        default:
          return true;
      }
    });
  }

  // SEARCH
  if (searchQuery) {
    filtered = filtered.filter(ev =>
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.addr.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // LOCATION
  if (selectedLocation) {
    const loc = selectedLocation.toLowerCase();

    filtered = filtered.filter(ev =>
      ev.city?.toLowerCase() === loc ||
      ev.country?.toLowerCase() === loc
    );
  }

  setEvents(filtered);
}, [filters, searchQuery, selectedLocation, allEvents]); 

  /* ================= UNIQUE CATEGORIES ================= */
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; img: string }>();
    allEvents.forEach(ev => {
      if (!map.has(ev.category)) {
        map.set(ev.category, {
          name: ev.category,
          img: ev.cover_img || "https://placehold.co/300x300",
        });
      }
    });
    console.log(allEvents);
    return Array.from(map.values());
  }, [allEvents]);

  /* ================= HANDLERS ================= */
  const handleCategoryClick = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category.includes(category) ? [] : [category],
    }));
  };

  const loadMore = () => setVisibleCount(p => p + 6);

  /* ================= FILTER UI ================= */
const FilterContent = () => (
  <div className="space-y-10">

    {/* PRICE */}
    <div className="pb-8 border-b border-gray-200">
      <h4 className="font-bold text-gray-800 mb-4">Price</h4>

      <label className="flex items-center gap-4 py-1">
        <input
          type="checkbox"
          className="w-4 h-4 accent-[#CA6A1A]"
          checked={filters.is_free === true}
          onChange={() =>
            setFilters(p => ({
              ...p,
              is_free: p.is_free === true ? null : true,
            }))
          }
        />
        <span className="text-gray-700">Free Events</span>
      </label>

      <label className="flex items-center gap-4 py-1">
        <input
          type="checkbox"
          className="w-4 h-4 accent-[#CA6A1A]"
          checked={filters.is_free === false}
          onChange={() =>
            setFilters(p => ({
              ...p,
              is_free: p.is_free === false ? null : false,
            }))
          }
        />
        <span className="text-gray-700">Paid Events</span>
      </label>
    </div>

    {/* DATE */}
    <div className="pb-8 border-b border-gray-200">
      <h4 className="font-bold text-gray-800 mb-4">Date</h4>

      {[
        { label: "Today", value: "today" },
        { label: "Tomorrow", value: "tomorrow" },
        { label: "This Weekend", value: "weekend" },
        { label: "This Month", value: "month" },
      ].map(d => (
        <label
          key={d.value}
          className="flex items-center gap-4 py-1"
        >
          <input
            type="radio"
            name="date"
            className="w-4 h-4 accent-[#CA6A1A]"
            checked={filters.date === d.value}
            onChange={() =>
              setFilters(p => ({ ...p, date: d.value }))
            }
          />
          <span className="text-gray-700">{d.label}</span>
        </label>
      ))}
    </div>

    {/* CATEGORY */}
    <div>
      <h4 className="font-bold text-gray-800 mb-4">Category</h4>

      <div className="space-y-2">
        {categories.map(cat => (
          <label
            key={cat.name}
            className="flex items-center gap-4"
          >
            <input
              type="checkbox"
              className="w-4 h-4 accent-[#CA6A1A]"
              checked={filters.category.includes(cat.name)}
              onChange={() => handleCategoryClick(cat.name)}
            />
            <span className="text-gray-700">{cat.name}</span>
          </label>
        ))}
      </div>
    </div>

  </div>
);

  /* ================= RENDER ================= */
  return (
      <div className="min-h-screen bg-[#F4F4F4] pt-28 pb-20">
          


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
            <div className="flex items-center bg-gray-50 rounded-lg px-4 py-3 w-full md:w-auto border border-gray-200">
  <MapPin className="text-[#CA9C43] w-5 h-5 mr-2" />

  <select
    value={selectedLocation}
    onChange={(e) => setSelectedLocation(e.target.value)}
    className="bg-transparent outline-none text-gray-700 font-medium cursor-pointer"
  >
    <option value="">Place</option>

    {locations.map(loc => (
      <option key={loc} value={loc}>
        {loc}
      </option>
    ))}
  </select>
</div>
        </div>
      </div>


      {/* EXPLORE CATEGORIES */}
   <div className="container max-w-7xl mx-auto px-6 mt-12 mb-8">
  <h2 className="text-4xl font-extrabold mb-8">
    Explore Categories
  </h2>

  <div className="flex gap-8 overflow-x-auto overflow-y-visible no-scrollbar py-4">
    {categories.map(cat => {
      const isSelected = filters.category.includes(cat.name);

      return (
        <button
          key={cat.name}
          onClick={() => handleCategoryClick(cat.name)}
          className="
            flex flex-col items-center min-w-[170px]
            transition-transform duration-300
            hover:-translate-y-2
          "
        >
          <div
            className={`
              w-44 h-44 rounded-full overflow-hidden
              border-4 shadow-lg
              
              ${
                isSelected
                  ? "border-[#CA6A1A]"
                  : "border-white hover:border-[#CA6A1A]/70"
              }
            `}
          >
            <img
              src={cat.img}
              alt={cat.name}
              className="w-full h-full object-cover"
            />
          </div>

          <span
            className={`
              mt-4 text-lg font-semibold transition-colors duration-300
              ${isSelected ? "text-[#CA6A1A]" : "text-gray-800"}
            `}
          >
            {cat.name}
          </span>
        </button>
      );
    })}
  </div>
</div>
      {/* MAIN */}
      <div className="container mx-auto px-6 max-w-7xl flex gap-10">
        <div className="hidden lg:block w-1/4 bg-white p-6 rounded-xl sticky top-28">
          <div className="flex gap-2 mb-4">
            <Filter />
            <h3 className="font-bold">Filters</h3>
          </div>
          <FilterContent />
        </div>

        <div className="flex-1">
          {events.length === 0 ? (
  <div className="w-full flex flex-col items-center justify-center py-24 text-center">
    <h3 className="text-2xl font-bold text-gray-700 mb-2">
      No events available at the moment
    </h3>
    <p className="text-gray-500 max-w-md">
      Try adjusting your filters or search for something else.
    </p>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {events.slice(0, visibleCount).map(event => (
      <OrgEventCard key={event.id} event={event} />
    ))}
  </div>
)}

          {events.length > visibleCount && (
            <div className="mt-12 flex justify-center">
              <button
                onClick={loadMore}
                className="px-10 py-3 border rounded-full font-bold"
              >
                See More Events
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= CARD ================= */
const OrgEventCard = ({ event }: { event: OrgEvent }) => {
  const navigate = useNavigate();
  const date = new Date((event as any).date || event.date_time);

  const getPrice = () => {
  const tickets = (event as any)?.tickets;

  if (!tickets || tickets.length === 0) return "Free";

  const minPrice = Math.min(
    ...tickets.map((t: any) => Number(t.price))
  );

  return minPrice === 0 ? "Free" : `INR ${minPrice}`;
};

  return (
    <div className="bg-white p-3 rounded-[2rem] shadow hover:shadow-xl relative h-[320px] flex flex-col">
      <div className="relative h-48 rounded-[1.5rem] overflow-hidden">
        <img src={event.cover_img} className="w-full h-full object-cover" />
        <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full">
          <Star className="text-black" />
        </button>
      </div>

      <div className="flex mt-4 gap-4 px-2 flex-1">
        <div className="flex flex-col items-center">
          <span className="text-blue-600 font-semibold text-sm">
            {date.toLocaleString("default", { month: "short" }).toUpperCase()}
          </span>
          <span className="text-2xl font-semibold">{date.getDate()}</span>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg line-clamp-2">{event.title}</h3>
          <p className="text-xs text-gray-500 line-clamp-2">{event.addr}</p>
          <div className="flex items-center gap-3 text-sm mt-2">
  <div className="flex items-center gap-1 font-semibold">
    <Ticket size={14} className="-rotate-45" />
    {getPrice()}
  </div>

  <div className="flex items-center gap-1 text-xs">
    <Star size={12} className="text-indigo-800 fill-current" />
    150 interested
  </div>
</div>
        </div>
      </div>

      <button
        onClick={() => navigate(`/org-event-detail/${event.id}`)}
       className="mt-5 w-full h-[48px] rounded-xl text-white font-bold flex items-center justify-center"
        style={{
          background: "linear-gradient(90deg,#B58D3F,#916E2B)",
        }}
      >
        Select Venue
      </button>
    </div>
  );
};

export default PreOrganizedEventsPage;