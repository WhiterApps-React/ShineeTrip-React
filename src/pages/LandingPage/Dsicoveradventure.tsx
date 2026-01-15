"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GalleryModal } from "./HeroGalleryModal"; // Ensure path is correct
// ✅ 1. Import LoginModal
import { LoginModal } from "../Login/Loginpage"; 

interface Destination {
  name: string
  description: string
  image: string
  redirect_url: string
}

const chunkArray = (arr: Destination[], size: number) => {
    const chunkedArr = [];
    for (let i = 0; i < arr.length; i += size) {
        chunkedArr.push(arr.slice(i, i + size));
    }
    return chunkedArr;
};

const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export default function PopularDestinations() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ 2. Login Modal State
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ 3. Helper to Check Token Validity
  const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return true;
        return payload.exp < Date.now() / 1000;
    } catch (e) {
        return true;
    }
  };

  // ✅ 4. Auth Check Logic
  const checkAuth = () => {
    const token = sessionStorage.getItem("shineetrip_token");
    
    // Agar token nahi hai ya expired hai
    if (!token || isTokenExpired(token)) {
        // 🔥 Ye popup open karega agar login nahi hai
        setShowLoginPopup(true); 
        return false;
    }
    return true;
  };

  const fetchStates = async () => {
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        const res = await fetch("http://46.62.160.188:3000/home-pop-dests", { headers });
        if (!res.ok) throw new Error(`Failed to fetch`);
        const data = await res.json();

        const apiDestinations: Destination[] = data.map((item: any) => ({
          name: item.name,
          description: item.tagline || "Explore the best hotels here", 
          image: item.image || "", 
          redirect_url: item.redirect_url || "" 
        }));

        const filledData = [...apiDestinations, ...apiDestinations, ...apiDestinations].slice(0, 9);
        setDestinations(filledData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
  } 

  useEffect(() => { fetchStates() }, []); 

  // --- Click Handlers ---

  // 1. Explore All Button Click (Ispe usually login nahi mangte, par maanga hai to laga diya)
  const handleExploreAllClick = () => {
    // Agar tum chahte ho ki Explore All pe login na mange, to niche wali line comment kar do
    // if (!checkAuth()) return; 
    
    setIsModalOpen(true);
  };

  // 2. Normal Card Click (On Grid) - Yaha Login zaroori hai
  const handleClick = (dest: Destination) => {
    // ✅ Check Auth First
    if (!checkAuth()) return; 

    if (dest.redirect_url) {
        const separator = dest.redirect_url.includes('?') ? '&' : '?';
        const dateParams = `checkIn=${getTodayDateString()}&checkOut=${getTodayDateString()}&adults=2&children=0`;
        navigate(`${dest.redirect_url}${separator}${dateParams}`);
    } else {
        const query = new URLSearchParams({
            location: dest.name,
            checkIn: getTodayDateString(),
            checkOut: getTodayDateString(),
            adults: '2',
            children: '0'
        }).toString();
        navigate(`/hotellists?${query}`);
    }
  };

  // 3. Gallery Modal Image Click - Yaha bhi Login zaroori hai
  const handleModalImageClick = (imgData: any) => {
    // ✅ Check Auth First
    if (!checkAuth()) {
        // Agar auth fail hua, to checkAuth() khud Login Modal open kar dega.
        // Gallery modal khula rehne do, login ke baad user wapis try karega.
        return; 
    }

    // Login successful hai, ab aage badho
    setIsModalOpen(false);

    if (imgData.redirect_url) {
        const separator = imgData.redirect_url.includes('?') ? '&' : '?';
        const dateParams = `checkIn=${getTodayDateString()}&checkOut=${getTodayDateString()}&adults=2&children=0`;
        navigate(`${imgData.redirect_url}${separator}${dateParams}`);
    } else {
        const query = new URLSearchParams({
            location: imgData.city,
            checkIn: getTodayDateString(),
            checkOut: getTodayDateString(),
            adults: '2',
            children: '0'
        }).toString();
        navigate(`/hotellists?${query}`);
    }
  };

  const modalData = [{
      id: "popular-1",
      title: "Popular Collections",
      images: destinations.map((d, index) => ({
          id: index,
          image_url: d.image,
          city: d.name, 
          caption: d.description,
          redirect_url: d.redirect_url 
      }))
  }];

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const chunks = chunkArray(destinations, 3);

  return (
    <>
      <div className="w-full bg-white py-12 px-4 font-opensans">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-bold text-[#2C3C3C] mb-2">Popular Destinations</h2>
              <p className="text-gray-600">Top locations for your next holiday.</p>
            </div>
            
            <button 
                onClick={handleExploreAllClick} 
                className="border border-[#C9A86A] text-[#C9A86A] px-6 py-2 rounded-full font-semibold hover:bg-[#C9A86A] hover:text-white transition-all"
            >
              Explore All
            </button>
          </div>

          <div className="flex flex-col gap-8">
            {chunks.map((chunk, index) => {
               const isReverse = index % 2 !== 0;
               return (
                 <div key={index} className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-auto md:h-[600px]">
                   <div className={`relative ${isReverse ? 'md:order-2' : 'md:order-1'} md:col-span-1 row-span-2 h-[300px] md:h-full`}>
                      {chunk[0] && <Card dest={chunk[0]} onClick={handleClick} />}
                   </div>
                   <div className={`relative ${isReverse ? 'md:order-1' : 'md:order-2'} md:col-span-1 row-span-2 grid grid-rows-2 gap-4 h-[600px] md:h-full`}>
                      <div className="row-span-1 h-full">
                         {chunk[1] && <Card dest={chunk[1]} onClick={handleClick} />}
                      </div>
                      <div className="row-span-1 h-full">
                         {chunk[2] && <Card dest={chunk[2]} onClick={handleClick} />}
                      </div>
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      </div>

      {/* ✅ Gallery Modal */}
      <GalleryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="All Destinations"
        imageCategories={modalData} 
        onImageClick={handleModalImageClick} 
      />

      {/* ✅ Login Modal (Ye tab dikhega jab checkAuth fail hoga) */}
      <LoginModal 
        isOpen={showLoginPopup} 
        onClose={() => setShowLoginPopup(false)} 
      />
    </>
  )
}

const Card = ({ dest, onClick }: { dest: Destination, onClick: (d: Destination) => void }) => (
  <div 
    onClick={() => onClick(dest)}
    className="relative w-full h-full cursor-pointer group overflow-hidden rounded-[30px] shadow-sm border border-transparent"
  >
    <img 
      src={dest.image || "https://placehold.co/600x400?text=No+Image"} 
      alt={dest.name} 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
    <div className="absolute bottom-6 left-6 text-white">
      <h3 className="text-2xl font-bold mb-1">{dest.name}</h3>
      <p className="text-sm text-gray-200 opacity-90">{dest.description}</p>
    </div>
  </div>
);