import React from 'react';
import { Check, MapPin, Calendar, Users, Mail, Phone, Home, Download, Plane, Hotel } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SuccessCardProps {
    orderData: any; 
}

const HolidayBookingSuccessCard: React.FC<SuccessCardProps> = ({ orderData }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const selectionType = location.state?.type || 'flight';

    if (!orderData) return null;

    const pkg = orderData.holidayPackage;
    const customer = orderData.customer;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "TBA";
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-[300] bg-gray-50/90 backdrop-blur-md overflow-y-auto pt-10 pb-10 flex justify-center font-opensans print:p-0 print:overflow-visible">
            
            {/* ✅ Added ID 'printable-card' here to target specifically for print */}
            <div id="printable-card" className="w-full max-w-2xl bg-transparent animate-in fade-in zoom-in duration-500 print:w-full print:max-w-full">

                {/* 1. Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D1FAE5] rounded-full mb-4 shadow-sm">
                        <Check className="text-[#10B981]" size={32} strokeWidth={3} />
                    </div>
                    <h1 className="text-[24px] font-bold text-gray-900 font-opensans">Booking Confirmed!</h1>
                    <p className="text-gray-500 text-[18px] mt-1 font-opensans">
                        Your trip to {pkg?.included_cities?.[0] || 'your destination'} has been successfully booked
                    </p>
                </div>

                {/* 2. Main Detail Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6 relative overflow-hidden print:shadow-none print:border-gray-300">

                    {/* Booking ID Header */}
                    <div className="text-center mb-8">
                        <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1 font-opensans">
                            Booking ID
                        </p>
                        <h2 className="text-[20px] font-bold text-gray-800 font-opensans">{orderData.receipt || `SHN-${orderData.id}-2026`}</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Info Rows */}
                        <div className="flex gap-4">
                            <MapPin className="text-gray-400 shrink-0" size={24} />
                            <div>
                                <p className="text-[18px] font-bold text-gray-800 font-opensans">Destination</p>
                                <p className="text-[18px] text-gray-500 font-opensans">{pkg?.included_cities?.join(", ") || "Package Location"}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Calendar className="text-gray-400 shrink-0" size={24} />
                            <div>
                                <p className="text-[18px] font-bold text-gray-800 font-opensans">Travel Dates</p>
                                <p className="text-[18px] text-gray-500 font-opensans">
                                    {formatDate(orderData.startDate)} - {formatDate(orderData.endDate)} ({pkg?.nights || 0} Nights)
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pb-6 border-b border-gray-100">
                            <Users className="text-gray-400 shrink-0" size={24} />
                            <div>
                                <p className="text-[18px] font-bold text-gray-800 font-opensans">Guests</p>
                                <p className="text-[18px] text-gray-500 font-opensans">{orderData.adults || 2} Adults, {orderData.children || 0} Children</p>
                            </div>
                        </div>

                        {selectionType === 'flight' && (
                            <div className="bg-[#F9FAFB] rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-left-2 print:bg-transparent print:border print:border-gray-200">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                                    <Plane className="text-orange-500" size={20} />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-[18px] font-bold text-gray-800 font-opensans">Confirmed Flight Included</p>
                                    <p className="text-[16px] text-gray-500 uppercase tracking-tight font-opensans">
                                        {pkg?.included_cities?.[0] || 'Origin'} Arrival • {formatDate(orderData.startDate)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-[#F9FAFB] rounded-xl p-4 flex items-center gap-4 print:bg-transparent print:border print:border-gray-200">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                                <Hotel className="text-blue-500" size={20} />
                            </div>
                            <div className="flex-grow">
                                <p className="text-[18px] font-bold text-gray-800 font-opensans">{pkg?.title || "Luxury Stay"}</p>
                                <p className="text-[16px] text-gray-500 font-opensans">
                                    Stay in {pkg?.included_cities?.[0] || "Destination"} • Premium Inclusions
                                </p>
                            </div>
                        </div>

                        {/* Contact Info Footer */}
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-[18px] font-bold text-gray-800 mb-3 font-opensans">Confirmation sent to:</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-[18px] text-gray-500 font-opensans">
                                    <Mail size={18} /> {customer?.email || "guest@email.com"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Action Buttons - Hidden in Print */}
                <div className="flex flex-col sm:flex-row gap-4 px-2 mt-8 no-print">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 bg-[#10B981] text-white py-3.5 rounded-lg font-bold text-[18px] flex items-center justify-center gap-2 hover:bg-[#059669] transition-all shadow-md active:scale-95 font-opensans"
                    >
                        <Download size={20} /> Download Invoice / PDF
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 bg-white text-gray-700 py-3.5 rounded-lg font-bold text-[18px] border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95 font-opensans"
                    >
                        <Home size={20} /> Back to Home
                    </button>
                </div>

                {/* ✅ Global Print Styles - Fixes the footer/background issue */}
                <style>{`
                    @media print {
                        /* 1. Hide EVERYTHING in the body */
                        body * {
                            visibility: hidden;
                        }

                        /* 2. Show ONLY our specific card and its children */
                        #printable-card, #printable-card * {
                            visibility: visible;
                        }

                        /* 3. Position the card at the absolute top-left of the page */
                        #printable-card {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            margin: 0;
                            padding: 20px; /* Thoda padding taaki chipke nahi */
                        }

                        /* 4. Hide elements marked explicitly as no-print (redundant but safe) */
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default HolidayBookingSuccessCard;