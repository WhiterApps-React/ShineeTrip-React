"use client"

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card"
import { Star } from "lucide-react"

// API URL (Updated IP based on your curl)
const API_URL = 'http://46.62.160.188:3000/testimonials';

// --- TYPE DEFINITIONS ---

// 1. API Response Structure
interface ApiTestimonial {
  id: number;
  rating: number;
  title: string;
  review: string;
  cu_name: string;
  cu_addr: string;
  cu_img: string | null; // API might return null sometimes
  created_at: string;
  updated_at: string;
}

// 2. Component View Structure
interface FormattedTestimonial {
  id: number;
  name: string;
  location: string;
  package: string;
  content: string;
  rating: number;
  image: string;
  number: string;
}

// --- UTILITY ---
const formatNumber = (index: number): string => {
  return (index + 1).toString().padStart(2, '0');
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<FormattedTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx,setCurrIdx]=useState<number>(0);

  useEffect(()=>{
    if (testimonials.length <= 3) return;

    const interval= setInterval(()=>{

      setCurrIdx((prev)=>{
        return prev+3 >= testimonials.length ?0:prev+3
      });

    },4000);

    return () => clearInterval(interval);

  },[testimonials])

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiTestimonial[] = await response.json();

        // Data Mapping Logic
        const formattedData: FormattedTestimonial[] = data.map((item, index) => ({
          id: item.id,
        
          name: item.cu_name || "Happy Traveler", 
          location: item.cu_addr || "India", 
        
          package: item.title ? item.title.substring(0, 20) : "LUXURY STAY", 
          content: item.review || "An unforgettable experience!", 
          rating: item.rating || 5, 
          image: item.cu_img || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80",
          number: formatNumber(index),
        }));


        setTestimonials(formattedData);
        setError(null);

      } catch (err: any) {
        console.error("Failed to fetch testimonials:", err);
        setError("Failed to load testimonials.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (isLoading) {
    return (
      <div className="pt-12 bg-white">
        <section className="py-20 bg-[#2C3C3C] text-white text-center min-h-[400px] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
             <div className="h-4 w-32 bg-gray-600 rounded mb-4"></div>
             <div className="h-8 w-64 bg-gray-600 rounded"></div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
   
    return null; 
  }



  return (
    <div className="pt-12 bg-white">
      <section className="py-16 bg-[#2C3C3C] font-opensans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex-1 max-w-[180px] h-[1px] bg-[#D4A76A]"></div>
              <p className="text-[#D4A76A] font-medium tracking-[0.2em] text-[11px] uppercase">
                CLIENT STORIES
              </p>
              <div className="flex-1 max-w-[180px] h-[1px] bg-[#D4A76A]"></div>
            </div>
            <h2 className="text-5xl font-bold mb-0 text-white leading-tight">Traveler</h2>
            <p className="text-5xl text-[#D4A76A] font-light italic mb-5" style={{ fontFamily: 'serif' }}>
              Testimonials
            </p>
            <p className="text-white text-[15px] max-w-2xl mx-auto leading-relaxed opacity-90">
              Discover why thousands of travelers trust us to create their most<br />
              cherished memories across the world.
            </p>
          </div>

          {/* Dynamic Grid */}
          
    

          {testimonials.length === 0 ? (
            
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm tracking-wide">No stories available yet.</p>
            </div>
          ) : (
            /* ---------- Slider ---------- */
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                  transform: `translateX(-${(currentIdx / 3) * 100}%)`,
                }}
              >
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-3"
                  >
                    <Card className="relative bg-[#425656] border-0 p-15 overflow-hidden group hover:-translate-y-1 transition-all duration-300 rounded-sm  shadow-lg hover:shadow-2xl h-[537px]">

                      <div className="relative z-10 flex flex-col h-full">
                        {/* Background Quote Watermark */}
{/* <div className="absolute top-[-20px] right-4 opacity-20 pointer-events-none select-none">
  <svg
    width="160"
    height="160"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-[#D4A76A]"
  >
    <path
      d="M38 10
         C26 10 20 18 20 28
         C20 36 24 42 30 46
         C34 49 36 52 36 56
         V58
         H28
         V56
         C28 53 26 50 22 46
         C16 41 12 35 12 26
         C12 14 22 6 38 6"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</div> */}


                        
                        {/* Rating Stars */}
                        <div className="flex gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={
                                i < testimonial.rating
                                  ? "fill-[#D4A76A] text-[#D4A76A]"
                                  : "fill-gray-600 text-gray-600"
                              }
                            />
                          ))}
                        </div>

                        {/* Package Badge */}
                        <div className="mb-4">
                          <span className="bg-[#8B7355]/30 border border-[#A5865F]/50 px-3 py-1.5 rounded-sm text-[#D4A76A] text-[14px] font-bold tracking-[0.15em] uppercase">
                            {testimonial.package}
                          </span>
                        </div>

                        {/* Review Text */}
<p
  className="text-gray-200 mb-6 leading-relaxed text-[20px] font-opensans
             overflow-hidden line-clamp-10"
>
  "{testimonial.content}"
</p>



                        {/* User Info */}
                        <div className="flex items-center gap-4 mt-auto border-t border-white/10 pt-4">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[#D4A76A]/50">
                            <img
                              src={testimonial.image}
                              alt={testimonial.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80";
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-white text-[13px] leading-tight">
                              {testimonial.name}
                            </p>
                            <p className="text-[#D4A76A] text-[11px] mt-0.5 font-light">
                              {testimonial.location}
                            </p>
                          </div>
                        </div>

                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </section>
    </div>
  )
}