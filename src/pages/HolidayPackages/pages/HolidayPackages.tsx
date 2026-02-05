import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import Footer from "@/pages/LandingPage/Footer";
import { HolidaySearch } from "../components/HolidaySearch";
import { PackageCard } from "../components/PackageCard";
import { Navbar } from "@/pages/Navbar";

const HolidayPackages = () => {
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- SORTING STATE ---
  const [sortBy, setSortBy] = useState("Most Popular");

  const [persons, setPersons] = useState(Number(searchParams.get("persons")) || 1);
  const currentCity = searchParams.get("city") || "";
  const currentDate = searchParams.get("departureDate") || "";

  const sortOptions = [
    "Most Popular",
    "Price - Low to High",
    "Price - High to Low",
    "Duration - Short to Long",

  ];

  // --- FETCH PACKAGES (Original API Logic) ---
  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const city = searchParams.get("city");
        const date = searchParams.get("departureDate");
        const token = sessionStorage.getItem("shineetrip_token");

        const queryParams = new URLSearchParams();
        queryParams.append("page", "1");
        queryParams.append("limit", "50");

        if (city) queryParams.append("city", city);
        if (date) queryParams.append("departureDate", date);

        const baseUrl = `http://46.62.160.188:3000/holiday-package?${queryParams.toString()}`;

        const response = await fetch(baseUrl, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const result: any = await response.json();
        console.log("Fetched Packages:", result);
        let finalData = result.data || result || [];

        // Client Side Filtering Logic
        if (city || date) {
          const searchCity = city ? city.toLowerCase().trim() : "";
          const searchDate = date;

          const filtered = finalData.filter((pkg: any) => {
            const matchCity = searchCity ? (
              pkg.title?.toLowerCase().includes(searchCity) ||
              (Array.isArray(pkg.included_cities) && pkg.included_cities.some((c: string) => c.toLowerCase().includes(searchCity))) ||
              pkg.city?.toLowerCase().includes(searchCity)
            ) : true;

            const matchDate = searchDate ? (
              pkg.itinerary?.startDate === searchDate
            ) : true;

            return matchCity && matchDate;
          });

          console.log(`Search Results:`, filtered);
          setPackages(filtered);
        } else {
          setPackages(finalData);
        }

      } catch (error) {
        console.error("Failed to fetch packages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [searchParams]);


  const sortedPackages = useMemo(() => {
    let sorted = [...packages];

    // Helper to get price safely
    const getPrice = (pkg: any) => {
      const price = pkg.price?.total_price_per_adult || pkg.price?.base_fare || 0;
      return parseFloat(price);
    };


    const getDays = (pkg: any) => {

      const daysFromItinerary = pkg.itinerary?.days?.length || 0;
      const directDays = Number(pkg.days);
      const derivedFromNights = pkg.nights ? Number(pkg.nights) + 1 : 0;

      // Valid day count return karega
      return directDays || daysFromItinerary || derivedFromNights || 0;
    };

    switch (sortBy) {
      case "Price - Low to High":
        sorted.sort((a, b) => getPrice(a) - getPrice(b));
        break;

      case "Price - High to Low":
        sorted.sort((a, b) => getPrice(b) - getPrice(a));
        break;

      case "Duration - Short to Long":
        sorted.sort((a, b) => getDays(a) - getDays(b));
        break;

      case "Duration - Long to Short":
        sorted.sort((a, b) => getDays(b) - getDays(a));
        break;

      case "Most Popular":
      default:
        break;
    }
    return sorted;
  }, [packages, sortBy]);


  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navbar />
      <div className="h-64 bg-[#263238] flex items-center justify-center pt-20">
        <h1 className="text-white text-3xl font-bold font-opensans tracking-tight">
          Find Your Perfect Holiday
        </h1>
      </div>

      <HolidaySearch
        isDetailsPage={false}
        persons={persons}
        setPersons={setPersons}
        initialCity={currentCity}
        initialDate={currentDate}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* --- SORT BY SECTION --- */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <div className="hidden sm:flex items-center gap-2 text-gray-900 font-[700] text-sm">
              <SlidersHorizontal className="w-4 h-4 text-[#D2A256]" />
              <span className="text-[18px] font-opensans">Sort By:</span>
            </div>

            <div className="flex gap-4 flex-wrap justify-center">
              {sortOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`
                                px-4 py-1.5 rounded-full text-[15px] font-[600] border transition-all duration-200
                                ${sortBy === option
                      ? "bg-[#D2A256] text-white border-[#D2A256]" // Active
                      : "bg-white text-gray-700 border-[#E0DACF] hover:bg-[#D2A256] hover:text-white hover:border-[#D2A256]" // Inactive
                    }
                            `}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#2C4A5E]">
            {searchParams.get("city") ? `${searchParams.get("city")} Packages` : "Available Packages"}
          </h2>
          <p className="text-gray-500">Curated experiences for your next trip</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C9A961]"></div>
            <p className="text-sm font-medium text-gray-400">Fetching packages...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* HERE: We map sortedPackages instead of packages */}
            {sortedPackages.length > 0 ? (
              sortedPackages.map((pkg: any) => (
                <PackageCard
                  key={pkg.id}
                  data={pkg}
                  persons={persons}
                  currentCity={currentCity}
                  currentDate={currentDate}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-24 bg-white rounded-[32px] border-2 border-dashed border-gray-100">
                <p className="text-gray-400 font-bold text-lg">No packages found for this search.</p>
                <p className="text-sm text-gray-400">Try searching for a different city or date.</p>
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
};

export default HolidayPackages;