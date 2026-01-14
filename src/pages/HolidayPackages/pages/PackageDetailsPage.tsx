import { useState, useEffect } from "react";
import { useLocation, useParams , useSearchParams } from "react-router-dom"; 
import { PackageGallery } from "../components/PackageGallery";
import { PricingSidebar } from "../components/PricingSidebar";
import { PackageTabs } from "../components/PackageTabs";
import { HolidaySearch } from "../components/HolidaySearch";
import { ItinerarySection } from "../components/ItinerarySection";
import { SummarySection } from "../components/SummarySection"; 
import { GalleryModal } from "../components/GalleryModal";

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

  // FIX: Modal se 'flight' ya 'land' aa raha hai (Variable name: type)
  // Hum ise defaultOption banayenge jo PricingSidebar use karega
  const userPreference = location.state?.type || 'flight';

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const token = sessionStorage.getItem("shineetrip_token");
        const headers = { 
          'accept': 'application/json',
          'Authorization': `Bearer ${token}` 
        };

        const [resItinerary, resPrice, resGallery] = await Promise.all([
          fetch(`http://46.62.160.188:3000/itineraries?holidayPackageId=${id}`, { headers }),
          fetch(`http://46.62.160.188:3000/holiday-package-prices/package/${id}`, { headers }),
          fetch(`http://46.62.160.188:3000/holiday-package-image-categories/package/${id}`, { headers })
        ]);

        const itiJson = await resItinerary.json();
        const priceJson = resPrice.ok ? await resPrice.json() : null;
        const galleryJson = await resGallery.json();

        setPriceData(priceJson);
        if (Array.isArray(galleryJson)) {
          setGalleryData(galleryJson);
        }

        if (Array.isArray(itiJson) && itiJson.length > 0) {
          const mainItinerary = itiJson[0]; 
          setItineraryData(mainItinerary);

          const calculatedSummary = {
            id: mainItinerary.id,
            totalDays: mainItinerary.days?.length || 0,
            grandTotal: priceJson?.total_price_per_adult || mainItinerary.holidayPackage?.price?.total_price_per_adult || 0,
            discount: priceJson?.discount || 0, // Discount add kiya yahan
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
      <p className="text-[#5A5550] font-bold tracking-widest uppercase text-[10px]">Syncing Luxury Experience...</p>
    </div>
  );

  if (!itineraryData) return (
    <div className="h-screen w-full flex items-center justify-center bg-white font-bold text-gray-400 text-center p-6">
      Package details currently unavailable.
    </div>
  );

  const holiday = itineraryData.holidayPackage;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-opensans animate-in fade-in duration-700">
      <div className="pt-30"> 
        <HolidaySearch 
        isDetailsPage={true}
        persons={persons} 
        setPersons={setPersons}
        />
      </div>

      <PackageGallery 
        heroImage={holiday?.hero_image}
        title={holiday?.title}
        onOpenGallery={() => setIsGalleryOpen(true)} 
        imageCategories={galleryData} 
      />

      <GalleryModal 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)} 
        title={holiday?.title} 
        imageCategories={galleryData} 
      />
      
      <PackageTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8">
            {activeTab === 'itineraries' && (
              <ItinerarySection 
                days={itineraryData.days || []} 
                holiday={holiday}
                summary={summaryData} 
              />
            )}
            
            {activeTab === 'summary' && (
              <SummarySection 
                days={itineraryData.days || []}
                summary={summaryData} 
              />
            )}
            
            {activeTab === 'policies' && (
  <div className="p-8 bg-white rounded-[30px] border border-gray-100 shadow-sm animate-in fade-in duration-500">
    <h3 className="text-xl font-bold text-[#2C4A5E] mb-6 border-b pb-4">
      Policies & Cancellation
    </h3>
    
    <div 
      /* break-words aur overflow-hidden lagane se text bahar nahi bhagega */
      className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-dashed overflow-hidden wrap-break-word"
      style={{ 
        wordBreak: 'break-word', 
        overflowWrap: 'anywhere' 
      }}
      dangerouslySetInnerHTML={{ 
        __html: holiday?.policies || "Standard policies apply." 
      }} 
    />
  </div>
)}
          </div>

          <div className="lg:col-span-4">
            {/* FIX: Passing 'userPreference' which is now either 'flight' or 'land' */}
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
  );
};

export default PackageDetailsPage;