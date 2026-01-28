import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Calendar, Clock, MapPin, Share2, Star, 
  ArrowLeft, Tag
} from "lucide-react";
import EventBookingModal from "./EventBookingModal"; // Ensure path is correct

// --- Types based on Swagger ---
interface OrgEventDetail {
  id: number;
  title: string;
  cover_img: string;
  date_time: string;
  lat: number;
  long: number;
  h_name: string;
  h_contact: string;
  h_follow: string;
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

const OrgEventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<OrgEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
    // ✅ FIX 1: Modal State Add kiya hai
    const [selectedTicket, setSelectedTicket] = useState<{
  type: string;
  price: number;
} | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/org-event/${id}`, { headers });
        if (!response.ok) throw new Error("Failed to fetch");
        
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#F9F9F9]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CA9C43]"></div>
    </div>
  );

  if (!event) return <div className="text-center py-20 pt-32">Event not found</div>;

  // --- Helpers ---
  const eventDate = new Date(event.date_time);
  const dateStr = eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const tickets = event.price?.map(p => {
    const parts = p.split(':');
    return { type: parts[0], price: parts[1] ? parseInt(parts[1]) : 0 };
  }) || [];

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-opensans pb-20 pt-28 px-4 sm:px-6 lg:px-8">

      {/* ✅ FIX 2: Modal ko sahi jagah place kiya hai */}
   {isBookingOpen && (
  <EventBookingModal
    isOpen={isBookingOpen}
    onClose={() => setIsBookingOpen(false)}
    event={event}
    selectedTicket={selectedTicket}   // ✅ NEW
  />
)}
      
      {/* Back Button */}
      <div className="max-w-7xl mx-auto mb-6">
        <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-[#CA9C43] transition-colors font-medium mt-12"
        >
            <ArrowLeft size={20} className="mr-2 " />
            Back
        </button>
      </div>

      {/* --- HERO IMAGE --- */}
      <div className="max-w-7xl mx-auto h-[300px] md:h-[400px] rounded-3xl overflow-hidden shadow-lg relative mb-8">
          <img 
            src={event.cover_img || "https://via.placeholder.com/1200x600?text=Event+Cover"} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8"></div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN (Details) */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Title & Actions */}
            <div className="flex justify-between items-start">
                <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-tight w-3/4">
                    {event.title}
                </h1>
                <div className="flex gap-3">
                    <button className="p-3 bg-white rounded-full shadow-sm hover:text-[#CA9C43] transition-colors">
                        <Star size={20} />
                    </button>
                    <button className="p-3 bg-white rounded-full shadow-sm hover:text-[#CA9C43] transition-colors">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Date & Time */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Date and Time</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="text-[#CA9C43]" size={20} />
                        <span className="font-medium">{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                        <Clock className="text-[#CA9C43]" size={20} />
                        <span className="font-medium">{timeStr}</span>
                    </div>
                </div>
            </div>

            {/* Location & Map */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Location</h3>
                <div className="flex items-start gap-3 text-gray-600 mb-4">
                    <MapPin className="text-[#CA9C43] mt-1 flex-shrink-0" size={20} />
                    <span className="font-medium leading-relaxed">{event.addr}</span>
                </div>
                <div className="w-full h-48 bg-gray-200 rounded-2xl overflow-hidden border border-gray-300 relative">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/e/ec/Static_map.png" 
                        alt="Map Location" 
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-2 rounded-full shadow-lg">
                            <MapPin className="text-red-500 fill-current" size={32} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Hosted By */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Hosted by</h3>
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#CA9C43] to-[#916E2B] flex items-center justify-center text-white text-xl font-bold shadow-md">
                            {event.h_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg">{event.h_name}</h4>
                            <p className="text-sm text-gray-500">Event Organizer</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                            Contact
                         </button>
                         <button className="px-4 py-2 bg-[#2C3E50] text-white rounded-lg text-sm font-semibold hover:bg-[#1a252f] transition-colors">
                            + Follow
                         </button>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Event Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {event.desc}
                </p>
            </div>

            {/* Tags */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-3">
                    {event.tags && event.tags.length > 0 ? (
                        event.tags.map((tag, idx) => (
                            <span key={idx} className="px-4 py-2 bg-white text-gray-900 rounded-full text-sm font-medium">
                                {tag}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-400 text-sm">No tags available</span>
                    )}
                </div>
            </div>

        </div>

        {/* RIGHT COLUMN (Sticky Ticket Info) */}
        <div className="lg:col-span-1">
            <div className="sticky top-32 bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-6 border-b border-gray-100 pb-4">
                    Ticket Information
                </h3>
<div className="space-y-4 mb-8">
  {tickets.length > 0 ? (
    tickets.map((t, i) => {
      const isSelected =
        selectedTicket?.type === t.type &&
        selectedTicket?.price === t.price;

      return (
        <button
          key={i}
          onClick={() => setSelectedTicket(t)}
          className={`
            w-full flex justify-between items-center p-4 rounded-xl
            border transition-all
            ${isSelected
              ? "border-[#CA9C43] bg-[#CA9C43]/10 shadow-md"
              : "border-gray-200 bg-gray-50 hover:border-[#CA9C43]/60"}
          `}
        >
          <div className="flex items-center gap-3">
            <Tag size={16} className="text-[#CA9C43]" />
            <span className="font-medium text-gray-700">
              {t.type}
            </span>
          </div>

          <span className="font-bold text-gray-900">
            ₹ {t.price}
          </span>
        </button>
      );
    })
  ) : (
    <div className="text-center text-gray-500">Free Entry</div>
  )}
</div>

                {/* ✅ FIX 3: Button Click Action Updated */}
                <button 
                    className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    style={{
                        background: 'linear-gradient(90deg, #7A5C22 0%, #5A4214 100%)',
                    }}
                  onClick={() => {
  const token = sessionStorage.getItem("shineetrip_token");

  if (!token) {
    alert("Please login to buy tickets");
    return;
  }

  if (tickets.length > 0 && !selectedTicket) {
    alert("Please select a ticket type");
    return;
  }

  setIsBookingOpen(true);
}}
                >
                    <Tag size={20} fill="currentColor" className="text-white/80" />
                    Buy Tickets
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default OrgEventDetailsPage;