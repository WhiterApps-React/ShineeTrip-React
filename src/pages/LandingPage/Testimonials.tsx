"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"

// API URLS
const TESTIMONIAL_API_URL = 'http://46.62.160.188:3000/testimonials';
const CUSTOMER_API_BASE = 'http://46.62.160.188:3000/customers';

// --- TYPE DEFINITIONS ---
interface ApiTestimonial {
  id: number;
  rating: number;
  title: string;
  review: string;
  cu_name: string;
  cu_addr: string;
  cu_img: string | null;
  // We handle dynamic ID fields inside the map function using 'any'
  isApproved: boolean;
  created_at: string;
  updated_at: string;
}

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

// ✅ HELPER: Generate Letter Avatar URL
const generateLetterAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name.charAt(0))}&size=256&background=D2A256&color=fff&bold=true`;

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<FormattedTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIdx, setCurrIdx] = useState<number>(0);

  // Carousel Logic
  useEffect(() => {
    if (testimonials.length <= 3) return;
    const interval = setInterval(() => {
      setCurrIdx((prev) => {
        return prev + 3 >= testimonials.length ? 0 : prev + 3
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials])

  // Data Fetching Logic
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const token = sessionStorage.getItem('shineetrip_token');
        const response = await fetch(`${TESTIMONIAL_API_URL}?isApproved=true`);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data: ApiTestimonial[] = await response.json();

        // 3. Process Data & Fetch Customer Profiles
        const formattedData: FormattedTestimonial[] = await Promise.all(
          data.map(async (item, index) => {
            
            // ✅ FIX 1: Robust ID Extraction using 'any' casting
            // Backend fields vary (snake_case vs camelCase vs nested object)
            const targetId = 
                (item as any).customer_id || 
                (item as any).customerId || 
                (item as any).userId ||
                (item as any).customer?.id;

            // Default fallback
            let finalImageUrl = item.cu_img || generateLetterAvatar(item.cu_name || "U");

            // Debug Log (Development only - remove in prod)
            // console.log(`Item ${item.id} -> Target Customer ID:`, targetId);

            // 4. Fetch Fresh Image from Customer API
            if (targetId) {
              try {
                const headers: any = {};
                if (token) {
                  headers['Authorization'] = `Bearer ${token}`; 
                }

                const custRes = await fetch(`${CUSTOMER_API_BASE}/${targetId}`, {
                  headers: headers
                });

                if (custRes.ok) {
                  const custData = await custRes.json();
                  
                  // ✅ FIX 2: Check specifically for profile_image
                  if (custData.profile_image && custData.profile_image.trim() !== "") {
                    finalImageUrl = custData.profile_image;
                    // console.log(`Fetched Image for ID ${targetId}:`, finalImageUrl);
                  }
                }
              } catch (e) {
                console.warn(`Failed to fetch profile for ID ${targetId}`, e);
              }
            }

            return {
              id: item.id,
              name: item.cu_name || "Traveler",
              location: item.cu_addr || "India",
              package: item.title || "Trip", 
              content: item.review || "An unforgettable experience!",
              rating: item.rating || 5,
              image: finalImageUrl, 
              number: formatNumber(index),
            };
          })
        );

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
        <section className="py-20 bg-[#2C3C3C] min-h-[400px] flex items-center justify-center">
          <div className="flex gap-2 items-center text-[#D4A76A] animate-pulse">
             <span className="text-xl font-opensans">Loading Stories...</span>
          </div>
        </section>
      </div>
    );
  }

  if (error) return null;

  const displayItems = testimonials.slice(currentIdx, currentIdx + 3);
  
  if (displayItems.length < 3 && testimonials.length > 0) {
      const remaining = 3 - displayItems.length;
      displayItems.push(...testimonials.slice(0, remaining));
  }

  return (
    <div className="pt-12 bg-white">
      <section className="py-24 bg-[#2C3C3C] font-opensans overflow-hidden">
        <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Section */}
          <div className="text-center mb-16 relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex-1 max-w-[100px] sm:max-w-[180px] h-[1px] bg-[#D4A76A]/60"></div>
              <p className="text-[#D4A76A] font-medium tracking-[0.2em] text-[12px] uppercase">
                CLIENT STORIES
              </p>
              <div className="flex-1 max-w-[100px] sm:max-w-[180px] h-[1px] bg-[#D4A76A]/60"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-2 text-white leading-tight">Traveler</h2>
            <p className="text-4xl md:text-5xl text-[#D4A76A] font-light italic mb-6 font-serif">
              Testimonials
            </p>
            <p className="text-gray-300 text-[16px] max-w-3xl mx-auto leading-relaxed opacity-90">
              Discover why thousands of travelers trust us to create their most
              cherished memories across the world.
            </p>
          </div>

          {/* Dynamic Grid */}
          {testimonials.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border border-dashed border-gray-600 rounded-xl">
              <p className="text-sm tracking-wide">No approved stories available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {displayItems.map((testimonial, idx) => (
                  <div
                    key={`${testimonial.id}-${currentIdx}-${idx}`}
                    className="w-full animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-forwards"
                  >
                    <Card className="relative bg-[#364949] border border-white/5 p-8 h-[420px] flex flex-col justify-between group hover:-translate-y-2 transition-all duration-500 rounded-2xl shadow-xl hover:shadow-[#D4A76A]/10">
                      
                      <Quote className="absolute top-6 right-6 text-white/5 w-16 h-16 transform rotate-180 group-hover:text-[#D4A76A]/10 transition-colors duration-500" />

                      <div className="relative z-10">
                        <div className="flex gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < testimonial.rating
                                  ? "fill-[#D4A76A] text-[#D4A76A]"
                                  : "fill-gray-600/50 text-gray-600/50"
                              }
                            />
                          ))}
                        </div>

                        <div className="mt-8">
                            <span className="inline-block bg-[#233030] border border-[#D4A76A]/30 px-3 py-1.5 rounded-xl text-[#D4A76A] text-[12px] font-bold tracking-widest uppercase truncate max-w-[270px]">
                            {testimonial.package.length > 30 
                                ? testimonial.package.substring(0, 30) + "..." 
                                : testimonial.package}
                            </span>
                        </div>

                        <p className="text-gray-300 text-[15px] mt-10 leading-7 font-opensans line-clamp-5">
                          "{testimonial.content}"
                        </p>
                      </div>

                      <div className="flex items-center gap-4 pt-6 mt-auto border-t border-white/10">
                        {/* ✅ FIX 3: Direct Image Tag with Error Handling Logic */}
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#D4A76A]/30 shadow-lg bg-[#2C3C3C]">
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // console.log("Image load failed, switching to fallback:", testimonial.image);
                                e.currentTarget.src = generateLetterAvatar(testimonial.name);
                            }}
                          />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <p className="font-bold text-white text-[15px] truncate">
                            {testimonial.name}
                          </p>
                          <p className="text-[#D4A76A] text-[12px] mt-0.5 font-medium tracking-wide truncate max-w-[150px]">
                            {testimonial.location.length > 18
                                ? testimonial.location.substring(0, 18) + "..."
                                : testimonial.location}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}