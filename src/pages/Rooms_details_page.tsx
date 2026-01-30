"use client";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Maximize2,
  Bed,
  House,
  Landmark,
  Calendar,
  Flag,
  Utensils,
  Sparkles,
  Clock,
  Wine,
  Coffee,
  MapPin,
  Info
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";

interface RoomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomImages: string[];
  roomData: any;
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

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [adults, setAdults] = useState(parseInt(searchParams.get("adults") || "1"));
  const [children, setChildren] = useState(parseInt(searchParams.get("children") || "0"));
  const [loading, setLoading] = useState(false);
  const [roomsRequired, setRoomsRequired] = useState(
    parseInt(searchParams.get("rooms") || "1")
  );
  
  const [dynamicAmenities, setDynamicAmenities] = useState<string[]>([]);
  const [hotelFullData, setHotelFullData] = useState<any>(null);

  const [dynamicRating, setDynamicRating] = useState<number>(rating || 0);
  const [dynamicReviewCount, setDynamicReviewCount] = useState<number>(
    reviewCount || 0,
  );

  const thumbnailContainerRef = useRef<HTMLDivElement | null>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const description = roomData?.description;
  const short_desc = roomData?.short_description;
  const safeRoomImages =
    roomData?.images?.length > 0
      ? roomData.images.map((img: any) => img.image)
      : roomImages.length > 0
        ? roomImages
        : ["https://placehold.co/600x400?text=No+Image"];

  const occupancy =
    roomData?.occupancyConfiguration?.max_occ || roomData?.max_guests;
  const bedType = roomData?.bedTypes?.[0]?.bed_type_name || "Royal Bed";
  const propertyId = searchParams.get("propertyId");

  useEffect(() => {
    if (!isOpen || !propertyId) return;

    const fetchPropertyDetails = async () => {
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const res = await fetch(
          `http://46.62.160.188:3000/properties/${propertyId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!res.ok) return;
        const response = await res.json();
        const data = response?.data || response;
        setHotelFullData(data);

        const features = data?.selectedFeatures || [];
        const amenitiesList = features.map((f: any) => f?.name).filter(Boolean);

        setDynamicAmenities(
          amenitiesList.length > 0 ? amenitiesList : ["Air Conditioning", "WiFi", "TV"]
        );
      } catch (error) {
        console.error("Property fetch error:", error);
      }
    };

    fetchPropertyDetails();
  }, [isOpen, propertyId]);

  useEffect(() => {
    if (isOpen && propertyId) {
      const fetchRating = async () => {
        try {
          const token = sessionStorage.getItem("shineetrip_token");
          const res = await fetch(
            `http://46.62.160.188:3000/ratings/property/${propertyId}`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );

          if (res.ok) {
            const reviewsData = await res.json();
            if (Array.isArray(reviewsData) && reviewsData.length > 0) {
              const totalStars = reviewsData.reduce(
                (sum: number, r: any) => sum + (Number(r.overallRating) || 0),
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
    setCurrentImageIndex((prev) =>
      prev === 0 ? safeRoomImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === safeRoomImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleCheckAvailability = async () => {
    const customerIdRaw = sessionStorage.getItem("shineetrip_db_customer_id");
    if (!customerIdRaw || isNaN(Number(customerIdRaw))) {
      alert("Please login again. Customer session expired.");
      return;
    }

    const customerId = Number(customerIdRaw);
    setLoading(true);
    try {
      const payload = {
        propertyId: Number(propertyId),
        roomTypeId: Number(roomData?.id),
        adults,
        children,
        roomsRequired,
        checkIn,
        checkOut,
        customerId
      };

      const res = await fetch("http://46.62.160.188:3000/order/check-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("shineetrip_token")}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      if (res.ok) {
        const queryParams = new URLSearchParams({
          location: searchParams.get("location") || "",
          checkIn,
          checkOut,
          adults: adults.toString(),
          children: children.toString(),
          rooms: responseData.roomsRequired || "1",
          propertyId: propertyId || "",
          roomId: roomData?.id?.toString() || "",
          roomName: roomData?.room_type || roomName,
          retailPrice: responseData?.pricePerNight || "0",
          taxPrice: responseData?.taxTotal || "0",
          grandTotal: responseData?.grandTotal || "0"
        });

        navigate(`/booking?${queryParams.toString()}`, {
          state: { availabilityResponse: responseData }
        });
      } else {
        alert(responseData.message || "Availability check failed");
      }
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (ratingValue: number) => {
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue - fullStars >= 0.5;
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <svg key={i} className={`w-6 h-6 ${i < fullStars ? 'fill-green-500' : (i === fullStars && hasHalfStar ? 'fill-green-300' : 'fill-gray-300')}`} viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09L5.64 11.545.764 7.41l6.09-.885L10 1l3.146 5.525 6.09.885-4.876 4.135 1.518 6.545z" />
          </svg>
        ))}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[900px] max-h-[90vh] overflow-hidden p-0 bg-[#FDFDFD] rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{roomData?.room_type || roomName}</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm text-gray-600"><Maximize2 className="w-4 h-4" /><span>200 sq.ft.</span></div>
              {bedType && <div className="flex items-center gap-1 text-sm text-gray-600"><Bed className="w-4 h-4" /><span>{bedType}</span></div>}
              {occupancy && <div className="flex items-center gap-1 text-sm text-gray-600"><Users className="w-4 h-4" /><span>Max {occupancy} guests</span></div>}
            </div>
          </div>
          <button className="p-2 border rounded-lg transition-colors flex justify-center gap-2 items-center"><Flag className="w-5 h-5 " /><span>Report this hotel</span></button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
          {/* Gallery */}
          <div className="p-6">
            <div className="relative rounded-lg overflow-hidden h-[420px] bg-black">
              <img src={safeRoomImages[currentImageIndex]} alt="Room View" className="w-full h-full object-cover transition-all duration-300" />
              {safeRoomImages.length > 1 && (
                <>
                  <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-md"><ChevronLeft className="w-5 h-5 text-gray-800" /></button>
                  <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-md"><ChevronRight className="w-5 h-5 text-gray-800" /></button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {short_desc && <div className="bg-white px-6 py-2 w-[95%] mx-auto"><p className="text-gray-700 text-[15px]">{short_desc}</p></div>}

            {/* Rating */}
            <div className="rounded-xl border bg-[#F6F6F6] border-gray-200 p-6 w-[95%] mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">One of the most loved home on Shine Trip</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">{renderStars(dynamicRating)}</div>
                    <span className="text-sm text-gray-600">{dynamicRating > 0 ? dynamicRating.toFixed(1) : "New"} · {dynamicReviewCount} Reviews</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 border border-green-500 rounded-lg px-3 py-2">
                  <span className="text-sm text-green-600 font-medium">Guest</span>
                  <span className="text-sm font-semibold text-green-600">Verified</span>
                </div>
              </div>
            </div>

            {/* Availability Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-[95%] mx-auto border-t border-b">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About this room</h3>
                  <div className="text-gray-700 leading-relaxed text-sm md:text-base prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: description || "" }} />
                </div>
              </div>

              <div className="bg-[#F6F6F6] rounded-xl border border-gray-200 p-8 h-fit my-3">
                <h3 className="font-semibold text-gray-900 mb-4">Add dates for Prices</h3>
                <div className="space-y-3">
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-4 text-sm" />
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-4 text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={roomsRequired} onChange={(e) => setRoomsRequired(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-4 text-base">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} Room{n > 1 ? "s" : ""}</option>)}
                    </select>
                    <select value={adults} onChange={(e) => setAdults(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-4 text-base">
                      {Array.from({ length: roomsRequired * 2 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>)}
                    </select>
                    <select value={children} onChange={(e) => setChildren(Number(e.target.value))} className="col-span-2 border border-gray-300 rounded-lg px-3 py-4 text-base">
                      {Array.from({ length: roomsRequired * 2 + 1 }, (_, i) => i).map(n => <option key={n} value={n}>{n} Child{n !== 1 ? "ren" : ""}</option>)}
                    </select>
                  </div>
                  <button onClick={handleCheckAvailability} disabled={loading || (adults + children == 0)} className="w-full bg-[#D2A256] text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400">
                    {loading ? "Confirming..." : "Book your Destination"}
                  </button>
                </div>
              </div>
            </div>

            {/* ✅ AMENITIES SECTION */}
            <div className="bg-white p-6 w-[95%] mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What this place offers</h3>
              {dynamicAmenities.length > 0 && (
                <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                  {dynamicAmenities.map((amenity, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg px-4 py-3 bg-white text-sm text-gray-700 flex items-center justify-center hover:shadow-sm transition">
                      {amenity}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ RESTAURANTS */}
            {hotelFullData?.restaurants?.length > 0 && (
              <div className="bg-white p-6 w-[95%] mx-auto border-t">
                <div className="flex items-center gap-2 mb-6">
                    <Utensils className="w-6 h-6 text-[#D2A256]" />
                    <h3 className="text-xl font-bold text-gray-900">Dining & Restaurants</h3>
                </div>
                <div className="space-y-8">
                  {hotelFullData.restaurants.map((rest: any) => (
                    <div key={rest.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-12">
                        <div className="md:col-span-5 h-64 md:h-auto relative">
                          <img src={rest.cover_img} alt={rest.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="md:col-span-7 p-6 md:p-8">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="text-2xl font-bold text-gray-900 mb-1">{rest.name}</h4>
                                <p className="text-[#D2A256] font-medium mb-4">{rest.cuisine} • {rest.theme}</p>
                             </div>
                             {rest.alcoholServed && (
                                <span className="flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-md border border-amber-100">
                                    <Wine className="w-3.5 h-3.5" /> Bar Available
                                </span>
                             )}
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-6 leading-relaxed">{rest.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 border-t pt-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold"><Clock className="w-4 h-4" /> Timings</div>
                                <p className="text-xs text-gray-500">{rest.openingTime} to {rest.closingTime}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold"><MapPin className="w-4 h-4" /> Ambience</div>
                                <p className="text-xs text-gray-500">{rest.ambienceAndSeating}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold"><Coffee className="w-4 h-4" /> Buffet</div>
                                <p className="text-xs text-gray-500">{rest.buffetAvailable ? "Available" : "A La Carte Only"}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold"><Info className="w-4 h-4" /> Note</div>
                                <p className="text-xs text-gray-500">{rest.additionalNotes || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ SPAS - UPDATED SIZE TO MATCH RESTAURANT */}
            {hotelFullData?.spas?.length > 0 && (
              <div className="bg-white p-6 w-[95%] mx-auto border-t mb-12">
                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-6 h-6 text-[#D2A256]" />
                    <h3 className="text-xl font-bold text-gray-900">Spa & Wellness</h3>
                </div>
                <div className="space-y-8">
                  {hotelFullData.spas.map((spa: any) => (
                    <div key={spa.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-12">
                        {/* Matched md:col-span-5 to restaurant image size */}
                        <div className="md:col-span-5 h-64 md:h-auto relative">
                          <img src={spa.cover_img} alt={spa.name} className="w-full h-full object-cover" />
                        </div>
                        {/* Matched md:col-span-7 for consistency */}
                        <div className="md:col-span-7 p-6 md:p-8">
                          <h4 className="text-2xl font-bold text-gray-900 mb-2">{spa.name}</h4>
                          <p className="text-gray-600 text-sm mb-4 italic leading-relaxed">{spa.description}</p>
                          
                          <div className="flex items-center gap-4 mb-6">
                             <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5" /> {spa.openingTime} - {spa.closingTime}
                             </div>
                             {spa.multiTherapyAvailable && (
                                <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                    Multi-Therapy Center
                                </div>
                             )}
                          </div>

                          <div>
                             <p className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-tighter">Signature Treatments</p>
                             <div className="flex flex-wrap gap-2">
                                {spa.treatments?.map((t: string, i: number) => (
                                  <span key={i} className="text-xs bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-sm hover:border-[#D2A256] transition cursor-default">
                                    {t}
                                  </span>
                                ))}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}