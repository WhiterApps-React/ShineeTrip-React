import { useState, useEffect } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { PackageGallery } from "../components/PackageGallery";
import { PricingSidebar } from "../components/PricingSidebar";
import { PackageTabs } from "../components/PackageTabs";
import { HolidaySearch } from "../components/HolidaySearch";
import { ItinerarySection } from "../components/ItinerarySection";
import { SummarySection } from "../components/SummarySection";
import { GalleryModal } from "../components/GalleryModal";
import { NewSearch } from "../components/NewSearch";

const PackageDetailsPage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('itineraries');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [itineraryData, setItineraryData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [priceData, setPriceData] = useState<any>(null);
  const [galleryData, setGalleryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [persons, setPersons] = useState(Number(searchParams.get("persons")) || 1);
  const location = useLocation();

  const userPreference = location.state?.type || 'flight';

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const headers = { 'accept': 'application/json', 'Authorization': `Bearer ${token}` };

        const [resItinerary, resPrice, resGallery] = await Promise.all([
          fetch(`http://46.62.160.188:3000/itineraries?holidayPackageId=${id}`, { headers }),
          fetch(`http://46.62.160.188:3000/holiday-package-prices/package/${id}`, { headers }),
          fetch(`http://46.62.160.188:3000/holiday-package-image-categories/package/${id}`, { headers })
        ]);

        const itiJson = await resItinerary.json();
        const priceJson = resPrice.ok ? await resPrice.json() : null;
        const galleryJson = await resGallery.json();

        setPriceData(priceJson);
        if (Array.isArray(galleryJson)) setGalleryData(galleryJson);

        if (Array.isArray(itiJson) && itiJson.length > 0) {
          const mainItinerary = itiJson[0];
          setItineraryData(mainItinerary);
          console.log(mainItinerary);
          const calculatedSummary = {
            id: mainItinerary.id,
            totalDays: mainItinerary.days?.length || 0,
            grandTotal: priceJson?.total_price_per_adult || mainItinerary.holidayPackage?.price?.total_price_per_adult || 0,
            discount: priceJson?.discount || 0,
            days: mainItinerary.days?.map((day: any) => ({
              id: day.id,
              dayNumber: day.dayNumber,
              flightsAndTransfers: day.items?.filter((i: any) => i.type === 'flight' || i.type === 'transfer').length || 0,
              hotels: day.items?.filter((i: any) => i.type === 'hotel').length || 0,
              activities: day.items?.filter((i: any) => i.type === 'sightseeing').length || 0,
              meals: day.items?.filter((i: any) => i.type === 'meal').length || 0,
            })) || []
          };
          setSummaryData(calculatedSummary);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A961]"></div>
      <p className="text-[#5A5550] font-bold tracking-widest uppercase text-[18px] font-opensans">Syncing Luxury Experience...</p>
    </div>
  );

  const holiday = itineraryData?.holidayPackage;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-opensans animate-in fade-in duration-700">
      <div className="pt-33">
        <NewSearch isDetailsPage={true} persons={persons} setPersons={setPersons} />
      </div>

    <div className="max-w-100vw  mx-auto px-4 sm:px-6 lg:px-8 mt-5">
  {/* The White Card Container */}
 <div className=" rounded-[32px] border border-gray-100 shadow-xl overflow-hidden p-2 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col justify-between h-full">
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 px-2 md:px-8 ">
  <div className="space-y-2">
    {/* Title */}
            <h1
  className="text-2xl md:text-2xl font-extrabold text-[#2C4A5E] tracking-tight leading-tight"
  style={{ marginLeft: "70px" }}
>
      {holiday?.title}
    </h1>

    {/* Badges and Info */}
    <div className="flex flex-wrap items-center gap-4">
      <span className="bg-[#E3F2FD] text-[#3A96DA] text-xs font-bold px-4 py-2 rounded-xl border border-[#B3D9F2] shadow-sm uppercase tracking-wider" style={{ marginLeft: "70px" }}>
        {holiday?.nights}N / {holiday?.days}D
      </span>

      <span className="text-gray-300 hidden md:block">|</span>

      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>

        <span className="text-gray-500 font-medium text-sm md:text-base">
          {holiday?.included_cities?.join('|')}
        </span>
      </div>
    </div>
  </div>

  {/* Share Button */}
  <button
    onClick={() =>
      navigator.share
        ? navigator.share({ title: holiday?.title, url: window.location.href })
        : navigator.clipboard.writeText(window.location.href)
    }
    className="md:ml-auto group flex items-center gap-3 px-6 py-3 border border-gray-200 rounded-full text-xs font-bold hover:bg-[#2C4A5E] hover:text-white transition-all duration-300 text-[#2C4A5E] shadow-sm hover:shadow-md"
           
            
            style={{ marginRight: "70px" }}>
              
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
    SHARE
  </button>
</div>

    {/* Gallery Section inside the Card */}
    
      <PackageGallery 
        heroImage={holiday?.hero_image}
        title={holiday?.title}
        onOpenGallery={() => setIsGalleryOpen(true)} 
        imageCategories={galleryData} 
      />
     
          
          <div className="max-w-[1390px] z-50 rounded-2xl mx-auto w-full pt-6">
  <PackageTabs activeTab={activeTab} setActiveTab={setActiveTab} />
</div>

        </div>
         
</div>

      {isGalleryOpen && (
        <div className="fixed inset-0 z-[1000] bg-[#F2F2F] flex flex-col animate-in fade-in duration-500 p-4 md:p-6">
          <div className="flex-1 flex flex-col bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-200">
            <div className="w-full flex items-center justify-between border-b border-gray-100 bg-white" style={{ padding: '24px 40px' }}>
              <div className="flex items-center gap-8 overflow-hidden">
                <div className="flex flex-col min-w-0">
                  <h2 className="text-2xl font-bold text-[#2C4A5E] truncate max-w-[300px] md:max-w-none">{holiday?.title}</h2>
                  <div className="flex items-center gap-3 text-sm mt-1">
                    <span className="bg-[#E3F2FD] text-[#3A96DA] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#B3D9F2] shrink-0">
                      {holiday?.nights}N/{holiday?.days}D
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-400 font-medium truncate italic">{holiday?.included_cities?.join(' • ')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsGalleryOpen(false)} className="flex items-center gap-4 shrink-0 group">
                <span className="hidden md:inline text-[11px] font-bold text-gray-400 group-hover:text-black transition-colors tracking-[0.2em]">CLOSE</span>
                <div className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-full group-hover:rotate-90 transition-all duration-300 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <GalleryModal isOpen={true} onClose={() => setIsGalleryOpen(false)} title={holiday?.title} imageCategories={galleryData} />
            </div>
          </div>
        </div>
      )}



     {/* Increased width container from 7xl to 1440px */}
<div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
    
    {/* Left Content Side - Occupies 8.5 columns for a wider feel */}
    <div className="lg:col-span-8 xl:col-span-8.5">
      {activeTab === 'itineraries' && (
       
           <ItinerarySection days={itineraryData?.days || []} holiday={holiday} summary={summaryData} />

      )}

      {activeTab === 'summary' && (
        
          <SummarySection days={itineraryData?.days || []} summary={summaryData} />
       
      )}

      {activeTab === 'policies' && (
        <div className="p-10 bg-white rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="text-2xl font-bold text-[#2C4A5E] mb-6 border-b border-gray-50 pb-5">
            Policies & Cancellation
          </h3>
          <div 
            className="text-base text-gray-600 leading-relaxed bg-[#F9FAFB] p-8 rounded-3xl border border-dashed border-gray-200" 
            dangerouslySetInnerHTML={{ __html: holiday?.policies || "Standard policies apply." }} 
          />
        </div>
      )}
    </div>

    {/* Sidebar Side - Occupies remaining columns */}
    <div className="lg:col-span-4 xl:col-span-3.5">
      <div className="sticky top-28">
        <PricingSidebar 
          priceData={priceData || holiday?.price} 
          calculatedSummary={summaryData} 
          defaultOption={userPreference} 
          persons={persons} 
        />
      </div>
    </div>

  </div>
</div>
    </div>
  );
};

export default PackageDetailsPage; 