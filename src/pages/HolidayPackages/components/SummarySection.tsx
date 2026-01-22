import { SummaryCityCard } from "./SummaryCityCard";

interface SummarySectionProps {
  days: any[]; // Itinerary days array from /itineraries
  summary: any;
}

export const SummarySection = ({ days, summary }: SummarySectionProps) => {
  
  const getGroupedSummary = () => {
    if (!summary || !summary.days) return [];

    const groupedCities: any[] = [];

    summary.days.forEach((summaryDay: any) => {
      
      const itineraryDay = days.find(d => d.id === summaryDay.id || d.dayNumber === summaryDay.dayNumber);
      
   
      const hotelCity = itineraryDay?.items?.find((i: any) => i.type === 'hotel')?.metadata?.location;
      const flightCity = itineraryDay?.items?.find((i: any) => i.type === 'flight')?.metadata?.arrivalCity;
      const sightseeingCity = itineraryDay?.items?.find((i: any) => i.type === 'sightseeing')?.metadata?.location;
      
      
      const cityName = (hotelCity || flightCity || sightseeingCity || "Goa").split(',')[0].trim();

      let cityGroup = groupedCities.find(c => c.cityName === cityName);


      const planText = itineraryDay?.items?.[0]?.metadata?.description || 
                        itineraryDay?.title || 
                        "Independent activities and leisure time.";

      const dayData = {
        ...summaryDay,
        plan: planText,
        // UI date formatting
        date: `Day ${summaryDay.dayNumber}` 
      };

      if (cityGroup) {
        cityGroup.days.push(dayData);
        cityGroup.nights = cityGroup.days.length; 
      } else {

        const transportItem = itineraryDay?.items?.find((i: any) => i.type === 'flight' || i.type === 'transfer');
        
        groupedCities.push({
          cityName: cityName,
          nights: 1,
          days: [dayData],
       
          transportInfo: transportItem ? {
            type: transportItem.type,
            from: transportItem.metadata?.departureCity || "Origin",
            to: cityName,
            time: transportItem.metadata?.departureTime || "TBA"
          } : null
        });
      }
    });

    return groupedCities;
  };

  const cityWiseData = getGroupedSummary();

 
  const totalActivities = summary?.days?.reduce((sum: number, day: any) => sum + (day.activities || 0), 0);
  const totalMeals = summary?.days?.reduce((sum: number, day: any) => sum + (day.meals || 0), 0);

  return (
    <div className="animate-in fade-in duration-500 font-opensans">
      
      {/* 1. Top Filter Chips */}
   <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 mb-8">
  <div className="flex flex-wrap gap-3">
    <span className="bg-[#F3F3F3] text-[#444] px-5 py-2.5 rounded-full text-[16px] font-opensans font-bold tracking-wider uppercase">
      {summary?.totalDays || days.length} DAY PLAN
    </span>

    <span className="bg-[#F3F3F3] text-[#444] px-5 py-2.5 rounded-full text-[16px] font-opensans font-bold tracking-wider uppercase">
      {totalActivities || 0} ACTIVITIES INCLUDED
    </span>

    <span className="bg-[#F3F3F3] text-[#444] px-5 py-2.5 rounded-full text-[16px] font-opensans font-bold tracking-wider uppercase">
      {totalMeals || 0} MEALS PLANNED
    </span>
  </div>
</div>

      {/* 2. Grouped Summary Cards */}
      {cityWiseData.length > 0 ? (
  <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
    <div className="space-y-6">
      {cityWiseData.map((city, index) => (
        <SummaryCityCard key={index} cityData={city} />
      ))}
    </div>
  </div>
) : (
  <div className="py-20 text-center bg-white rounded-[30px] border-2 border-dashed border-gray-100">
    <p className="text-gray-400 font-bold uppercase tracking-widest text-[18px] font-opensans">
      No Summary Data Available
    </p>
  </div>
)}

      {/* 3. Important Note */}
      <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-[25px] mt-6 flex items-start gap-4">
        {/* Updated: text-[10px] -> text-[18px] and added font-opensans */}
        <div className="bg-orange-100 p-2 rounded-full text-orange-600 text-[18px] font-opensans w-8 h-8 flex items-center justify-center font-bold">i</div>
        {/* Updated: text-[11px] -> text-[18px] and added font-opensans */}
        <p className="text-[18px] font-opensans text-orange-800 leading-relaxed font-medium">
          <span className="font-bold block mb-1 uppercase tracking-tighter">Booking Information:</span> 
          Your final itinerary total is {summary?.grandTotal ? `₹${summary.grandTotal.toLocaleString('en-IN')}` : 'calculated'} including all taxes, surcharges and listed activities.
        </p>
      </div>
    </div>
  );
};