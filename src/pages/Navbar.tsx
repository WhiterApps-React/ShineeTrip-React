import { useState, useEffect } from "react";
import { Menu, X, User, Phone, Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../assets/Logo.png";
import HotelIcon from "../assets/Group.png";
import FlightIcon from "../assets/Airplane In Flight Bold Streamline Phosphor Bold.png";
import TrainIcon from "../assets/Train Streamline Sharp Line - Material Symbols.png";
import PackageIcon from "../assets/Package Streamline Phosphor Regular.png";
import EventIcon from "../assets/Event Streamline Carbon.png";
import { LoginModal } from "./Login/Loginpage";
import { getAuth, signOut } from "firebase/auth";


export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitial, setUserInitial] = useState("U");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";


useEffect(() => {
  const path = location.pathname.toLowerCase();

  // Hotel flow (list → detail → booking → payment)
  if (
    path.includes("hotel") ||
    path.includes("room") ||
    path.includes("booking") ||
    path.includes("payment")
  ) {
    setActiveTab("Hotels");
  }

  // Flights flow
  else if (path.includes("flight")) {
    setActiveTab("Flights");
  }

  // Trains flow
  else if (path.includes("train")) {
    setActiveTab("Trains");
  }

  // Holiday Packages
  else if (path.includes("package")) {
    setActiveTab("Holiday Packages");
  }

  // Events
  else if (path.includes("event")) {
    setActiveTab("Events");
  }

  // Landing page fallback
  else {
    setActiveTab("");
  }
}, [location.pathname]);



  // Check if user is logged in
  useEffect(() => {
  const token = sessionStorage.getItem("shineetrip_token");
  const name =  sessionStorage.getItem("shineetrip_name");

  // Check if token exists and is not a junk value
  if (token && token !== "undefined" && token !== "null" && token.length > 20) {
    setIsLoggedIn(true);
    if (name) {
      setUserInitial(name.charAt(0).toUpperCase());
    }
  } else {
    // Agar token galat hai toh clear kardo
    setIsLoggedIn(false);
    sessionStorage.removeItem("shineetrip_token");
  }

  // Storage listener for synchronization
  const handleStorageChange = () => {
    const newToken = sessionStorage.getItem("shineetrip_token");
    setIsLoggedIn(!!newToken);
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  const handleNavClick = (type: string) => {
    setActiveTab(type);
    navigate(`/?searchWidget=open&type=${type}`);
    scrollToSection("home");
  };

 
const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      
      sessionStorage.clear();
      localStorage.clear();
      
      // 3. UI Reset
      setIsLoggedIn(false);
      setShowUserMenu(false);
      
      // 4. Redirect & Refresh
      navigate("/");
      window.location.reload(); 
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };
  
  const handleLoginSuccess = () => {
    setIsModalOpen(false);
    const token = sessionStorage.getItem("shineetrip_token");
    const uid = sessionStorage.getItem("shineetrip_uid");
    const name = sessionStorage.getItem("shineetrip_name");
    const email = sessionStorage.getItem("shineetrip_email");

    if (token) {
      setIsLoggedIn(true);
      if (name) {
        setUserInitial(name.charAt(0).toUpperCase());
      } else if (email) {
        setUserInitial(email.charAt(0).toUpperCase());
      } else if (uid) {
        setUserInitial(uid.charAt(0).toUpperCase());
      }
    }
  };

  return (
    <>
      <nav className="fixed w-full bg-white backdrop-blur-md z-50 shadow-sm font-opensans">
        {/* Top Bar - Hidden on Landing Page */}
        {!isLandingPage && (
          <div className="w-full bg-[#263238] text-white py-2 px-4 sm:px-6 lg:px-8 hidden md:flex justify-between items-center text-sm font-medium">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-white" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-white" />
                <span>info@shineetrip.com</span>
              </div>
            </div>
            <div className="text-[#D2A256] tracking-wide">
              Himachal's Premier Luxury Travel Planner
            </div>
          </div>
        )}

        <div className="w-full">
          <div className="flex justify-between items-center h-20 px-4 sm:px-6 lg:px-8">
            {/* Logo - Leftmost */}
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer" 
              onClick={() => navigate("/")}
            >
              <img src={Logo} alt="Shinee Trip" className="h-12 w-auto" />
              <div className="flex flex-col">
                <span className="text-[#2C4A5E] font-medium text-2xl tracking-wide border-b-2 border-[#C9A961]">
                  SHINEE <span className="text-[#C9A961]">TRIP</span>
                </span>
              </div>
            </div>

            {/* Desktop Menu - Center */}
            <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
<button 
  onClick={() => handleNavClick("Hotels")} 
  className={`relative flex items-center gap-2 font-opensans font-medium 
  text-[18px] leading-[21px] transition-colors group ${
    activeTab === "Hotels"
      ? "text-[#C9A961]"
      : "text-black hover:text-[#C9A961]"
  }`}
>
  <img 
    src={HotelIcon} 
    alt="Hotels" 
    className="w-5 h-5 transition-all nav-icon"
    style={{
      filter: activeTab === "Hotels" 
        ? "brightness(0) saturate(100%) invert(63%) sepia(25%) saturate(1089%) hue-rotate(359deg)" 
        : "brightness(0)"
    }}
  />

  Hotels

  {/* underline */}
  <span
    className={`absolute left-0 -bottom-2 h-[2px] w-full bg-[#C9A961]
    transform scale-x-0 origin-left transition-transform duration-300
    group-hover:scale-x-100 ${
      activeTab === "Hotels" ? "scale-x-100" : ""
    }`}
  />
</button>

                              
<button
  onClick={() => handleNavClick("Flights")}
  className={`relative flex items-center gap-2 font-opensans font-medium
  text-[18px] leading-[21px] transition-colors group ${
    activeTab === "Flights"
      ? "text-[#C9A961]"
      : "text-black hover:text-[#C9A961]"
  }`}
>
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L13 19v-5.5l8 2.5Z"
      fill="currentColor"
    />
  </svg>

  Flights

  <span
    className={`absolute left-0 -bottom-2 h-[2px] w-full bg-[#C9A961]
    transform scale-x-0 origin-left transition-transform duration-300
    group-hover:scale-x-100 ${
      activeTab === "Flights" ? "scale-x-100" : ""
    }`}
  />
</button>




              <button 
                onClick={() => handleNavClick("Trains")} 
                className={`flex relative items-center gap-2 font-opensans font-medium text-[18px] leading-[21px] tracking-[0px] transition-colors group ${
                  activeTab === "Trains" ? "text-[#C9A961]" : "text-black hover:text-[#C9A961]"
                }`}
              >
                <img 
                  src={TrainIcon} 
                  alt="Trains" 
                  className="w-5 h-5 transition-all nav-icon"
                  style={{
                    filter: activeTab === "Trains" 
                      ? "brightness(0) saturate(100%) invert(63%) sepia(25%) saturate(1089%) hue-rotate(359deg)" 
                      : "brightness(0)"
                  }}
                />
                Trains
                <span
  className={`absolute left-0 -bottom-2 h-[2px] w-full bg-[#C9A961] 
  transform scale-x-0 origin-left transition-transform duration-300
  group-hover:scale-x-100 ${
    activeTab === "Flights" ? "scale-x-100" : ""
  }`}
/>

              </button>

              <button 
                onClick={() => handleNavClick("Holiday Packages")} 
                className={` relative flex items-center gap-2 font-opensans font-medium text-[18px] leading-[21px] tracking-[0px] transition-colors group ${
                  activeTab === "Holiday Packages" ? "text-[#C9A961]" : "text-black hover:text-[#C9A961]"
                }`}
              >
                <img 
                  src={EventIcon} 
                  alt="Holiday Packages" 
                  className="w-5 h-5 transition-all nav-icon"
                  style={{
                    filter: activeTab === "Holiday Packages" 
                      ? "brightness(0) saturate(100%) invert(63%) sepia(25%) saturate(1089%) hue-rotate(359deg)" 
                      : "brightness(0)"
                  }}
                />
                Holiday Packages
                <span
  className={`absolute left-0 -bottom-2 h-[2px] w-full bg-[#C9A961] 
  transform scale-x-0 origin-left transition-transform duration-300
  group-hover:scale-x-100 ${
    activeTab === "Flights" ? "scale-x-100" : ""
  }`}
/>

              </button>

              <button 
                onClick={() => handleNavClick("Events")} 
                className={`relative flex items-center gap-2 font-opensans font-medium text-[18px] leading-[21px] tracking-[0px] transition-colors group ${
                  activeTab === "Events" ? "text-[#C9A961]" : "text-black hover:text-[#C9A961]"
                }`}
              >
                <img 
                  src={PackageIcon} 
                  alt="Events" 
                  className="w-5 h-5 transition-all nav-icon"
                  style={{
                    filter: activeTab === "Events" 
                      ? "brightness(0) saturate(100%) invert(63%) sepia(25%) saturate(1089%) hue-rotate(359deg)" 
                      : "brightness(0)"
                  }}
                />
                Events
                <span
  className={`absolute left-0 -bottom-2 h-[2px] w-full bg-[#C9A961] 
  transform scale-x-0 origin-left transition-transform duration-300
  group-hover:scale-x-100 ${
    activeTab === "Flights" ? "scale-x-100" : ""
  }`}
/>

              </button>
            </div>

            {/* User Profile or Login Button - Rightmost */}
            <div className="hidden md:flex items-center flex-shrink-0 gap-3">
              {isLoggedIn ? (
                <>
                  {/* User Avatar */}
                  <div 
                    onClick={() => navigate('/about')}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl cursor-pointer"
                    style={{
                      background: 'linear-gradient(180.95deg, #AB7E29 0.87%, #EFD08D 217.04%)',
                      boxShadow: '0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {userInitial}
                  </div>
                  
                  {/* Menu Icon with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Menu size={28} className="text-gray-700" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/profile');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-gray-700"
                        >
                          Profile
                          
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/mybooking');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-gray-700"
                        >
                          My Bookings
                        </button>
                        <hr className="my-2 border-gray-200" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-red-600 font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-white font-medium hover:opacity-90 transition-opacity text-[17px]"
                  style={{
                    width: '162px',
                    height: '42px',
                    borderRadius: '15px',
                    padding: '12px 24px',
                    background: 'linear-gradient(180.95deg, #AB7E29 0.87%, #EFD08D 217.04%)',
                    boxShadow: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Login/Signup
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-[#2C4A5E] hover:text-[#C9A961] focus:outline-none"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute w-full">
            <div className="px-4 pt-2 pb-3 space-y-1 shadow-lg">
              {["Hotels", "Flights", "Trains", "Holiday Packages", "Events"].map((item) => (
                <button
                  key={item}
                  onClick={() => handleNavClick(item)}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-[#2C4A5E] hover:text-[#C9A961] hover:bg-gray-50 rounded-md"
                >
                  {item}
                </button>
              ))}
              <div className="pt-4 pb-2">
                {isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{
                          background: 'linear-gradient(180.95deg, #AB7E29 0.87%, #EFD08D 217.04%)',
                        }}
                      >
                        {userInitial}
                      </div>
                      <span className="text-[#2C4A5E] font-medium">My Account</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-3 py-2 text-base font-medium text-[#2C4A5E] hover:bg-gray-50 rounded-md"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/bookings');
                      }}
                      className="w-full text-left px-3 py-2 text-base font-medium text-[#2C4A5E] hover:bg-gray-50 rounded-md"
                    >
                      My Bookings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50 rounded-md"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-[#2C4A5E] text-white px-4 py-2 rounded-full font-medium hover:bg-[#1a2e3b] transition-colors flex items-center justify-center gap-2"
                  >
                    <User size={18} />
                    Login / Signup
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      <LoginModal isOpen={isModalOpen} onClose={handleLoginSuccess} />
    </>
  );
};