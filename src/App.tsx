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
import EventsPage from "./pages/Events/Events";
import EventVenuesPage from "./pages/Events/EventVenuesPage";
import VenueDetailsPage from "./pages/Events/VenueDetailsPage";
import EventEnquiryPage from "./pages/Events/EventEnquiryPage";
import EventConfirmationPage from "./pages/Events/EventConfirmationPage";


// --- AUTH OBSERVER COMPONENT ---
// Baki imports same rahenge...

const AuthObserver = () => {
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          console.log("🔄 User detected (Tab Reopened), restoring session...");

          // 1. Token nikal ke wapas session me daalo
          const token = await user.getIdToken(true);
          sessionStorage.setItem("shineetrip_token", token);
          sessionStorage.setItem("shineetrip_uid", user.uid);
          
          if(user.email) sessionStorage.setItem("shineetrip_email", user.email);
          if(user.displayName) sessionStorage.setItem("shineetrip_name", user.displayName);

          // 2. IMPORTANT: Agar DB ID missing hai (Tab close hone se udd gayi thi), toh wapas fetch karo
          if (!sessionStorage.getItem("shineetrip_db_customer_id")) {
             try {
                // Tumhare existing API logic ka use karke ID layenge
                const res = await fetch(`http://46.62.160.188:3000/customers/0?email=${user.email}`, {
                   headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.ok) {
                   const data = await res.json();
                   const customer = Array.isArray(data) ? data[0] : data;
                   if (customer?.id) {
                      sessionStorage.setItem("shineetrip_db_customer_id", String(customer.id));
                      console.log("✅ DB Customer ID Restored:", customer.id);
                   }
                }
             } catch (err) {
                console.error("Failed to restore customer ID", err);
             }
          }

          // 3. Navbar ko signal bhejo ki "Data aa gaya hai, update ho jaao"
          window.dispatchEvent(new Event("session-restored"));

        } catch (error) {
          console.error("❌ Session restore failed:", error);
        }
      } else {
        // User logout hai
        sessionStorage.clear();
        // Logout ka signal bhejo
        window.dispatchEvent(new Event("session-restored"));
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


        <Route path="/events" element={<EventsPage />} />
        <Route path="/event-venues/:id" element={<EventVenuesPage />} />
        <Route path="/venue-details/:id" element={<VenueDetailsPage />} />
        <Route path="/event-enquiry/:venueId" element={<EventEnquiryPage />} />
        <Route path="/event-confirmation/:enquiryId" element={<EventConfirmationPage />} />



        <Route path='/about' element={<AboutPage />} />
        <Route path='/privacy-policy' element={<PrivacyPolicy />} />
      </Routes>

      <Footer />
    </>
  );
};

export default App;