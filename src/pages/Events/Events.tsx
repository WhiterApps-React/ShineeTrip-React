import React, { useEffect, useState } from "react";
import { ArrowRight, MapPin, FileText, Phone, ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { EventType } from "./eventstype";

const API_BASE_URL = "http://46.62.160.188:3000";

const EventsPage = () => {
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsToShow = 3; // Ek baar mein 3 cards dikhane hain

  // Fetch Event Types from API
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/event-type`, {
          method: "GET",
          headers: headers,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        setEventTypes(data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Could not load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventTypes();
  }, []);

  // Carousel Handlers
  const handleNext = () => {
    if (currentIndex + cardsToShow < eventTypes.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full bg-[#f1f1f1] font-opensans pb-20">

      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[600px] flex items-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-12 text-white">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4 max-w-3xl">
            Plan Extraordinary Events <br /> with Shineetrip
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">
            Let us take care of every detail and create an unforgettable experience for you.
          </p>

          <button
            onClick={() => navigate('/pre-organized-events')}
            className="px-8 py-3 rounded-full font-semibold text-white transition-transform hover:scale-105 shadow-lg"
            style={{
              background: 'linear-gradient(180.95deg, #AB7E29 0.87%, #EFD08D 217.04%)',
            }}
          >
            PAY & Book Now
          </button>
        </div>
      </div>

      {/* --- CHOOSE YOUR EVENT TYPE (Carousel + New Design) --- */}
      <section className="py-16 bg-[#F5F5F5] overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] inline-block relative px-4">
              Choose Your Event Type
              <div className="h-[2px] w-24 bg-[#D1D1D1] absolute top-1/2 -left-28 hidden md:block"></div>
              <div className="h-[2px] w-24 bg-[#D1D1D1] absolute top-1/2 -right-28 hidden md:block"></div>
            </h2>
          </div>

          {/* Loading/Error State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D2A256]"></div>
            </div>
          )}
          {error && <div className="text-center text-red-500"><p>{error}</p></div>}

          {/* CAROUSEL CONTAINER */}
          {!loading && !error && (
            <div className="relative flex items-center justify-center">

              {/* Left Arrow (Only show if not at start) */}
              {currentIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-[-20px] md:left-[-40px] z-10 p-3 rounded-full bg-white shadow-lg text-[#C9A961] hover:scale-110 transition-transform border border-gray-100"
                >
                  <ChevronLeft size={32} />
                </button>
              )}

              {/* Cards Wrapper */}
              <div className="flex gap-6 md:gap-8 transition-transform duration-500 ease-in-out w-full justify-center">
                {eventTypes
                  .slice(currentIndex, currentIndex + cardsToShow)
                  .map((event) => (
                    <div key={event.id} className="w-full md:w-1/3 min-w-[300px] max-w-[400px]">
                      <EventCard
                        id={event.id}
                        image={event.img_link}
                        title={event.name}
                        subtitle={event.desc}
                        onClick={() => navigate(`/event-venues/${event.id}`)}
                      />
                    </div>
                  ))}
              </div>

              {/* Right Arrow (Only show if more items exist) */}
              {currentIndex + cardsToShow < eventTypes.length && (
                <button
                  onClick={handleNext}
                  className="absolute right-[-20px] md:right-[-40px] z-10 p-3 rounded-full bg-[#5A5550] shadow-lg text-[#C9A961] hover:scale-110 transition-transform border border-gray-600"
                >
                  <ChevronRight size={32} />
                </button>
              )}

            </div>
          )}
        </div>
      </section>

      {/* --- HOW IT WORKS (Static) --- */}
      <section className="py-16 bg-[#f1f1f1]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#1A1A1A] relative inline-block">
              How it works
              <div className="h-[2px] w-32 bg-[#D1D1D1] absolute top-1/2 -left-40 hidden md:block"></div>
              <div className="h-[2px] w-32 bg-[#D1D1D1] absolute top-1/2 -right-40 hidden md:block"></div>
            </h2>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center relative max-w-5xl mx-auto">
            {/* Steps (Same as before) */}
            <div className="flex flex-col items-center text-center max-w-xs z-10">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-[#E5E7EB] flex items-center justify-center mb-4 shadow-sm">
                <MapPin className="text-[#F4A460] w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Choose Event & Venue</h3>
              <p className="text-gray-600 text-sm">Select your event type and destination.</p>
            </div>
            <div className="hidden md:block absolute left-[28%] top-[20%]"><ArrowRight className="text-[#C9A961] w-12 h-12" /></div>

            <div className="flex flex-col items-center text-center max-w-xs z-10 mt-8 md:mt-0">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-[#E5E7EB] flex items-center justify-center mb-4 shadow-sm">
                <FileText className="text-[#F4A460] w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Share Requirements</h3>
              <p className="text-gray-600 text-sm">Tell us your needs & preferences.</p>
            </div>
            <div className="hidden md:block absolute right-[28%] top-[20%]"><ArrowRight className="text-[#C9A961] w-12 h-12" /></div>

            <div className="flex flex-col items-center text-center max-w-xs z-10 mt-8 md:mt-0">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-[#E5E7EB] flex items-center justify-center mb-4 shadow-sm">
                <Phone className="text-[#F4A460] w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Get Contacted</h3>
              <p className="text-gray-600 text-sm">Our team will reach out to you super soon.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

// --- NEW DESIGN EVENT CARD ---
interface EventCardProps {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const EventCard = ({ image, title, subtitle, onClick }: EventCardProps) => {
  return (
    // Updated Card Container matching the new design (Rounded corners, white bg, inner padding)
    <div className="bg-white rounded-[2.5rem] shadow-xl p-3 border border-gray-100 flex flex-col h-full transform transition-all duration-300 hover:scale-[1.02]">

      {/* Image Container (Inside padding, rounded corners) */}
      <div className="w-full h-60 rounded-[2rem] overflow-hidden relative shadow-sm">
        <img
          src={image || "https://via.placeholder.com/400x300?text=Event"}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
          }}
        />
      </div>

      {/* Content */}
      <div className="text-center mt-4 px-2 flex-1 flex flex-col">
        <h3 className="text-2xl font-bold text-[#1A1A1A] mb-1">{title}</h3>
        <p className="text-gray-500 text-sm mb-6 line-clamp-2">{subtitle}</p>

        {/* Full Width Button at Bottom */}
        <button
          onClick={onClick}
          className="mt-auto w-full py-3 rounded-2xl text-white font-bold text-base transition-opacity hover:opacity-90 cursor-pointer shadow-md"
          style={{
            background: 'linear-gradient(90deg, #CA9C43 0%, #916E2B 100%)', // Gold Gradient
          }}
        >
          Plan this Event
        </button>
      </div>
    </div>
  );
};

export default EventsPage;