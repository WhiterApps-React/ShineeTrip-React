import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Users, Briefcase, IndianRupee, CheckCircle, ParkingCircle, Utensils, Home, Paintbrush } from "lucide-react";

// --- Types based on Swagger ---
interface Amenity {
  id: number;
  name: string;
  img_link: string;
}

interface EventType {
  id: number;
  name: string;
}

interface VenueDetails {
  id: number;
  name: string;
  cover_img: string;
  images: string[];
  desc: string;
  location: string;
  min_price: number;
  budget_range: string;
  venue_type: string;
  min_guest_capacity: number;
  max_guest_capacity: number;
  luxury: boolean;
  event_types: EventType[][]; // API structure is nested array based on swagger
  amenities: Amenity[];
}

const API_BASE_URL = "http://46.62.160.188:3000";

const VenueDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/event-venue/${id}`, { headers });
        if (!response.ok) throw new Error("Failed to fetch");
        
          const data = await response.json();
          console.log(data); 
        setVenue(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueDetails();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#F2F2F2]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D2A256]"></div>
    </div>
  );

  if (!venue) return <div className="text-center py-20">Venue not found</div>;

  // --- Helper Functions ---
  const formatPrice = (price: number) => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(0)}L`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(0)}k`;
    return `₹${price}`;
  };

  // Flatten event types for tags (handling nested array structure from swagger)
  const tags = venue.event_types?.flat().map(t => t.name) || [];

  // Combine cover image with other images for gallery
  const galleryImages = [venue.cover_img, ...(venue.images || [])].slice(0, 4);

  return (
  <div className="min-h-screen bg-[#ECECEC] font-opensans pt-35 pb-20 ">
    {/* Back */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
      >
        <ArrowLeft size={18} className="mr-2 mt-2" />
        Back to venues
      </button>
    </div>

    {/* Main wrapper card */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className=" rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-7 pb-5 border-b  bg-white border-gray-100">
          <h1 className="text-3xl font-extrabold text-gray-900">{venue.name}</h1>

          <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin size={16} className="mr-1 text-gray-400" />
              <span>{venue.location}</span>
            </div>

            <div className="flex items-center gap-1">
              <Star size={14} className="text-[#D2A256] fill-current" />
              <span className="font-bold text-gray-800">4.8</span>
              <span className="text-gray-400">(156 reviews)</span>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="px-6 sm:px-8 pt-6 pb-7 bg-white mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Big image */}
            <div className="lg:col-span-9">
              <div className="h-[320px] sm:h-[360px] lg:h-[360px] rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={galleryImages[0]}
                  alt="Main"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right stack */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
              {galleryImages.slice(1, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="h-[108px] rounded-xl overflow-hidden border border-gray-200"
                >
                  <img src={img} alt={`Side ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content grid (left + right) */}
     <div className="px-1 sm:px-0 pb-10">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    {/* LEFT */}
    <div className="lg:col-span-8 space-y-6">
      {/* Key Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Key Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          <div>
            <p className="text-sm text-gray-500 mb-1">Guest Capacity</p>
            <p className="text-lg font-bold text-gray-900">
              {venue.min_guest_capacity}-{venue.max_guest_capacity} guests
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Venue Type</p>
            <p className="text-lg font-bold text-gray-900">{venue.venue_type}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Event Suitability</p>
            <div className="flex flex-wrap gap-2">
              {tags.length > 0 ? (
                tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">General Events</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Budget Range</p>
            <p className="text-lg font-bold text-gray-900">
              {venue.budget_range || "Flexible"}
            </p>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Amenities</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {venue.amenities?.length > 0 ? (
            venue.amenities.map((amenity) => (
              <div
                key={amenity.id}
                className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-4 flex items-center gap-3"
              >
                {amenity.img_link ? (
                  <img src={amenity.img_link} alt={amenity.name} className="w-6 h-6" />
                ) : (
                  <CheckCircle className="text-gray-500" size={20} />
                )}
                <span className="text-base font-semibold text-gray-800">
                  {amenity.name || "Amenity"}
                </span>
              </div>
            ))
          ) : (
            <div className="text-gray-400 italic text-base">
              Amenities details available on request
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">About this venue</h2>
        <p className="text-base text-gray-600 leading-relaxed">{venue.desc}</p>
      </div>
    </div>

    {/* RIGHT */}
    <div className="lg:col-span-4">
      <div className="sticky top-28">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Starting from</p>
          <p className="text-3xl font-extrabold text-gray-900 mb-6">
            {formatPrice(venue.min_price)}
          </p>

          <button
            className="w-full rounded-xl py-4 font-bold text-white text-lg shadow-sm hover:opacity-95 transition"
            style={{ background: "linear-gradient(180deg, #C9A961 0%, #9B7A2F 100%)" }}
            onClick={() => venue && navigate(`/event-enquiry/${venue.id}`)}
          >
            Proceed with this venue
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            Our team will contact you shortly after submission
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

      </div>
    </div>
  </div>
);
};

export default VenueDetailsPage;