import React, { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, MapPin, Loader2, LogOut, Edit3, Briefcase, Calendar, Globe, ShoppingBag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Interface for Customer Data (Based on new Swagger's GET /customers/{id})
interface CustomerData {
    id: number;
    social_title?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    dob: string; // Date of Birth (from Swagger)
    address?: string; 
    profile_image?: string;

    work_title?: string;
    language?: string;


    carts: any[]; // Cart details
    orders: Order[]; // Order details for bookings
}

interface Order {
    id: number;
    status: string;
    orderRooms: OrderRoom[];
    totalPrice: number;
    currency: string;
}

interface OrderRoom {
    id: number;
    checkIn: string;
    checkOut: string;
    adults: number; 
    children: number;
    property: {
        name: string;
        city: string;
        images: { image: string }[];
    };
}



// ------------------------------------------------
// Helper: Date Format
// ------------------------------------------------
const formatDateForInput = (dateString?: string): string => {
    if (!dateString || dateString === 'N/A') return '';
    try {
        // Assume DOB is YYYY-MM-DD or convertible to it (e.g., "1995-05-10T...")
        // We ensure it gets normalized to YYYY-MM-DD for the input[type=date]
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 
        
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    } catch {
        return '';
    }
};

const formatDisplayDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
        // Assuming DOB is YYYY-MM-DD (e.g., 1995-05-10)
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // Converts YYYY-MM-DD to DD-MM-YYYY (Example display format)
            return `${parts[2]}-${parts[1]}-${parts[0]}`; 
        }
        return dateString;
    } catch {
        return dateString;
    }
};

const CustomerProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false); 
    const [formState, setFormState] = useState<Partial<CustomerData & { profile_image?: string }>>({});
    const [myBookings, setMyBookings] = useState<any[]>([]);
    
    const customerDbId = sessionStorage.getItem('shineetrip_db_customer_id');
    const token = sessionStorage.getItem('shineetrip_token');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);


const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setSelectedImage(file);
  setImagePreview(URL.createObjectURL(file));
};


    
    // ------------------------------------------------
    // 1. GET By ID Logic: Fetch Customer Data and Orders
    // ------------------------------------------------
    const fetchProfileData = useCallback(async () => {
    if (!customerDbId || !token) {
        setError("Authorization required. Please log in.");
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);

    try {
        // 1. Fetch Basic Profile Data (Swagger: GET /customers/{id})
        const apiUrl = `http://46.62.160.188:3000/customers/${customerDbId}`;
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleLogout();
            }
            throw new Error("Failed to fetch profile. Session expired or access denied.");
        }

        const profileData: CustomerData = await response.json();
        
        // 2. FETCH DETAILED ORDERS (Swagger: GET /order/search)
        // Ye bohot zaroori hai kyunki /customers/id wali API 'orderRooms' nahi bhejti
        let detailedOrders = [];
        try {
            const ordersRes = await fetch(`http://46.62.160.188:3000/order/search?customerId=${customerDbId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (ordersRes.ok) {
                detailedOrders = await ordersRes.json();
                console.log("Detailed Orders Fetched:", detailedOrders); // Debugging ke liye
            }
        } catch (orderErr) {
            console.error("Detailed orders fetch failed", orderErr);
        }

        // 3. Data ko Merge aur Normalize karein
        const normalizedData: CustomerData = {
            ...profileData,
            orders: detailedOrders.length > 0 ? detailedOrders : (profileData.orders || []), 
            dob: profileData.dob || 'N/A', 
            work_title: profileData.work_title || "Travel Enthusiast",
            language: profileData.language || "Hindi, English",
        };
        
        // Final States Set karein
        setCustomer(normalizedData);
        setFormState({
            first_name: normalizedData.first_name || '',
            last_name: normalizedData.last_name || '',
            email: normalizedData.email || '',
            phone: normalizedData.phone || '',
            dob: normalizedData.dob, 
            address: normalizedData.address || '',
            work_title: normalizedData.work_title || '',
            language: normalizedData.language || '',
        });

    } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err instanceof Error ? err.message : 'Failed to load user profile.');
    } finally {
        setLoading(false);
    }
}, [customerDbId, token, navigate]); 

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);
    
    // ------------------------------------------------
    // 2. PATCH Logic: Update Customer Data
    // ------------------------------------------------

        const generateLetterAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${name.charAt(0).toUpperCase()}&size=256&background=0D8ABC&color=fff`;

    const finalImageUrl =
  imagePreview ||
  customer?.profile_image ||
  generateLetterAvatar(customer?.first_name || "U");
    const handleSaveProfile = async () => {
        if (!customerDbId || !token || !customer) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Endpoint: PATCH /customers/{id}
            const apiUrl = `http://46.62.160.188:3000/customers/${customerDbId}`;
            
            // 💡 FIX 1: Sirf woh fields bhejo jo Swagger PATCH schema mein allowed hain.
            // DOB ko same format mein bhejna zaroori hai jo backend accept karta hai.
            const payload: Partial<CustomerData> = {
                first_name: formState.first_name,
                last_name: formState.last_name,
                email: formState.email, 
                phone: formState.phone,
                dob: formState.dob, // Send the date as it is in state (YYYY-MM-DD from input)
               
                address: formState.address,
  profile_image:
    customer?.profile_image ||
    generateLetterAvatar(formState.first_name || "U"),
            };
            
            const response = await fetch(apiUrl, {
                method: "PATCH", 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || "Failed to update profile.");
            }

            await fetchProfileData(); 
            setIsEditMode(false);
            alert("Profile updated successfully!");

        } catch (err) {
            console.error("Profile update error:", err);
            setError(err instanceof Error ? err.message : 'Failed to update profile.');
            setLoading(false);
        }
    };



    

    // --- Utility Handlers ---
    const handleLogout = () => {
        sessionStorage.clear(); 
        navigate('/'); 
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const toggleEditMode = () => {
        if (isEditMode) {
            // Agar cancel kiya toh original data se reset karein
            setFormState(customer || {});
        }
        setIsEditMode(!isEditMode);
    };

    // ------------------------------------------------
    // 3. Data Extraction and UI Render
    // ------------------------------------------------
    if (loading) {
        // ... (Loading UI) ...
        return (
            <div className="min-h-screen pt-28 flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#D2A256]" />
                <p className="text-gray-600 ml-3">Loading profile data...</p>
            </div>
        );
    }

    if (error || !customer) {
        // ... (Error UI) ...
        return (
            <div className="min-h-screen pt-28 flex flex-col items-center justify-center text-center bg-gray-50">
                <p className="text-red-600 mb-4">{error || "Could not load user profile. Please log in again."}</p>
                <button onClick={handleLogout} className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <LogOut className="w-4 h-4 inline mr-2" /> Log Out
                </button>
            </div>
        );
    }
    
    const fullName = `${customer.first_name} ${customer.last_name}`;
    
    // 💡 FIX 2: Dynamic Booking Data Extraction
    const activeBookings = customer.orders
        ?.flatMap(order => order.orderRooms || [])
        .filter(room => room && room.property && room.property.name)
        .map(room => ({
            id: room.id,
            destination: `${room.property.name}, ${room.property.city}`,
            count: (room.adults || 0) + (room.children || 0), // Combining adults and children as count
            image_url: room.property.images?.[0]?.image || "https://placehold.co/180x100/A0A0A0/444444?text=Trip+Image"
        })) || [];
const ProfileNavItem: React.FC<{ icon: React.ElementType, label: string, active?: boolean, onClick: () => void }> = ({ icon: Icon, label, active = false, onClick }) => (
    <button onClick={onClick} className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        active ? 'bg-[#D2A256] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
    }`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
    </button>
);

    // --- Profile Display ---
    return (
        <div className="min-h-screen bg-gray-50 font-opensans pt-24 pb-12">
            <div className="max-w-7xl mt-16 mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Column 1: Sidebar (Design Maintained) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <h3 className="text-xl font-extrabold text-gray-900 mb-4 border-b pb-2">Profile</h3>
                        
                        <div className="space-y-1">
                            <ProfileNavItem icon={User} label="About me" active={true} onClick={() => navigate('/profile')}/>
                            <ProfileNavItem icon={ShoppingBag} label="My booking" active={false} onClick={() => navigate('/mybooking')}/>
                        </div>
                    </div>
                    
                    {/* Logout Button in sidebar style */}
                    <button onClick={handleLogout} className="w-full bg-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center shadow-md">
                        <LogOut className="w-5 h-5 inline mr-2" /> Log Out
                    </button>
                </div>
                
                {/* Column 2: Main Content */}
                <div className="lg:col-span-3 space-y-8">
                    
                    {/* 1. About Me Header & Details */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div className="flex items-center gap-4">
  <img
    src={
      customer.profile_image ||
      generateLetterAvatar(customer.first_name || "U")
    }
    alt="Profile"
    className="w-14 h-14 rounded-full object-cover border"
  />

  <div>
    <h2 className="text-2xl font-extrabold text-gray-900">About me</h2>
    <p className="text-sm text-gray-500">{fullName}</p>
  </div>
</div>

                            <button 
                                onClick={toggleEditMode} 
                                className={`text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md flex items-center ${
                                    isEditMode ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-black'
                                }`}
                            >
                                {isEditMode ? (<><X className="w-4 h-4 inline mr-1" /> Cancel</>) : (<><Edit3 className="w-4 h-4 inline mr-1" /> Edit</>)}
                            </button>
                        </div>
                        
                        <div className="flex items-start gap-6"> 
                            
                            {/* Personal Details Grid (Dynamic/Editable) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8 grow">
                                
                                {isEditMode ? (
                                    <>
                                        <ProfileEditField label="First Name" name="first_name" value={formState.first_name || ''} onChange={handleFormChange} />
                                        <ProfileEditField label="Last Name" name="last_name" value={formState.last_name || ''} onChange={handleFormChange} />
                                        <ProfileEditField label="Work Title" name="work_title" value={formState.work_title || ''} onChange={handleFormChange} />
                                        <ProfileEditField 
                                            label="Birthdate (YYYY-MM-DD)" 
                                            name="dob" // Changed name to 'dob' based on Swagger
                                            value={formatDateForInput(formState.dob)} 
                                            onChange={handleFormChange} 
                                            type="date"
                                        />
                                        <ProfileEditField label="Language" name="language" value={formState.language || ''} onChange={handleFormChange} />
                                        <div className="flex items-center gap-4 col-span-full">
  <img
    src={imagePreview || customer?.profile_image || "https://ui-avatars.com/api/?name=U"}
    className="w-24 h-24 rounded-full object-cover border"
  />

  <label className="cursor-pointer bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
    Change Photo
    <input
      type="file"
      accept="image/*"
      hidden
      onChange={handleImageSelect}
    />
  </label>
</div>

                                    </>
                                ) : (
                                    <>
                                        <ProfileDetailPill icon={Briefcase} label="My Work" value={customer.work_title || 'N/A'} />
                                        <ProfileDetailPill icon={Calendar} label="Birthdate" value={formatDisplayDate(customer.dob)} />
                                        <ProfileDetailPill icon={Globe} label="Language" value={customer.language || 'N/A'} />
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Save Button for Edit Mode */}
                        {isEditMode && (
                            <div className="mt-6 text-right border-t pt-4">
                                <button
                                    onClick={handleSaveProfile}
                                    className="bg-[#D2A256] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#c2934b] transition-colors"
                                    disabled={loading} 
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin inline mr-1" /> : <Edit3 className="w-4 h-4 inline mr-1" />}
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}

                        {/* Contact Details (Always Visible) */}
                        <div className={`mt-6 pt-4 ${isEditMode ? 'opacity-50 pointer-events-none' : 'border-t'}`}>
                            <ProfileDataField icon={User} label="Full Name" value={fullName} color="#D2A256" />
                            <ProfileDataField icon={Mail} label="Email Address" value={customer.email} color="#3B82F6" />
                            <ProfileDataField icon={Phone} label="Phone Number" value={customer.phone || "Not provided"} color="#10B981" />
                            {/* NOTE: Address field is optional in Swagger, keeping it in helper for display */}
                            <ProfileDataField icon={MapPin} label="Address" value={customer.address || "Not provided"} color="#6B7280" />
                        </div>
                        
                    </div>
                    
                   {/* 2. My Bookings Section */}
{/* 2. My Bookings Section - Updated for Grid and Navigation */}
<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
    <h2 className="text-xl font-extrabold text-gray-900 mb-6">My Bookings</h2>
    
    {/* 🟢 CHANGE 1: Overflow scroll ko hata kar Grid lagaya (Max 3 per row) */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customer && customer.orders && customer.orders.length > 0 ? (
            customer.orders.map((order: any) => {
                const rooms = order.orderRooms || [];
                
                if (rooms.length > 0) {
                    return rooms.map((room: any) => (
                        <BookingCard 
                            key={`${order.id}-${room.id}`}
                            destination={`${room.property?.city || 'India'}`}
                            count={1} 
                            image_url={room.property?.images?.[0]?.image || "https://placehold.co/180x110?text=Hotel"}
                            onClick={() => navigate(`/mybooking?highlight=${order.id}`)}
                        />
                    ));
                }
                return null;
            })
        ) : (
            <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No bookings found yet</p>
            </div>
        )}
    </div>
</div>                    
                </div>
                
            </div>
        </div>
    );
};

// --- Helper Components ---

// Reusable Component for Data Fields (like Name, Email, Phone)
const ProfileDataField: React.FC<{ icon: React.ElementType, label: string, value: string, color: string }> = ({ icon: Icon, label, value, color }) => (
    <div className="space-y-1 my-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="flex items-center space-x-2">
            <Icon className="w-4 h-4" style={{ color: color }} />
            <p className="text-base font-medium text-gray-800">{value}</p>
        </div>
    </div>
);

// Reusable Component for Side Navigation Items
const ProfileNavItem: React.FC<{ icon: React.ElementType, label: string, active?: boolean }> = ({ icon: Icon, label, active = false }) => (
    <button className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        active 
        ? 'bg-[#D2A256] text-white shadow-md' 
        : 'text-gray-700 hover:bg-gray-100'
    }`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
    </button>
);

// Component for My Work, Birthdate, Language pills
const ProfileDetailPill: React.FC<{ icon: React.ElementType, label: string, value: string }> = ({ icon: Icon, label, value }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-2 text-gray-700">
            <Icon className="w-5 h-5 text-[#D2A256]" />
            <span className="text-sm font-semibold">{label}</span>
        </div>
        <p className="text-lg font-bold text-gray-900 ml-7">{value}</p>
    </div>
);

// NEW: Component for editable fields in Edit Mode
const ProfileEditField: React.FC<{ label: string, name: keyof CustomerData, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }> = ({ label, name, value, onChange, type = 'text' }) => (
    <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <input
            type={type}
            name={name as string}
            value={value}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base font-medium focus:border-[#D2A256] focus:ring-1 focus:ring-[#D2A256] transition-colors"
        />
    </div>
);


// Dynamic Booking Card Component
const BookingCard: React.FC<{ destination: string, count: number, image_url: string, onClick?: () => void }> = ({ destination, count, image_url, onClick }) => (
    <div 
        className="w-full bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer group" 
        onClick={onClick}
    >
        <div className="overflow-hidden">
            <img 
                src={image_url} 
                alt={destination} 
                className="h-[150px] w-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/300x150?text=Hotel+View" }}
            />
        </div>
        <div className="p-4 text-center">
            <p className="font-extrabold text-base text-gray-900 truncate">{destination}</p>
            <p className="text-xs text-[#D2A256] font-semibold mt-1">{count} Booking(s)</p>
        </div>
    </div>
);

// Static Placeholder for Review Snippet (Unchanged)
// const ReviewSnippet: React.FC = () => (
//     <div className="bg-gray-100 rounded-xl p-4 space-y-2 border border-gray-200">
//         <div className="flex items-center gap-3">
//             <User className="w-10 h-10 rounded-full bg-gray-300 p-1" />
//             <div>
//                 <p className="font-bold text-sm">Vasithha</p>
//                 <p className="text-xs text-gray-500">Darjeeling, India</p>
//             </div>
//         </div>
//         <p className="text-xs text-gray-600 italic line-clamp-3">
//             It has been a pleasure hosting them. We hope they had a good time and a good stary in Darjeeling.
//         </p>
//         <p className="text-[10px] text-gray-400">July 2025</p>
//     </div>
// );

export default CustomerProfilePage;