import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { getAuth, onIdTokenChanged } from "firebase/auth"; // Firebase imports
import { Navbar } from "./pages/Navbar";
import Footer from "./pages/LandingPage/Footer";
import DiscoverAdventure from "./pages/LandingPage/Dsicoveradventure";
import Testimonials from "./pages/LandingPage/Testimonials";
import ContactForm from "./pages/LandingPage/ContactForm";
import RoomBookingPage from "./pages/Properties_details";
import BookingPage from "./pages/Payment_Page";
import HotelListingPage from "./pages/Hotel_listing_page";
import Tourspackages from "./pages/Tour_packages";
import HeroSection from "./pages/LandingPage/HeroSection";
import AboutPage from "./AboutPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CustomerProfilePage from "./pages/CustomerProfilePage";
import MyBookingsPage from "./pages/MyBookingsPage";
import HolidayPackages from "./pages/HolidayPackages/pages/HolidayPackages";
import PackageDetailsPage from "./pages/HolidayPackages/pages/PackageDetailsPage";
import PackageBookingPage from "./pages/HolidayPackages/pages/PackageBookingPage";
import WriteBrandReview from "./components/ui/WriteBrandReview";

// --- AUTH OBSERVER COMPONENT ---
// --- AUTH OBSERVER COMPONENT (FIXED) ---
const AuthObserver = () => {
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
       
        
        try {
          console.log("🔄 User detected, syncing token...");
          // Token generate karo
          const newToken = await user.getIdToken(true);
          
        
          sessionStorage.setItem("shineetrip_token", newToken);
          sessionStorage.setItem("shineetrip_uid", user.uid);
          
          console.log("✅ Session Restored!");
        } catch (error) {
          console.error("❌ Token sync failed:", error);
        }
      } else {
      
        console.log("🔒 No user found. Clearing storage.");
        sessionStorage.clear();
        localStorage.clear();
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return null; 
};

const App: React.FC = () => {
  return (
    <>
     
      <AuthObserver /> 
      
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <section id="home">
                <HeroSection />
              </section>

              <section id="adventure">
                <DiscoverAdventure />
              </section>

              <section id="testimonials">
                <Testimonials />
              </section>

              <section id="contact">
                <ContactForm />
              </section>
            </>
          }
        />
        <Route path="/write-review" element={<WriteBrandReview/>}/>
        <Route path="/room-booking/:hotelId" element={<RoomBookingPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/hotellists" element={<HotelListingPage />} />
        <Route path="/tours" element={<Tourspackages />} />
        <Route path="/profile" element={<CustomerProfilePage />} />
        <Route path="/mybooking" element={<MyBookingsPage />} />

        <Route path="/holiday-packages" element={<HolidayPackages />} />
        <Route path="/package-detail/:id" element={<PackageDetailsPage />} />
        <Route path="/package-booking" element={<PackageBookingPage />} />

        <Route path='/about' element={<AboutPage />} />
        <Route path='/privacy-policy' element={<PrivacyPolicy />} />
      </Routes>

      <Footer />
    </>
  );
};

export default App;