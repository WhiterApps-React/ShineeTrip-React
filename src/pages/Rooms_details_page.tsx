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
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";

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

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 3. Initialize states from searchParams (place these near your other states)
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [adults, setAdults] = useState(parseInt(searchParams.get("adults") || "1"));
  const [children, setChildren] = useState(parseInt(searchParams.get("children") || "0"));
  const [loading, setLoading] = useState(false);
  const [roomsRequired, setRoomsRequired] = useState(
  parseInt(searchParams.get("rooms") || "1")
);
  // ✅ State for Dynamic Amenities
  const [dynamicAmenities, setDynamicAmenities] = useState<string[]>([]);


  const [reviews, setReviews] = useState<any[]>([]);
  const [dynamicRating, setDynamicRating] = useState<number>(rating || 0);
  const [dynamicReviewCount, setDynamicReviewCount] = useState<number>(
    reviewCount || 0,
  );

  const thumbnailContainerRef = useRef<HTMLDivElement | null>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);


  // 🟢 Extract Data Dynamically
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
  const price = roomData?.price?.retail_price || roomData?.rate;
  // Property ID for fetching amenities

  const propertyId = searchParams.get("propertyId");
  // 🔄 FETCH DYNAMIC AMENITIES
  useEffect(() => {
    if (!isOpen || !propertyId) return;

    console.log("🔥 Amenities effect triggered", { isOpen, propertyId });

    const fetchAmenities = async () => {
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
        console.log("🔹 Full amenities API response:", response);

        const features =
          response?.data?.selectedFeatures ||
          response?.selectedFeatures ||
          [];

        const amenitiesList = features
          .map((feature: any) => feature?.name)
          .filter(Boolean);

        console.log("✅ Final amenities list:", amenitiesList);

        setDynamicAmenities(
          amenitiesList.length > 0
            ? amenitiesList
            : ["Air Conditioning", "WiFi", "TV"]
        );
      } catch (error) {
        console.error("Amenities fetch error:", error);
      }
    };

    fetchAmenities();
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
            },
          );

          if (res.ok) {
            const reviewsData = await res.json();

            if (Array.isArray(reviewsData) && reviewsData.length > 0) {
              const totalStars = reviewsData.reduce(
                (sum: number, r: any) => sum + (Number(r.overallRating) || 0),
                0,
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


  //fetching features of a hotel

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? safeRoomImages.length - 1 : prev - 1,
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === safeRoomImages.length - 1 ? 0 : prev + 1,
    );
  };

  useEffect(() => {
    const activeThumbnail = thumbnailRefs.current[currentImageIndex];

    if (activeThumbnail) {
      activeThumbnail.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentImageIndex]);



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
  roomsRequired, // ✅ ADDED
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
      console.log(responseData);

      if (res.ok) {
        const queryParams = new URLSearchParams({
          location: searchParams.get("location") || "",
          checkIn: checkIn,
          checkOut: checkOut,
          adults: adults.toString(),
          children: children.toString(),
          rooms: responseData.roomsRequired || "1",
          propertyId: propertyId || "",
          roomId: roomData?.id?.toString() || "",
          roomName: roomData?.room_type || roomName,
          retailPrice: responseData?.pricePerNight || "0", // Data from API response
          taxPrice: responseData?.taxTotal || "0",
          grandTotal: responseData?.grandTotal || "0" // Data from API response
        });

        // Navigate to the booking route with the response data passed in state
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

  // ✅ Render Stars Logic
  const renderStars = (ratingValue: number) => {
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue - fullStars >= 0.5;

    return (
      <>
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <svg
                key={i}
                className="w-6 h-6 fill-green-500"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09L5.64 11.545.764 7.41l6.09-.885L10 1l3.146 5.525 6.09.885-4.876 4.135 1.518 6.545z" />
              </svg>
            );
          }
          if (i === fullStars && hasHalfStar) {
            return (
              <svg
                key={i}
                className="w-6 h-6 fill-green-300"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09L5.64 11.545.764 7.41l6.09-.885L10 1l3.146 5.525 6.09.885-4.876 4.135 1.518 6.545z" />
              </svg>
            );
          }
          return (
            <svg key={i} className="w-6 h-6 fill-gray-300" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09L5.64 11.545.764 7.41l6.09-.885L10 1l3.146 5.525 6.09.885-4.876 4.135 1.518 6.545z" />
            </svg>
          );
        })}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[900px] max-h-[90vh] overflow-hidden p-0 bg-[#FDFDFD] rounded-lg shadow-2xl">
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

          <div className="flex  items-center gap-3">

            <button

              className="p-2 border rounded-lg transition-colors flex justify-center gap-2 items-center"
            >
              <Flag className="w-5 h-5 " />
              <span>Report this hotel</span>
            </button>
          </div>
        </div>

        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 80px)" }}
        >
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
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-md"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-800" />
                  </button>
                </>
              )}
            </div>
            {safeRoomImages.length > 1 && (
              <div
                ref={thumbnailContainerRef}
                className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
              >
                {safeRoomImages.map((img: string, index: number) => (
                  <button
                    key={index}
                    ref={(el) => {
                      thumbnailRefs.current[index] = el;
                    }}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${currentImageIndex === index
                      ? "border-blue-500"
                      : "border-transparent hover:border-gray-300"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-50 h-42 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

          </div>
          <div className="flex flex-col gap-3 w-full">
            {/* ✅ SHORT DESCRIPTION */}
            {short_desc && (
              <div className="bg-white p-6 w-[95%] mx-auto">
                <p className="text-gray-700 text-[15px] leading-relaxed">
                  {short_desc}
                </p>
              </div>
            )}

            {/* Rating Card */}
            <div className=" rounded-xl border bg-[#F6F6F6] border-gray-200 p-6  w-[95%] mx-auto">
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
                      {dynamicRating > 0 ? dynamicRating.toFixed(1) : "New"} ·{" "}
                      {dynamicReviewCount} Reviews
                    </span>
                  </div>
                </div>
                {/* Verified Badge */}
                <div className="flex items-center gap-2 border border-green-500 rounded-lg px-3 py-2">
                  <span className="text-sm text-green-600 font-medium">
                    Guest
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    Verified
                  </span>
                </div>
              </div>
            </div>
            {/* Availability Section*/}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-[95%] mx-auto  border-t border-b">
              {/* Left: Highlights  */}

              {/* Left: Long Description */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    About this room
                  </h3>

                  <div
                    className="text-gray-700 leading-relaxed text-sm md:text-base prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: description || "" }}
                  />
                </div>
              </div>


              {/* ---------- Right: Check Availability ---------- */}
              <div className="bg-[#F6F6F6] rounded-xl border border-gray-200 p-6 h-fit my-3">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Add dates for Prices
                </h3>

                {/* Replace the Dates & Guests section with this */}
                <div className="space-y-3">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm"
                  />
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm"
                  />

                 <div className="grid grid-cols-3 gap-2">
  <select
    value={adults}
    onChange={(e) => setAdults(Number(e.target.value))}
    className="border border-gray-300 rounded-lg p-2 text-sm"
  >
    {[1, 2, 3].map(n => (
      <option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>
    ))}
  </select>

  <select
    value={children}
    onChange={(e) => setChildren(Number(e.target.value))}
    className="border border-gray-300 rounded-lg p-2 text-sm"
  >
    {[0, 1, 2].map(n => (
      <option key={n} value={n}>{n} Child{n !== 1 ? "ren" : ""}</option>
    ))}
  </select>

  {/* ✅ NEW: Rooms Required */}
  <select
    value={roomsRequired}
    onChange={(e) => setRoomsRequired(Number(e.target.value))}
    className="border border-gray-300 rounded-lg p-2 text-sm"
  >
    {[1, 2, 3, 4].map(n => (
      <option key={n} value={n}>
        {n} Room{n > 1 ? "s" : ""}
      </option>
    ))}
  </select>
</div>

                  {/* Button triggers the logic */}
                  <button
                    onClick={handleCheckAvailability}
                    disabled={loading || (adults + children > 3)}
                    className="w-full bg-[#D2A256] text-white font-semibold py-3 rounded-lg transition disabled:bg-gray-400"
                  >
                    {loading ? "Confirming..." : "Book your Destination"}
                  </button>
                </div>
              </div>
            </div>




            {/* ✅ DYNAMIC AMENITIES RENDER */}
            <div className="bg-white p-6 mb-12">
              {dynamicAmenities.length > 0 && (
                <div
                  className="
        grid gap-4
        [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]
      "
                >
                  {dynamicAmenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="
            border border-gray-200 rounded-lg
            px-4 py-3 bg-white
            text-sm text-gray-700
            flex items-center justify-center
            hover:shadow-sm transition
          "
                    >
                      {amenity}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
