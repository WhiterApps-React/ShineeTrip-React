"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Users,
  Maximize2,
  Bed,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface RoomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomImages: string[];
  roomData: any;
  // ✅ Props for Rating passed from Parent
  rating?: number; 
  reviewCount?: number;
}

export function RoomDetailsModal({
  isOpen,
  onClose,
  roomName = "Standard Room",
  roomImages = [],
  roomData,
  rating = 0,
  reviewCount = 0,
}: RoomDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // ✅ State for Dynamic Amenities
  const [dynamicAmenities, setDynamicAmenities] = useState<{ category: string; items: string[] }[]>([]);

  const [reviews, setReviews] = useState<any[]>([]);
const [dynamicRating, setDynamicRating] = useState<number>(rating || 0);
const [dynamicReviewCount, setDynamicReviewCount] = useState<number>(reviewCount || 0);



  // 🟢 Extract Data Dynamically
  const description = roomData?.description || roomData?.short_description;
  const safeRoomImages =
    roomData?.images?.length > 0
      ? roomData.images.map((img: any) => img.image)
      : roomImages.length > 0
      ? roomImages
      : ["https://placehold.co/600x400?text=No+Image"];

  const occupancy = roomData?.occupancyConfiguration?.max_occ || roomData?.max_guests;
  const bedType = roomData?.bedTypes?.[0]?.bed_type_name || "Royal Bed";
  const price = roomData?.price?.retail_price || roomData?.rate;
  // Property ID for fetching amenities
  const propertyId = roomData?.property?.id || roomData?.propertyId; 

  // 🔄 FETCH DYNAMIC AMENITIES
  useEffect(() => {
    if (isOpen && propertyId) {
      const fetchAmenities = async () => {
        try {
            const token = sessionStorage.getItem("shineetrip_token");
            // Property details endpoint se features fetch karenge
            const res = await fetch(`http://46.62.160.188:3000/properties/${propertyId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (res.ok) {
                const data = await res.json();
                const features = data.selectedFeatures || [];
                
                // Group Features by Parent Category
                const grouped: { [key: string]: string[] } = {};
                
                features.forEach((feature: any) => {
                    const parentName = feature.parentFeature?.name || "General Amenities";
                    if (!grouped[parentName]) {
                        grouped[parentName] = [];
                    }
                    grouped[parentName].push(feature.name);
                });

                // Convert to array format
                const formattedAmenities = Object.keys(grouped).map(key => ({
                    category: key,
                    items: grouped[key]
                }));

                setDynamicAmenities(formattedAmenities.length > 0 ? formattedAmenities : [
                    // Fallback Static Data if API returns empty
                    { category: "General Amenities", items: ["Air Conditioning", "WiFi", "TV"] }
                ]);
            }
        } catch (e) {
            console.error("Amenities fetch error:", e);
        }
      };
      fetchAmenities();
    }
  }, [isOpen, propertyId]);

  useEffect(() => {
  if (isOpen && propertyId) {
    const fetchRating = async () => {
      try {
        const token = sessionStorage.getItem("shineetrip_token");

        const res = await fetch(
          `http://46.62.160.188:3000/ratings/property/${propertyId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (res.ok) {
          const reviewsData = await res.json();

          if (Array.isArray(reviewsData) && reviewsData.length > 0) {
            const totalStars = reviewsData.reduce(
              (sum: number, r: any) =>
                sum + (Number(r.overallRating) || 0),
              0
            );

            setDynamicRating(totalStars / reviewsData.length);
            setDynamicReviewCount(reviewsData.length);
          } else {
            setDynamicRating(0);
            setDynamicReviewCount(0);
          }
        }
      } catch (err) {
        console.warn("Rating fetch failed:", err);
      }
    };

    fetchRating();
  }
}, [isOpen, propertyId]);


  useEffect(() => {
    if (isOpen) setCurrentImageIndex(0);
  }, [isOpen]);

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? safeRoomImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === safeRoomImages.length - 1 ? 0 : prev + 1));
  };

  // ✅ Render Stars Logic
  const renderStars = (ratingValue: number) => {
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue - fullStars >= 0.5;

    return (
      <>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <svg key={i} className="w-4 h-4 fill-green-500" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09L5.64 11.545.764 7.41l6.09-.885L10 1l3.146 5.525 6.09.885-4.876 4.135 1.518 6.545z" />
              </svg>
            );
          }
          if (i === fullStars && hasHalfStar) {
            return (
              <svg key={i} className="w-4 h-4 fill-green-300" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09L5.64 11.545.764 7.41l6.09-.885L10 1l3.146 5.525 6.09.885-4.876 4.135 1.518 6.545z" />
              </svg>
            );
          }
          return (
            <svg key={i} className="w-4 h-4 fill-gray-300" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09L5.64 11.545.764 7.41l6.09-.885L10 1l3.146 5.525 6.09.885-4.876 4.135 1.518 6.545z" />
            </svg>
          );
        })}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[900px] max-h-[90vh] overflow-hidden p-0 bg-white rounded-lg shadow-2xl">
        {/* Header Section */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {roomData?.room_type || roomName}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Maximize2 className="w-4 h-4" />
                <span>200 sq.ft.</span>
              </div>
              {bedType && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Bed className="w-4 h-4" />
                  <span>{bedType}</span>
                </div>
              )}
              {occupancy && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Max {occupancy} guests</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {price && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Starting from</div>
                <div className="text-xl font-bold text-[#1AB64F]">
                  ₹{Number(price).toLocaleString()}
                </div>
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
          {/* Image Gallery */}
          <div className="p-6">
            <div className="relative rounded-lg overflow-hidden h-[420px] bg-black">
              <img
                src={safeRoomImages[currentImageIndex]}
                alt="Room View"
                className="w-full h-full object-cover transition-all duration-300"
              />
              {safeRoomImages.length > 1 && (
                <>
                  <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-md">
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                  </button>
                  <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-md">
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                  </button>
                </>
              )}
            </div>
            {safeRoomImages.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {safeRoomImages.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                      currentImageIndex === index ? "border-blue-500" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-24 h-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= Rating & Availability Section ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[95%] mx-auto">
            {/* ---------- Left: Rating + Highlights ---------- */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rating Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      One of the most loved home on Shine Trip
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        {renderStars(dynamicRating)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {dynamicRating > 0 ? dynamicRating.toFixed(1) : "New"} · {dynamicReviewCount} Reviews
                      </span>
                    </div>
                  </div>
                  {/* Verified Badge */}
                  <div className="flex items-center gap-2 border border-green-500 rounded-lg px-3 py-2">
                    <span className="text-sm text-green-600 font-medium">Guest</span>
                    <span className="text-sm font-semibold text-green-600">Verified</span>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-4">
                {[
                  { title: "Extra Spacious", desc: "Guest love this home’s spaciousness for a comfortable stay." },
                  { title: "Mountain and valley views", desc: "Guests say the views are breathtaking." },
                  { title: "Park for free", desc: "One of the few places in the area with free parking." },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------- Right: Check Availability ---------- */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md h-fit top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Add dates for Prices</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Goa" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="text" placeholder="Check Dates" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="text" placeholder="Guests" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button className="w-full bg-[#D6A75C] hover:bg-[#c6964f] text-white font-semibold py-3 rounded-lg transition">Check Availability</button>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-10 bg-gray-50">
            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#1AB64F] rounded-full"></span>
                Room Description
              </h3>
              <div className="text-gray-700 leading-relaxed text-sm md:text-base prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: description || "" }} />
            </div>

            {/* ✅ DYNAMIC AMENITIES RENDER */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#1AB64F] rounded-full"></span>
                Room Amenities
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dynamicAmenities.length > 0 ? (
                  dynamicAmenities.map((amenity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">{amenity.category}</h4>
                      <ul className="space-y-2">
                        {amenity.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                              <Check className="w-3 h-3 text-green-600" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                   <p className="text-gray-500">Loading amenities...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}