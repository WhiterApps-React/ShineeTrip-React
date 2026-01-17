import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { 
    Loader2, ShoppingBag, Search, 
    CheckCircle, Clock, ArrowLeft, Star, FileText,
    User, XCircle,
    Phone,
    Users,
    MapPin,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns'; 
import InvoicePDF from '@/components/ui/InvoicePDF';

// --- Interfaces Fixed based on API Response ---

interface PropertyDetails {
    id: number;
    name: string;
    city: string;
    images?: { image: string }[]; // Optional chain safely
}

interface RoomTypeDetails {
    id: number;
    room_type: string;
    images?: { image: string }[];
    serviceProdInfos?: { id: number; name: string }[];
}

interface OrderRoomDetail {
    id: number;
    checkIn: string;
    checkOut: string;
    adults: number; 
    children: number;
    roomPrice: number; 
    status: string;
    property: PropertyDetails; 
    roomType: RoomTypeDetails; 
}

interface Order {
    id: number;
    status: string; 
    totalPrice: number;
    currency: string;
    createdAt: string;
    orderRooms?: OrderRoomDetail[];
    startDate?: string;
    endDate?: string;
    adults?: number;
    children?: number;
    holidayPackage?: {
        id: number;
        title: string;
        hero_image: string;
        included_cities: string[];
    };
}

// --- Helper Functions ---
const formatDayAndDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
        return format(new Date(dateStr), 'E, dd MMM yyyy');
    } catch {
        return dateStr;
    }
};


const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
        return format(new Date(dateStr), 'dd MMM yyyy');
    } catch {
        return dateStr;
    }
};


// Fixed Status Pill to match API Strings like "Complete payment received"
const BookingStatusPill: React.FC<{ status: string }> = ({ status }) => {
    const lowerStatus = status.toLowerCase();
    
    let Icon = CheckCircle;
    let text = status; 
    let colorClass = 'text-gray-600';

    if (lowerStatus.includes('complete') || lowerStatus.includes('confirmed') || lowerStatus.includes('received')) {
        Icon = CheckCircle;
        text = 'Confirmed';
        colorClass = 'text-green-600';
    } 
    else if (lowerStatus.includes('awaiting') || lowerStatus.includes('pending')) {
        Icon = Clock;
        text = 'Payment Pending';
        colorClass = 'text-yellow-600';
    } 
    else if (lowerStatus.includes('cancelled') || lowerStatus.includes('fail')) {
        Icon = XCircle;
        text = 'Cancelled';
        colorClass = 'text-red-600';
    }

    return (
        <div className={`flex items-center gap-1 text-sm font-semibold ${colorClass}`}>
            <Icon className="w-4 h-4 fill-current" />
            <span>{text}</span>
        </div>
    );
};

const ProfileNavItem: React.FC<{ icon: React.ElementType, label: string, active?: boolean, onClick: () => void }> = ({ icon: Icon, label, active = false, onClick }) => (
    <button onClick={onClick} className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        active ? 'bg-[#D2A256] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
    }`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium text-sm">{label}</span>
    </button>
);

const BookingDetailModal = ({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: {order: Order, room: OrderRoomDetail} | null }) => {
    if (!isOpen || !data) return null;
    const { order, room } = data;

    
    const userName = sessionStorage.getItem('shineetrip_name') || "Guest User";
    const userEmail = sessionStorage.getItem('shineetrip_email') || "N/A";

// 🟢 DYNAMIC PRICE CALCULATION
const roomBasePrice = Number(room.roomPrice) || 0;
const totalOrderPrice = Number(order.totalPrice) || 0;
const taxesAndFees = totalOrderPrice - roomBasePrice;

return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                
                {/* Header Section */}
                <div className="bg-[#263238] p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-[2px] mb-1">Booking Confirmation</p>
                            <h2 className="text-2xl font-black">ID: #{order.id}</h2>
                            <p className="text-gray-400 text-xs mt-1 font-medium">
                                Booked on: {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-gray-50/30">
                    
                    {/* 1. Dynamic Guest Information Section */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Guest Details
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Primary Guest</p>
                                <p className="text-sm font-extrabold text-gray-800">{userName}</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Email Address</p>
                                <p className="text-sm font-extrabold text-gray-800">{userEmail}</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>
                                <div className="mt-1"><BookingStatusPill status={order.status} /></div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Dynamic Hotel & Room Info */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex gap-4 pb-5 border-b border-gray-50">
                            <img 
                                src={room.property.images?.[0]?.image || "https://placehold.co/100x100?text=Hotel"} 
                                className="w-24 h-24 rounded-2xl object-cover border border-gray-100" 
                                alt="hotel"
                            />
                            <div>
                                <h3 className="font-black text-xl text-gray-900 leading-tight">{room.property.name}</h3>
                                <p className="text-sm text-gray-500">{room.property.city}</p>
                                <div className="mt-2 inline-flex items-center bg-yellow-50 text-[#D2A256] px-3 py-1 rounded-lg text-xs font-bold border border-yellow-100">
                                    {room.roomType.room_type}
                                </div>
                            </div>
                        </div>

                        {/* Stay Timeline (MMT Style) */}
                        <div className="grid grid-cols-2 divide-x divide-gray-100 mt-5 pt-2">
                            <div className="pr-4">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Check-In</p>
                                <p className="text-lg font-black text-gray-800">{formatShortDate(room.checkIn)}</p>
                                <p className="text-xs text-gray-500 font-medium">{format(new Date(room.checkIn), 'EEEE')}</p>
                            </div>
                            <div className="pl-4">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Check-Out</p>
                                <p className="text-lg font-black text-gray-800">{formatShortDate(room.checkOut)}</p>
                                <p className="text-xs text-gray-500 font-medium">{format(new Date(room.checkOut), 'EEEE')}</p>
                            </div>
                        </div>
                        <div className="mt-4 bg-gray-50 p-2 rounded-lg text-center text-[11px] font-bold text-gray-600">
                            Stay Duration: {room.adults} Adults • {room.children} Children
                        </div>
                    </div>

                   {/* 3. Fully Dynamic Services (Amenities/Inclusions) */}
<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Stay Inclusions</h4>
    <div className="flex flex-wrap gap-2">
        {/* 🟢 STEP 1: Agar Order ke room mein specific services (like Breakfast) saved hain */}
        {(room.roomType?.serviceProdInfos ?? []).length > 0 ? (
            (room.roomType?.serviceProdInfos ?? []).map((service: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 border border-gray-100">
                    <CheckCircle className="w-4 h-4 text-green-500" /> 
                    {service.name}
                </div>
            ))
        ) : (
            /* 🟢 STEP 2: Agar koi extra service nahi hai, toh standard amenities dikhao jo Room Details modal mein thi */
            <>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 border border-gray-100">
                     No extra services included
                </div>
               
            </>
        )}
    </div>
</div>

                    {/* 4. Dynamic Payment Summary */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-900 px-1">Payment Breakdown</h4>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Room Rate (Total Stay)</span>
                                <span className="text-gray-900 font-black">{order.currency} {roomBasePrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Taxes & Fees</span>
                                <span className="text-gray-900 font-black">{order.currency} {taxesAndFees.toFixed(2)}</span>
                            </div>
                            <div className="pt-4 border-t border-dashed flex justify-between items-center">
                                <span className="text-gray-900 font-black text-lg">Total Amount Paid</span>
                                <span className="text-2xl font-black text-green-600">{order.currency} {totalOrderPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white border-t border-gray-100 flex gap-4">
                    <button 
                        onClick={() => handleDownloadPDF(order, room)}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#D2A256] text-white py-4 rounded-2xl text-sm font-black hover:bg-[#b88d45] transition-all shadow-lg"
                    >
                        <FileText className="w-5 h-5" /> Download Voucher
                    </button>
                    
                </div>
            </div>
        </div>
    );
};


const handleDownloadPDF = (order: Order, room: OrderRoomDetail) => {
    const userName = sessionStorage.getItem('shineetrip_name') || "Guest User";
    const userEmail = sessionStorage.getItem('shineetrip_email') || "Not Provided";
    const bookingDate = new Date(order.createdAt).toLocaleDateString('en-GB', { 
        day: '2-digit', month: 'long', year: 'numeric' 
    });

    // 🟢 DYNAMIC INCLUSIONS (Badges with Icons)
    const inclusionsHTML = room.roomType?.serviceProdInfos && room.roomType.serviceProdInfos.length > 0 
        ? room.roomType.serviceProdInfos.map((s: any) => `
            <div class="inclusion-pill">
                <span class="dot"></span> ${s.name}
            </div>`).join('') 
        : `<div class="inclusion-pill"><span class="dot"></span> Free Wi-Fi</div>
           <div class="inclusion-pill"><span class="dot"></span> Air Conditioning</div>
           <div class="inclusion-pill"><span class="dot"></span> Complimentary Breakfast</div>`;

    const printContent = `
        <html>
            <head>
                <title>ShineeTrip E-Voucher - #${order.id}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                    body { font-family: 'Inter', sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: #f4f4f4; }
                    .page { width: 210mm; min-height: 297mm; padding: 20mm; margin: 10mm auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); position: relative; overflow: hidden; }
                    
                    /* Decorative Top Bar */
                    .top-accent { position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: linear-gradient(90deg, #AB7E29 0%, #EFD08D 100%); }
                    
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-top: 10px; }
                    .logo-area .brand { font-size: 32px; font-weight: 800; color: #263238; margin: 0; letter-spacing: -1px; }
                    .logo-area .brand span { color: #AB7E29; }
                    .logo-area .tagline { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px; }
                    
                    .voucher-badge { background: #263238; color: white; padding: 15px 25px; border-radius: 0 0 0 20px; text-align: right; margin: -30px -30px 0 0; }
                    .voucher-badge h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; color: #EFD08D; }
                    .voucher-badge p { margin: 5px 0 0; font-size: 12px; opacity: 0.8; }

                    /* Hero Hotel Card */
                    .hotel-hero { background: linear-gradient(135deg, #263238 0%, #37474f 100%); color: white; padding: 30px; border-radius: 24px; margin-bottom: 30px; position: relative; }
                    .hotel-hero h2 { margin: 0; font-size: 28px; font-weight: 800; color: #EFD08D; }
                    .hotel-hero p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; display: flex; align-items: center; gap: 5px; }
                    .status-tag { position: absolute; top: 30px; right: 30px; background: #4CAF50; color: white; padding: 5px 15px; border-radius: 50px; font-size: 12px; font-weight: bold; }

                    .main-grid { display: grid; grid-template-cols: 1.5fr 1fr; gap: 25px; }
                    .card { background: #ffffff; border: 1.5px solid #f0f0f0; border-radius: 20px; padding: 20px; }
                    .card-title { font-size: 11px; font-weight: 800; color: #AB7E29; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
                    .card-title::after { content: ''; flex: 1; height: 1px; background: #eee; }

                    /* Stay Timeline */
                    .timeline { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
                    .time-node { flex: 1; }
                    .time-node .date { font-size: 18px; font-weight: 800; color: #263238; margin: 0; }
                    .time-node .day { font-size: 12px; color: #888; margin: 2px 0; }
                    .connector { flex: 0.5; height: 2px; background: #f0f0f0; position: relative; margin: 0 15px; }
                    .connector::after { content: '✈'; position: absolute; top: -10px; left: 40%; color: #AB7E29; font-size: 14px; }

                    /* Inclusions Pills */
                    .inclusions-container { display: flex; flex-wrap: wrap; gap: 8px; }
                    .inclusion-pill { background: #f8f9fa; border: 1px solid #e9ecef; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600; color: #495057; display: flex; align-items: center; gap: 6px; }
                    .inclusion-pill .dot { width: 6px; height: 6px; background: #AB7E29; border-radius: 50%; }

                    /* Price Table */
                    .price-details { margin-top: 25px; border-top: 2px dashed #eee; padding-top: 20px; }
                    .price-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                    .total-row { background: #263238; color: white; padding: 20px; border-radius: 15px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; }
                    .total-row .amount { font-size: 24px; font-weight: 800; color: #EFD08D; }

                    .footer-notes { margin-top: 40px; font-size: 10px; color: #999; line-height: 1.8; }
                    .qr-placeholder { float: right; width: 80px; height: 80px; background: #eee; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 8px; text-align: center; color: #aaa; border: 1px solid #ddd; }

                    @media print {
                        body { background: white; }
                        .page { margin: 0; box-shadow: none; border: none; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="top-accent"></div>
                    
                    <div class="header">
                        <div class="logo-area">
                            <h1 class="brand">SHINEE <span>TRIP</span></h1>
                            <div class="tagline">Himachal's Premier Luxury Travel Planner</div>
                        </div>
                        <div class="voucher-badge">
                            <h1>CONFIRMED VOUCHER</h1>
                            <p>Booking ID: #${order.id}</p>
                        </div>
                    </div>

                    <div class="hotel-hero">
                        <div class="status-tag">PAYMENT RECEIVED</div>
                        <h2>${room.property.name}</h2>
                        <p>📍 ${room.property.city}, India • ${room.roomType.room_type}</p>
                    </div>

                    <div class="main-grid">
                        <div class="card">
                            <div class="card-title">Reservation Details</div>
                            <div class="timeline">
                                <div class="time-node">
                                    <p class="day">CHECK-IN (12 PM)</p>
                                    <p class="date">${room.checkIn}</p>
                                </div>
                                <div class="connector"></div>
                                <div class="time-node" style="text-align: right;">
                                    <p class="day">CHECK-OUT (11 AM)</p>
                                    <p class="date">${room.checkOut}</p>
                                </div>
                            </div>
                            <p style="font-size: 12px; color: #666; margin-top: 15px; font-weight: 600;">
                                Total Guests: ${room.adults} Adults, ${room.children} Children
                            </p>
                        </div>

                        <div class="card">
                            <div class="card-title">Primary Guest</div>
                            <p style="font-size: 16px; font-weight: 800; margin: 0; color: #263238;">${userName}</p>
                            <p style="font-size: 12px; color: #888; margin: 5px 0;">${userEmail}</p>
                            <div style="margin-top: 15px; font-size: 11px; color: #AB7E29; font-weight: bold;">
                                Verified Profile ✓
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 25px;">
                        <div class="card">
                            <div class="card-title">Stay Inclusions & Amenities</div>
                            <div class="inclusions-container">
                                ${inclusionsHTML}
                            </div>
                        </div>
                    </div>

                    <div class="price-details">
                        <div class="total-row">
                            <div>
                                <p style="margin:0; font-size: 12px; opacity: 0.8; font-weight: bold; text-transform: uppercase;">Total Amount Paid</p>
                                <p style="margin:5px 0 0; font-size: 10px; opacity: 0.6;">Inclusive of GST & Service Charges</p>
                            </div>
                            <div class="amount">${order.currency} ${order.totalPrice.toLocaleString()}</div>
                        </div>
                    </div>

                    <div class="footer-notes">
                        <div class="qr-placeholder">SCAN FOR<br>LOCATION</div>
                        <p><b>Important Note:</b><br>
                        • Please carry this voucher and a valid Govt. ID (Aadhar/Passport) during check-in.<br>
                        • For any modifications or cancellations, please contact info@shineetrip.com.<br>
                        • This is an electronically generated document. No signature required.</p>
                        <p style="text-align: center; margin-top: 30px; font-weight: bold; color: #263238;">Thank you for choosing ShineeTrip!</p>
                    </div>
                </div>
            </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 700);
    }
};
const MyBookingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [bookingType, setBookingType] = useState<'hotel' | 'package'>('hotel');
    const [orders, setOrders] = useState<Order[]>([]);
    const [packageOrders, setPackageOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); 
    const [selectedBooking, setSelectedBooking] = useState<{order: Order, room: OrderRoomDetail} | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    // 1. Naye state (jahan selectedBooking pehle se hai)
const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
const [selectedPackageOrder, setSelectedPackageOrder] = useState<any>(null);

// 2. Open function
const openPackageDetails = (order: any) => {
    setSelectedPackageOrder(order);
    setIsPackageModalOpen(true);
};

    const customerDbId = sessionStorage.getItem('shineetrip_db_customer_id');
    const token = sessionStorage.getItem('shineetrip_token');
    const API_BASE = 'http://46.62.160.188:3000';

    const openDetails = (order: Order, room: OrderRoomDetail) => {
        setSelectedBooking({ order, room });
        setIsModalOpen(true);
    };

    const fetchAllData = useCallback(async () => {
        if (!customerDbId || !token) { setLoading(false); return; }
        setLoading(true);
        try {
            const headers = { "Authorization": `Bearer ${token}` };
            const [hotelRes, pkgRes] = await Promise.all([
                fetch(`${API_BASE}/order/search?customerId=${customerDbId}`, { headers }),
                fetch(`${API_BASE}/holiday-package-orders?customerId=${customerDbId}`, { headers })
            ]);
            const hData = await hotelRes.json();
            const pData = await pkgRes.json();
            setOrders(Array.isArray(hData) ? hData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
            setPackageOrders(pData.data || pData || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [customerDbId, token]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const getFilteredData = () => {
        const currentList = bookingType === 'hotel' ? orders : packageOrders;
        return currentList.filter(order => {
            if (filterStatus === 'all') return true;
            const s = order.status.toLowerCase();
            if (filterStatus === 'confirmed') return s.includes('complete') || s.includes('received');
            if (filterStatus === 'awaiting payment') return s.includes('awaiting');
            return s.includes(filterStatus.toLowerCase());
        });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-[#D2A256]" />
            <p className="ml-3 font-bold text-gray-400">Loading your bookings...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <style dangerouslySetInnerHTML={{ __html: `@media print { .no-print-main { display: none !important; } .print-only-invoice { display: block !important; position: absolute; top: 0; left: 0; width: 100%; z-index: 9999; } }`}} />

            <div className={`no-print-main ${selectedInvoice ? 'hidden' : ''}`}>
                <div className="max-w-7xl mt-16 mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-32">
                            <h3 className="text-xl font-bold mb-4 border-b pb-2">Profile</h3>
                            <div className="space-y-1">
                                <ProfileNavItem icon={User} label="About me" onClick={() => navigate('/profile')} />
                                <ProfileNavItem icon={ShoppingBag} label="My booking" active={true} onClick={() => {}} />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h1 className="text-3xl font-extrabold flex items-center gap-2">My Bookings <ShoppingBag className="w-7 h-7 text-[#D2A256]" /></h1>
                            <div className="flex p-1 bg-white shadow-sm rounded-2xl border border-gray-200 w-full max-w-[360px]">
                                <button onClick={() => setBookingType('hotel')} className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all ${bookingType === 'hotel' ? 'bg-[#D2A256] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>HOTEL BOOKINGS</button>
                                <button onClick={() => setBookingType('package')} className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all ${bookingType === 'package' ? 'bg-[#D2A256] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>PACKAGE BOOKINGS</button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center bg-white p-4 rounded-xl shadow-sm border gap-3 overflow-x-auto">
                            {['all', 'awaiting payment', 'confirmed', 'cancelled'].map(status => (
                                <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${filterStatus === status ? 'bg-[#D2A256] text-white' : 'bg-gray-50 text-gray-500'}`}>{status.toUpperCase()}</button>
                            ))}
                            <Search className="w-5 h-5 text-gray-300 ml-auto hidden sm:block" />
                        </div>

                        {/* Booking Listing */}
                        <div className="space-y-6">
                            {getFilteredData().length > 0 ? getFilteredData().map(order => (
                                <div key={order.id} className="transition-all animate-in fade-in slide-in-from-bottom-2">
                                    {bookingType === 'hotel' && order.orderRooms?.map(room => (
                                        <div key={room.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <BookingStatusPill status={order.status} /> 
                                                <span className='text-gray-400 text-sm'>• Out: {formatDayAndDate(room.checkOut)}</span>
                                            </div>
                                            <div className="flex gap-5 border-b pb-5">
                                                <img src={room.property?.images?.[0]?.image || "https://placehold.co/400x400?text=Hotel"} className="w-28 h-28 object-cover rounded-xl border" />
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold">{room.property?.name}</h3>
                                                    <p className="text-sm text-gray-500">{room.property?.city}</p>
                                                    <div className="mt-3 text-sm"><p>Room: <span className='font-bold'>{room.roomType?.room_type}</span></p><p className='text-[#D2A256] font-extrabold'>{formatShortDate(room.checkIn)} - {formatShortDate(room.checkOut)}</p></div>
                                                </div>
                                            </div>
                                            <div className='pt-4 flex gap-3'>
                                                {/* ✅ VIEW DETAILS BUTTON RESTORED */}
                                                <button onClick={() => openDetails(order, room)} className="flex-1 border border-gray-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100">View Details</button>
                                                <button onClick={() => setSelectedInvoice(order)} className="flex-1 border border-gray-200 py-2.5 rounded-lg text-xs font-black uppercase text-gray-500">Invoice</button>
                                                <button onClick={() => navigate(`/room-booking/${room.property.id}`)} className="flex-1 bg-[#D2A256] text-white py-2.5 rounded-lg text-xs font-black uppercase">Book Again</button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* PACKAGE VIEW */}
{bookingType === 'package' && (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-bold text-gray-700">{order.status}</span>
            <span className='text-gray-400 text-sm'>• ID: #{order.id}</span>
        </div>
        
        <div className="flex gap-6 border-b pb-5">
            <img src={order.holidayPackage?.hero_image} className="w-28 h-28 object-cover rounded-xl border bg-gray-100" />
            <div className="flex-1">
                <h3 className="text-xl font-black text-gray-900">{order.holidayPackage?.title}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 font-bold mt-1 uppercase tracking-tighter">
                    <MapPin size={12} className="text-[#D2A256]" /> {order.holidayPackage?.included_cities?.join(" • ")}
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> {formatShortDate(order.startDate)} - {formatShortDate(order.endDate)}</div>
                    <div className="flex items-center gap-1.5"><Users size={14} className="text-gray-400" /> {order.adults} Persons</div>
                </div>
            </div>
        </div>

        {/* ✅ UPDATED BUTTONS FOR PACKAGE */}
        <div className='pt-4 flex gap-3'>
            {/* View Details - Filhal alert de sakte ho ya alag modal bana sakte ho */}
            <button 
                onClick={() => openPackageDetails(order)} 
                className="flex-1 border border-gray-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all"
            >
                View Details
            </button>

            {/* Book Again - Redirect to the package detail page */}
            <button 
                onClick={() => navigate(`/package-detail/${order.holidayPackage?.id}`)}
                className="flex-1 bg-[#D2A256] text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-md hover:bg-[#b38842] transition-all"
            >
                Book Again
            </button>
        </div>
    </div>
)}
                                </div>
                            )) : (
                                <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed"><ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" /><p className="text-gray-400 font-bold uppercase text-[10px]">No {bookingType} bookings found.</p></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <BookingDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} data={selectedBooking} />
                <PackageDetailModal 
    isOpen={isPackageModalOpen} 
    onClose={() => setIsPackageModalOpen(false)} 
    order={selectedPackageOrder} 
/>

            {selectedInvoice && (
                <div className="fixed inset-0 z-[200] bg-white overflow-auto print-only-invoice">
                    <div className="max-w-[800px] mx-auto p-4 flex items-center no-print border-b mb-4">
                        <button onClick={() => setSelectedInvoice(null)} className="bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 font-bold shadow-md"><ArrowLeft size={16} /> Back</button>
                    </div>
                    <InvoicePDF invoiceData={selectedInvoice} />
                </div>
            )}
        </div>
    );
};

const PackageDetailModal = ({ isOpen, onClose, order }: { isOpen: boolean, onClose: () => void, order: any }) => {
    if (!isOpen || !order) return null;

    const pkg = order.holidayPackage;
    
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-[#263238] p-6 text-white flex justify-between items-start">
                    <div>
                        <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest mb-1">Package Confirmation</p>
                        <h2 className="text-2xl font-black">Order ID: #{order.id}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all"><XCircle className="w-6 h-6" /></button>
                </div>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-gray-50/30">
                    {/* Package Info */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                        <img src={pkg?.hero_image} className="w-24 h-24 rounded-2xl object-cover" alt="package" />
                        <div>
                            <h3 className="font-black text-xl text-gray-900">{pkg?.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{pkg?.included_cities?.join(" • ")}</p>
                        </div>
                    </div>

                    {/* Stay & Guests */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Duration</p>
                            <p className="text-sm font-black text-gray-800 mt-1">{formatShortDate(order.startDate)} - {formatShortDate(order.endDate)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Travelers</p>
                            <p className="text-sm font-black text-gray-800 mt-1">{order.adults} Adults, {order.children || 0} Children</p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Billing Summary</h4>
                        <div className="flex justify-between items-center pt-3 border-t border-dashed">
                            <span className="font-bold text-gray-800 text-lg">Amount Paid</span>
                            <span className="text-2xl font-black text-green-600">₹{order.totalPrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white border-t border-gray-100">
                    <button className="w-full bg-[#D2A256] text-white py-4 rounded-2xl text-sm font-black hover:bg-[#b88d45] transition-all shadow-lg uppercase tracking-widest">
                        Download Package Voucher
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyBookingsPage;