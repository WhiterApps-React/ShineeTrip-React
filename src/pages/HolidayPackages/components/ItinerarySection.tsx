import { Plane, Car, Hotel, ChevronDown, MapPin } from "lucide-react";
import { useState } from "react";

interface ItinerarySectionProps {
  days: any[];
  holiday: any;
  summary: any; // Dedicated Summary API data
}

export const ItinerarySection = ({ days, holiday, summary }: ItinerarySectionProps) => {
  // Default pehla din open rakhenge
  const [openDay, setOpenDay] = useState(days[0]?.dayNumber || 1);

  // Summary API se total counts nikal rahe hain chips ke liye
  const stats = summary?.days?.reduce((acc: any, curr: any) => ({
    hotels: acc.hotels + (curr.hotels || 0),
    flights: acc.flights + (curr.flightsAndTransfers || 0),
    activities: acc.activities + (curr.activities || 0),
    meals: acc.meals + (curr.meals || 0),
  }), { flights: 0, hotels: 0, activities: 0, meals: 0 }) || null;

  const getValidImage = (imgUrl: string) => {

  if (!imgUrl || imgUrl === "data:;base64,=" || imgUrl.trim() === "") {
    return "https://images.unsplash.com/photo-1512100356956-c1227c331701?q=80&w=1000"; // Fallback Image
  }
  return imgUrl;
};

  return (
    <div className="w-full font-opensans text-[18px]">
      {/* 1. Top Summary Chips (Real counts from Summary API) */}
     <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm mb-8">
  <div className="flex flex-wrap gap-4">
    {/* 1. Day Plan Badge */}
    <span className="bg-[#F8F8F8] text-[#2C4A5E] px-6 py-3 rounded-full text-[16px] font-bold tracking-wider font-opensans border border-gray-50 shadow-sm">
      {holiday?.days || summary?.totalDays || 0} DAY PLAN
    </span>

    {stats && (
      <>
        {/* 2. Flights & Transfers Badge */}
        <span className="bg-[#F8F8F8] text-[#444] px-6 py-3 rounded-full text-[16px] font-bold tracking-wider uppercase font-opensans border border-gray-50 shadow-sm">
          {stats.flights} FLIGHTS & TRANSFERS
        </span>

        {/* 3. Hotels Badge */}
        <span className="bg-[#F8F8F8] text-[#444] px-6 py-3 rounded-full text-[16px] font-bold tracking-wider uppercase font-opensans border border-gray-50 shadow-sm">
          {stats.hotels} HOTELS
        </span>

        {/* 4. Activities Badge */}
        <span className="bg-[#F8F8F8] text-[#444] px-6 py-3 rounded-full text-[16px] font-bold tracking-wider uppercase font-opensans border border-gray-50 shadow-sm">
          {stats.activities} ACTIVITIES
        </span>

        {/* 5. Meals Badge */}
        <span className="bg-[#F8F8F8] text-[#444] px-6 py-3 rounded-full text-[16px] font-bold tracking-wider uppercase font-opensans border border-gray-50 shadow-sm">
          {stats.meals} MEALS
        </span>
      </>
    )}
  </div>
</div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 md:p-8">
  <div className="flex flex-col md:flex-row gap-10">
        
        {/* Left Side: Day Plan Sticky Navigation */}
        <div className="hidden bg-gray-200 p-5 rounded-2xl md:block w-36 shrink-0 h-fit sticky top-40">
          {/* Updated text size */}
          <p className="font-semibold text-[17px] mb-4 text-[#2C4A5E] font-opensans">DAY PLAN</p>
          <div className="space-y-6 relative border-l-2 border-gray-100 ml-2">
            {days.map((day: any) => (
              <div 
                key={day.id} 
                onClick={() => setOpenDay(day.dayNumber)}
                className="relative pl-6 cursor-pointer group"
              >
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-colors ${openDay === day.dayNumber ? 'bg-[#000000] border-[#000000]' : 'bg-white border-gray-300'}`} />
                {/* Updated text size to 18px */}
                <p className={`text-[17px] font-bold font-opensans ${openDay === day.dayNumber ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`}>
                   Day {day.dayNumber}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Expandable Itinerary Content */}
        <div className="flex-grow space-y-4">
          {days.map((day: any) => {
            const daySummary = summary?.days?.find((d: any) => d.dayNumber === day.dayNumber);
            
            return (
              <div key={day.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div 
                  onClick={() => setOpenDay(openDay === day.dayNumber ? 0 : day.dayNumber)}
                  className="bg-[#9c9e9f] text-white px-5 py-3 flex justify-between items-center cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Updated text size */}
                    <span className="bg-white/20 px-3 py-1 rounded text-[16px] font-bold uppercase font-opensans">DAY {day.dayNumber}</span>
                    {/* Updated text size */}
                    <p className="text-[16px] font-medium font-opensans">
                      {day.title} • 
                      {/* Updated sub-text size */}
                      <span className="text-gray-300 uppercase text-[12px] ml-2 font-opensans">
                        Included: {daySummary?.hotels ? '1 Hotel | ' : ''}{daySummary?.flightsAndTransfers ? 'Transport | ' : ''}{daySummary?.activities ? `${daySummary.activities} Activities` : ''}
                      </span>
                    </p>
                  </div>
                  <ChevronDown size={20} className={`transition-transform ${openDay === day.dayNumber ? 'rotate-180' : ''}`} />
                </div>

                {openDay === day.dayNumber && (
                  <div className="p-6 space-y-10 animate-in fade-in slide-in-from-top-2">
                    
                    {day.items?.map((item: any) => {
                      const meta = item.metadata || {};

                      // 1. FLIGHT SECTION
                      if (item.type === 'flight') {
                        return (
                          <div key={item.id} className="flex gap-6">
                            <Plane size={20} className="text-gray-800 mt-1" />
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-4">
                                {/* Updated text size */}
                                <p className="font-bold text-[18px] uppercase font-opensans">Flight</p>
                                {/* Updated text size */}
                                <span className="text-gray-400 text-[16px] font-opensans">• {meta.departureCity} to {meta.arrivalCity} • {meta.durationText || 'N/A'}</span>
                              </div>
                              <div className="bg-[#F9F9F9] rounded-xl p-6 flex items-center justify-between border border-gray-50">
                                <div className="flex items-center gap-6">
                                   <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border shadow-sm p-1 overflow-hidden">
                                     {meta.airline_logo ? (
                                       <img src={meta.airline_logo} alt="Airline" className="w-8" />
                                     ) : (
                                       <Plane size={16} className="text-gray-300" />
                                     )}
                                   </div>
                                   <div className="text-center">
                                      {/* Updated time text size */}
                                      <p className="font-bold text-xl font-opensans">{meta.departureTime || '--:--'}</p>
                                      {/* Updated city text size */}
                                      <p className="text-[16px] text-gray-500 font-bold uppercase font-opensans">{meta.departureCity || 'City'}</p>
                                   </div>
                                   <div className="flex flex-col items-center px-4">
                                      {/* Updated text size */}
                                      <span className="text-[14px] text-gray-400 italic font-opensans">Non-stop</span>
                                      <div className="w-24 h-[1px] bg-gray-300 relative border-t border-dashed">
                                          <div className="absolute top-1/2 -right-1 w-1 h-1 bg-gray-400 rounded-full" />
                                      </div>
                                   </div>
                                   <div className="text-center">
                                      {/* Updated time text size */}
                                      <p className="font-bold text-xl font-opensans">{meta.arrivalTime || '--:--'}</p>
                                      {/* Updated city text size */}
                                      <p className="text-[16px] text-gray-500 font-bold uppercase font-opensans">{meta.arrivalCity || 'City'}</p>
                                   </div>
                                </div>
                                <div className="text-[18px] font-medium text-gray-600 space-y-1 font-opensans">
                                  <p>Cabin: {meta.cabinBaggage || '7Kgs'}</p>
                                  <p>Check-in: {meta.checkInBaggage || '15Kgs'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }


                      // 2. HOTEL SECTION
                      if (item.type === 'hotel') {
                        return (
                          <div key={item.id} className="flex gap-6 border-t pt-8 border-gray-100">
                            <Hotel size={20} className="text-gray-800 mt-1" />
                            <div className="flex-grow">
                              <p className="font-bold text-[18px] uppercase mb-4 font-opensans">
                                Hotel <span className="text-gray-400 font-normal text-[16px] font-opensans">• Stay in {meta.location || 'Dest'} • {meta.nights || '0'} Night</span>
                              </p>
                              <div className="flex flex-col lg:flex-row gap-6">
                                {/* Image Logic Fixed */}
                                {item.image || meta.hotel_image ? (
                                  <img 
                                    src={getValidImage(item.image || meta.hotel_image)} 
                                    className="w-full lg:w-64 h-40 object-cover rounded-2xl" 
                                    alt="Hotel" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full lg:w-64 h-40 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-[14px] text-center px-4 font-opensans">
                                    No Hotel Image Provided
                                  </div>
                                )}
                      
                                <div className="flex-grow">
                                  <h4 className="font-bold text-xl text-gray-800 font-opensans">{meta.name || meta.hotel_name || 'Property Name'}</h4>
                                  <div className="flex items-center gap-1 my-1">
                                    {Array.from({ length: meta.starRating || 0 }).map((_, s) => (
                                      <span key={s} className="text-green-500 text-[14px]">★</span>
                                    ))}
                                    <span className="text-[14px] text-gray-400 ml-2 font-opensans">Verified Property</span>
                                  </div>
                                  <p className="font-bold text-[#2EB159] text-[18px] mt-3 font-opensans">{meta.roomType || 'Standard Room'}</p>
                                  
                                  {/* List Logic Fixed */}
                                  <ul className="mt-2 space-y-1">
                                    {meta.mealInclusions ? (
                                      meta.mealInclusions.map((inc: string, i: number) => (
                                        <li key={i} className="text-[16px] text-gray-600 flex items-center gap-2 font-opensans">✔ {inc}</li>
                                      ))
                                    ) : meta.highlights ? (
                                      meta.highlights.map((h: any, i: number) => (
                                        <li key={i} className="text-[16px] text-gray-600 flex items-center gap-2 font-opensans">✔ {h}</li>
                                      ))
                                    ) : (
                                      <li className="text-[16px] text-gray-400 italic font-opensans">Confirmed as per booking</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      // 3. SIGHTSEEING SECTION (Adding this for Day 2 & 3)
                      if (item.type === 'sightseeing') {
                        return (
                          <div key={item.id} className="flex gap-6 border-t pt-8 border-gray-100">
                            <MapPin size={20} className="text-red-500 mt-1" />
                            <div className="flex-grow">
                              <p className="font-bold text-[18px] uppercase mb-4 font-opensans">Sightseeing <span className="text-gray-400 font-normal text-[16px] font-opensans">• {meta.location} • {meta.durationText || 'Full Day'}</span></p>
                              <div className="flex flex-col lg:flex-row gap-6">
                                {item.image ? (
                                  <img 
                                    src={getValidImage(item.image)} 
                                    className="w-full lg:w-64 h-40 object-cover rounded-2xl" 
                                    alt="Sightseeing" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600";
                                    }}
                                  />
                                ) : (
                                  <div className="w-full lg:w-64 h-40 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-[14px] font-opensans">Sightseeing Image</div>
                                )}
                                <div className="flex-grow">
                                  <h4 className="font-bold text-xl text-gray-800 font-opensans">{meta.title}</h4>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {meta.highlights?.map((h: string, i: number) => (
                                      <span key={i} className="text-[14px] bg-red-50 text-red-600 px-2 py-1 rounded-md font-bold border border-red-100 uppercase font-opensans">✓ {h}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 4. TRANSFER/CAR SECTION
                      if (item.type === 'transfer' || item.type === 'car') {
                        return (
                          <div key={item.id} className="flex gap-6 border-t pt-8 border-gray-100">
                            <Car size={20} className="text-gray-800 mt-1" />
                            <div className="flex-grow">
                              <p className="font-bold text-[18px] uppercase mb-4 font-opensans">Transfer <span className="text-gray-400 font-normal text-[16px] font-opensans">• {meta.subtitle || 'Route'} • {meta.durationText || 'N/A'}</span></p>
                              <div className="flex gap-5 items-center">
                                {item.image ? (
                                  <img 
                                    src={getValidImage(item.image)} 
                                    className="w-48 h-28 object-cover rounded-xl" 
                                    alt="Transfer" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600";
                                    }}
                                  />
                                ) : (
                                  <div className="w-48 h-28 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-[14px] text-center px-4 font-opensans">Vehicle Visuals Not Provided</div>
                                )}
                                <div>
                                  <h4 className="font-bold text-lg text-gray-800 font-opensans">{meta.name || 'Private Transfer'}</h4>
                                  <p className="text-[16px] text-gray-500 mt-1 font-opensans">{meta.transferType === 'private' ? 'Private AC Vehicle' : 'Shared Transport'}</p>
                                  <p className="text-[16px] text-gray-500 mt-1 italic font-medium font-opensans">{meta.luggage || 'Standard Luggage'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Fallback description */}
                    {(!day.items || day.items.length === 0) && (
                      <div className="pl-11">
                        <p className="text-[18px] text-gray-600 leading-relaxed italic font-opensans">Leisure day at your own pace. All mentioned inclusions remain confirmed.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      </div>
  );
};