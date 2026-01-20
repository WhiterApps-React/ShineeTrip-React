import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Maximize2 } from 'lucide-react';


// Interfaces for RoomCard Props
interface RoomCardProps {
    room: any; 
    hotelImages: string[];
    services: any[];
    onMoreInfoClick: (roomData: any) => void;
    onServiceDetailClick: (serviceData: any) => void;
    onBookNowClick: (roomData: any) => void; 
    onPolicyClick: () => void; // Policy handler
}

const RoomCard = ({ room, hotelImages,services, onMoreInfoClick, onBookNowClick, onPolicyClick , onServiceDetailClick }: RoomCardProps) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const price = room.price;
    // Safe check for occupancyConfiguration
    const occupancy = room.occupancyConfiguration || { max_occ: 3 }; 

    if (!price) {
        return null;
    }

    // Yahan hum hotelImages use kar rahe hain kyunki room images API se nahi aa rahe the.
    const roomImages = hotelImages && hotelImages.length > 0 ? hotelImages : ['https://placehold.co/600x400?text=No+Image'];
    
    // Helper for carousel navigation (stops propagation)

const getShortDescription = (text: string, limit = 120) => {
  if (!text) return { short: '', isLong: false };

  if (text.length <= limit) {
    return { short: text, isLong: false };
  }

  return {
    short: text.slice(0, limit) + '...',
    isLong: true
  };
};

useEffect(() => {
  const activeThumb = thumbnailRefs.current[currentImageIndex];
  if (activeThumb) {
    activeThumb.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest'
    });
  }
}, [currentImageIndex]);

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        // ❌ FIX 1 APPLIED: Removed accidental onPolicyClick() call from image navigation
        setCurrentImageIndex((prev) => (prev === 0 ? roomImages.length - 1 : prev - 1));
    };

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === roomImages.length - 1 ? 0 : prev + 1));
    };
    
    // --- NEW HANDLER FOR POLICIES ---
    const handlePolicyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPolicyClick(); // Calling the function passed from parent (RoomBookingPage)
    };
    // -------------------------------

    // Price calculations
    const basePrice = parseFloat(price.retail_price);
    const taxPrice = parseFloat(price.retail_tax_price);
    // Assuming retail_tax_price is the tax amount itself based on typical UI patterns
    const taxAmount = taxPrice; 

    // Helper function to handle booking click
    const handleBookNowClick = (e: React.MouseEvent, roomData: any) => {
        e.stopPropagation();
        onBookNowClick(roomData);
    }
    
    // Helper function to handle more info click
    const handleMoreInfoClick = (e: React.MouseEvent, roomData: any) => {
        e.stopPropagation();
        onMoreInfoClick(roomData);
    }

    // --- NEW HELPER FUNCTION: cleanDescription (Revised for no static fallback) ---
    const cleanDescription = (description: string | null | undefined): string => {
        if (!description) {
            return '';
        }
    
        let cleanedText = String(description);
        cleanedText = cleanedText.replace(/<[^>]*>/g, '');
        cleanedText = cleanedText.replace(/jkhsmsvskvynkjykkdckdc/g, ''); 
        cleanedText = cleanedText.replace(/\{\}/g, '').replace(/<>/g, '');
        cleanedText = cleanedText.replace(/\s\s+/g, ' ').trim();
        return cleanedText; 
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 transition-all hover:shadow-md">
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Image Carousel Section */}
                <div className="w-full lg:w-[320px] flex-shrink-0">
                    {/* Main Image */}
                    <div className="relative h-80 lg:h-74 rounded-xl overflow-hidden mb-2 group">
                        <img 
                            src={roomImages[currentImageIndex]} 
                            alt={room.room_type} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {roomImages.length > 1 && (
                            <>
                                <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-md text-gray-800 opacity-0 group-hover:opacity-100 transition-all z-10">
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-md text-gray-800 opacity-0 group-hover:opacity-100 transition-all z-10">
                                    <ChevronRight size={16} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Navigation */}

                    {roomImages.length > 1 && (
                      <div className="flex mt-5 gap-2 overflow-x-auto items-center scrollbar-hide">
                        {roomImages.map((img, idx) => (
                          <button
                            key={idx}
                            ref={(el) => {
                              thumbnailRefs.current[idx] = el;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(idx);
                            }}
                            className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                              currentImageIndex === idx
                                ? 'border-green-600 opacity-100'
                                : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full object-cover block h-full "
                            />
                          </button>
                        ))}
                      </div>
                    )}

                </div>

                {/* Room Details Section */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        {/* Header with Title & Price Badge */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-2">
                             <div>
                                <h3 className="text-[24px]   font-[600] text-gray-900 mb-1">{room.room_type}</h3>
                                <div className="flex items-center gap-4 text-gray-500 text-[14px] font-[400]">
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{occupancy.max_occ} Guests</span>
                                    </div>
                                    <div className="flex items-center gap-1">
{/*                                         <Maximize2 className="w-4 h-4" />
                                        <span>200sqft</span> */}
                                    </div>
                                </div>
                             </div>
                             
                             {/* Price Badge (Top Right) */}
                             <div className="text-left md:text-right mt-2 md:mt-0">
                                <span className="text-xs text-gray-500 block mb-1">+ ₹ {taxAmount} taxes & fees per night</span>
                                <div className="flex items-center gap-2 justify-start md:justify-end">
                                    <span className="text-gray-400 line-through text-lg">₹ {Math.round(basePrice * 1.5).toLocaleString()}</span>
                                    <div className="bg-[#1AB64F] text-white px-5 py-1 rounded-lg text-2xl ">
                                        ₹ {basePrice.toLocaleString()}
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Description */}
                        {(() => {
  const fullText = cleanDescription(room.description || room.short_description);
  const { short, isLong } = getShortDescription(fullText);

  return (
    <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-3xl">
      {short}
      { (
        <>
          {' '}
          <span
            onClick={(e) => handleMoreInfoClick(e, room)}
            className="text-[#D2A256] cursor-pointer hover:underline font-medium"
          >
            more info
          </span>
        </>
      )}
    </p>
  );
})()}

                    </div>

{/* Pricing Options (Matches Figma Boxes - Optimized) */}
{/* Pricing Options - Fully Dynamic Section */}

{/* Pricing Options (Matches Figma Boxes) */}
<div className="pt-5  border-gray-200">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Option 1: Base Price (Original "Room Only") */}
        <div className="flex flex-col justify-between border hover:border-[#D2A256] hover:bg-[#FFFBF4] rounded-xl p-4 relative h-full min-h-[120px]">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className=" text-[14px] font-[600] text-gray-900">Room Only</div>
                    <div onClick={handlePolicyClick} className="text-[12px] font-[400] text-[#4A5565] underline cursor-pointer">Inclusions & Policies</div>
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-green-600  text-lg">INR {Math.round(basePrice).toLocaleString()}</span>
                        <span className="text-gray-400 line-through text-xs">INR {Math.round(basePrice * 1.5).toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">(for 1 night) Incl. of taxes & fees</div>
                </div>
            </div>
            <button 
                onClick={(e) => handleBookNowClick(e, room)}
                className="w-full bg-black text-white text-[12px] font-[600] uppercase py-3 rounded-lg mt-3 hover:bg-gray-800 transition-colors tracking-wide"
            >
                BOOK NOW
            </button>
        </div>

      
        {services && services
            .filter((s: any) => s.roomTypes?.room_type === room.room_type)
            .slice(0, 2) 
            .map((service: any) => {
                const sRetail = Number(service.price.preTaxRetailPrice) || 0; 
                const sRack = Number(service.price.preTaxRackRate) || 0;
                
                const totalPrice = Number(basePrice) + sRetail; 
                const totalRack = (Number(basePrice) * 1.5) + sRack;

                return (
                    <div key={service.id} className="flex flex-col justify-between border hover:border-[#D2A256] hover:bg-[#FFFBF4] border-gray-200 bg-white rounded-xl p-4 relative h-full min-h-[120px] opacity-80 hover:opacity-100 transition-opacity">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-bold text-gray-900">{service.name} Included</div>
                                {/* Particular Service Details Click */}
                                <div 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onServiceDetailClick(service);
                                        
                                    }} 
                                    className="text-[11px] text-[#D2A256] underline cursor-pointer"
                                >
                                    Details
                                </div>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-green-600  text-lg">INR {Math.round(totalPrice).toLocaleString()}</span>
                                    <span className="text-gray-400 line-through text-xs">INR {Math.round(totalRack).toLocaleString()}</span>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1">Room + {service.name}</div>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => handleBookNowClick(e, {
                                ...room,
                                price: {
                                    ...room.price,
                                    retail_price: totalPrice.toFixed(2),
                                    retail_tax_price: taxPrice.toFixed(2)
                                },
                                serviceDetails: service 
                            })}
                            className="w-full bg-black text-white text-[11px] font-bold uppercase py-3 rounded-lg mt-3 hover:bg-gray-800 transition-colors tracking-wide"
                        >
                            BOOK NOW
                        </button>
                    </div>
                );
            })
        }

       
        {(!services || services.filter((s: any) => s.roomTypes?.room_type === room.room_type).length === 0) && (
             <div className="hidden md:flex items-center justify-center border border-dashed border-gray-200 rounded-xl p-4 min-h-[120px] text-gray-400 text-xs text-center">
                 No additional service bundles available for this room
             </div>
        )}

    </div>
</div>
                </div>
            </div>
        </div>
    );
};

export default RoomCard;