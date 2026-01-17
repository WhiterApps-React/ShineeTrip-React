import React, { useState, useEffect } from 'react';
import { AlertCircle,ArrowLeft,Trash2, X, Phone, Mail, Award, Shield, Clock, Edit2, Loader2, ArrowRight, Plus } from 'lucide-react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'; // ✅ FIX 1: useNavigate import kiya
import BookingSuccessCard from '../components/ui/BookingSuccessCard'; // ✅ NEW: Success Card Import
import BookingOrderSummary from '../components/ui/BookingOrderSummary';

// Define global Razorpay object for TypeScript compiler
declare global {
    interface Window {
        Razorpay: any;
    }
}

// Helper to format date
const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

const BookingPage: React.FC = () => {
    const [formData, setFormData] = useState({
        phoneCode: '+91',
        phone: '',
        email: '',
        title: '',
        firstName: '',
        lastName: '',
        gstNumber: '',
        address: '',
        specialRequests: '',
        agreePolicy: false
    });
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');
    const [isBookingSuccessful, setIsBookingSuccessful] = useState(false); // ✅ NEW State for success card
    const [successOrderId, setSuccessOrderId] = useState(''); // Store the final Order ID
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [showAuthErrorModal, setShowAuthErrorModal] = useState(false);
    const paymentTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const paymentCompletedRef = React.useRef(false);
    const [dbOrderId, setDbOrderId] = useState<number | null>(null);
    const [showValidationModal, setShowValidationModal] = useState(false); // ✅ New State for Validation Popup
    

    // 1. Extra Guests ke liye State
const [guestList, setGuestList] = useState<{ title: string; firstName: string; lastName: string }[]>([]);

// 2. Add Guest Button ka Function
const handleAddGuest = () => {
    setGuestList([...guestList, { title: '', firstName: '', lastName: '' }]);
};

// 3. Remove Guest Button ka Function
const handleRemoveGuest = (index: number) => {
    const updatedList = [...guestList];
    updatedList.splice(index, 1);
    setGuestList(updatedList);
};

// 4. Input Change Handler for Guests
const handleGuestChange = (index: number, field: string, value: string) => {
    const updatedList = [...guestList];
    // @ts-ignore (TypeScript strictness handle karne ke liye simple fix)
    updatedList[index][field] = value;
    setGuestList(updatedList);
};


    

    const navigate = useNavigate(); // ✅ FIX 2: useNavigate hook use kiya
    const [searchParams] = useSearchParams();
    const propertyId = searchParams.get('propertyId');
    
    const retailPriceStr = searchParams.get('retailPrice') || '0';
    const taxPriceStr = searchParams.get('taxPrice') || '0';
    const roomName = searchParams.get('roomName') || 'Deluxe Room';
    const checkInStr = searchParams.get('checkIn') || '';
    const checkOutStr = searchParams.get('checkOut') || '';
    const roomId = searchParams.get('roomId') || ''; 

    const retailPrice = parseFloat(retailPriceStr);
    const taxPrice = parseFloat(taxPriceStr);
    
    // ✅ FIX 1: Price calculation corrected (Retail Price + Taxes)
    const finalTotal = retailPrice + taxPrice; 


    const token = sessionStorage.getItem('shineetrip_token');
    const customerIdStr = sessionStorage.getItem('shineetrip_db_customer_id') || '1'; // Using db customer ID
    if (!customerIdStr || customerIdStr === '1' || isNaN(parseInt(customerIdStr))) {
    setPaymentMessage('Customer profile not loaded. Please log out and log in again.');
    setIsProcessing(false);
    return;
}
    const customerId = parseInt(customerIdStr) || 1; 

    // ✅ FINAL CONFIRMED PUBLIC KEY
    const RAZORPAY_KEY = 'rzp_test_Ri1Lg8tbqZnUaT';

    // API URLS - Confirmed by your Postman testing
    const API_BASE = 'http://46.62.160.188:3000';
    const CREATE_ORDER_URL = `${API_BASE}/order/book-now`;
    const VERIFY_URL = `${API_BASE}/order/success`;
    const FAILURE_URL = `${API_BASE}/order/failure`;
    const INVOICE_URL = `${API_BASE}/invoices`;
    CREATE_ORDER_URL.trim();

    console.log("Using API Base:", API_BASE);
    console.log("Create Order URL:", CREATE_ORDER_URL);

const PHONE_RULES: Record<string, { min: number; max: number }> = {
  '+91': { min: 10, max: 10 }, // India
  '+1': { min: 10, max: 10 },  // USA
  '+44': { min: 10, max: 10 }, // UK
};

const phoneLimit = PHONE_RULES[formData.phoneCode]?.max ?? 15;

    // --- NEW HELPER: Validation Logic ---
const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Regex for basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Simple phone check: 8 to 15 digits
    const phone = formData.phone.trim();
    const countryRule = PHONE_RULES[formData.phoneCode];
    // Basic Name check: letters and spaces only
    const nameRegex = /^[A-Za-z\s]+$/; 
    
    if (!phone) {
    errors.phone = 'Phone number is required.';
    } else if (!/^\d+$/.test(phone)) {
      errors.phone = 'Phone number must contain digits only.';
    } else if (!countryRule) {
      errors.phone = 'Unsupported country code selected.';
    } else if (phone.length < countryRule.min || phone.length > countryRule.max) {
      errors.phone = `Phone number must be exactly ${countryRule.min} digits for ${formData.phoneCode}.`;
    }

    // 2. Email Validation (Required + Format)
    if (!formData.email.trim()) {
        errors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address.";
    }
    
    // Validation mein ye line add karo
    if (!formData.address.trim()) {
        errors.address = "Billing address is required for invoice.";
    }

    // 3. Title Validation (Required)
    if (!formData.title) {
        errors.title = "Title is required.";
    }

    // 4. First Name Validation (Required + Format)
    if (!formData.firstName.trim()) {
        errors.firstName = "First name is required.";
    } else if (!nameRegex.test(formData.firstName.trim())) {
        errors.firstName = "First name can only contain letters and spaces.";
    }

    // 5. Last Name Validation (Required + Format)
    if (!formData.lastName.trim()) {
        errors.lastName = "Last name is required.";
    } else if (!nameRegex.test(formData.lastName.trim())) {
        errors.lastName = "Last name can only contain letters and spaces.";
    }

    // 6. Policy Agreement (Checked)
    if (!formData.agreePolicy) {
        errors.agreePolicy = "You must agree to the privacy policy.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
};



const [showPolicyModal, setShowPolicyModal] = useState(false); // Popup kholne ke liye
const [policyText, setPolicyText] = useState(""); // Policy ka HTML text store karne ke liye

// ✅ API se Policy Fetch karne ke liye (Ye useEffect add karo)
useEffect(() => {
    const fetchPolicy = async () => {
        if (!propertyId) return;
        try {
            // Token optional rakha hai taaki public data aa jaye
            const res = await fetch(`http://46.62.160.188:3000/properties/${propertyId}`);
            if (res.ok) {
                const data = await res.json();
                // API se 'policies' field utha rahe hain
                setPolicyText(data.policies || "<p>No specific privacy policy available.</p>");
            }
        } catch (err) {
            console.error("Failed to fetch policies", err);
        }
    };
    fetchPolicy();
}, [propertyId]);
    
    // --- Core Razorpay Logic ---
    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setPaymentMessage('');
        setFormErrors({});
        setIsRazorpayOpen(false);
        
        
        if (!validateForm()) {
        // Validation fail hone par, error message set karo
            setShowValidationModal(true);
        setPaymentMessage('Please check your details. All required fields must be valid.'); 
        return; // Execution yahan ruk jayega
    }

        if (!formData.agreePolicy) {
            setShowValidationModal(true);
            setPaymentMessage('You must agree to the privacy policy.');
            return;
        }

       if (finalTotal <= 0 || isNaN(finalTotal)) { 
            setPaymentMessage('Invalid total price for booking.');
            return;
        }
        
        if (!token || isNaN(customerId)) { // Check if customerId is NaN
             setPaymentMessage('Authorization token or Customer ID missing/invalid. Please log in again.');
             return;
        }

   

    // Ensure propertyId exists before attempting conversion
        if (!propertyId) {
            setPaymentMessage('Error: Missing property information in URL. Please go back and select a property.');
            setIsProcessing(false);
            return; // Stop execution if missing
        }
        
        // Convert to Int and check if it's a valid ID (> 0)
        const propertyIdInt = parseInt(propertyId) || 0;

        if (propertyIdInt <= 0) {
            setPaymentMessage('Error: Invalid property ID provided.');
            setIsProcessing(false);
            return; // Stop execution if invalid ID
        }
        
        setIsProcessing(true);
        const amountInPaise = Math.round(finalTotal * 100);

        console.log("Token check before API:", token ? "Token present" : "TOKEN MISSING"); // NEW!
        console.log("Token",token);
        console.log("Customer ID check before API:", customerId); // NEW!

        try {
            // Step 1: POST /order/create to generate Razorpay Order ID
            const createOrderPayload = {
                orderRooms: [
                    {
                        propertyId: propertyIdInt,
                        roomTypeId: parseInt(roomId),
                        adults: parseInt(searchParams.get('adults') || '2'),
                        children: parseInt(searchParams.get('children') || '0'),
                        checkIn: checkInStr,
                        checkOut: checkOutStr,
                        roomPrice: retailPrice, 
                    }
                ],
                totalPrice: finalTotal,
                paymentMethod: "online",
                currency: "INR",
                notes: { bookingSource: "web-portal-checkout" },
                customerId: customerId, // Using parsed integer customer ID
            };

            console.log("Create Order Payload Sent:", createOrderPayload);
              console.log("Token",token);
console.log("Customer ID check before API:", customerId);

            const orderResponse = await fetch(CREATE_ORDER_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(createOrderPayload),
            });

            const responseText = await orderResponse.text();
            

            if (!orderResponse.ok) {
                const errorStatus = orderResponse.status;

                // ✅ CRITICAL FIX: Token Expiry (401/403) check
                if (errorStatus === 401 || errorStatus === 403) {
                    // Reset state & show auth popup
                    sessionStorage.removeItem('shineetrip_token');
                    setIsProcessing(false); 
                    setShowAuthErrorModal(true);
                    return; 
                }
                // Detailed error handling for 404/403/Customer Not Found
                let errorMsg = `API failed (${orderResponse.status}).`;
                try {
                    const errorData = JSON.parse(responseText);
                    if (orderResponse.status === 404) {
                         errorMsg = `Error 404: API endpoint not found at ${CREATE_ORDER_URL}.`;
                    } else if (errorData.message) {
                        errorMsg = errorData.message;
                    }
                } catch {
                    errorMsg = `Server Error (${orderResponse.status}).`;
                }
                throw new Error(errorMsg);
            }
            
            const orderData = JSON.parse(responseText);
            const razorpayOrderId = orderData.razorpayOrderId;
            const backendId = orderData.orderId;
            console.log("Backend Response:", orderData);
            setDbOrderId(backendId);
            
            setPaymentMessage(`Order ID ${razorpayOrderId} generated. Opening payment gateway...`);
            
            // Step 2: Initialize Razorpay Checkout
            if (typeof window.Razorpay === 'undefined') {
                throw new Error("Razorpay SDK not loaded. Please ensure script tag is in your HTML.");
            }

            const options = {
                key: RAZORPAY_KEY, 
                amount: amountInPaise, 
                currency: "INR",
                name: "Shinee Trip Booking",
                description: `Room Booking: ${roomName}`,
                order_id: razorpayOrderId,
                handler: async function (response: any) {
                    await verifyPayment(response, razorpayOrderId , backendId);
                },
                prefill: {
                    name: formData.firstName + ' ' + formData.lastName,
                    email: formData.email,
                    contact: formData.phoneCode + formData.phone,
                },
                theme: { "color": "#D2A256" }
            };

            const rzp1 = new window.Razorpay(options); 
            
            // Handle Payment Failure/Cancellation
            rzp1.on('modal.close', function() {
            // ✅ CRITICAL FIX: Functional update for reliable state check
            // Isse isProcessing state ki current value milegi
            setIsProcessing((currentIsProcessing) => {
            if (!paymentCompletedRef.current && currentIsProcessing) {
            setPaymentMessage('Payment window closed. Please try again.');
            return false; // Loader ko band karo
        }
        return currentIsProcessing;
    });
    
            setIsRazorpayOpen(false); // Ye to direct set ho sakta hai
        });
            setIsRazorpayOpen(true);
            rzp1.open(); // Open the payment gateway popup

            paymentTimeoutRef.current = setTimeout(() => {
   if (!paymentCompletedRef.current) {
    setShowTimeoutModal(true);
    setPaymentMessage('Payment window timed out or connection lost. Please try again.');
    setIsProcessing(false);
  }
}, 60000);


        } catch (error) {
            setPaymentMessage(error instanceof Error ? error.message : 'An unexpected error occurred during payment.');
            console.error("Payment Initiation Error:", error);
        } finally {
            if (!paymentMessage.includes("Payment Failed") && typeof window.Razorpay === 'undefined') setIsProcessing(false);
        }
    };
    
    // Step 3: Verify Payment Success
    const verifyPayment = async (razorpayResponse: any, orderId: string, backendId: number) => {
    setIsProcessing(true); 
try {
            const verificationPayload = {
                razorpayOrderId: orderId,
                razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                razorpaySignature: razorpayResponse.razorpay_signature,
            };
            
            const verifyResponse = await fetch(VERIFY_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(verificationPayload),
            });

            if (verifyResponse.ok) {
                // ✅ LOGIC CLEANUP: Successful block
                console.log("3. Payment Verified! Creating Invoice for:", backendId);
                await createInvoiceAfterPayment(backendId);

                paymentCompletedRef.current = true;
                if (paymentTimeoutRef.current) clearTimeout(paymentTimeoutRef.current);

                setPaymentMessage('Booking successful! Invoice Generated.');
                setSuccessOrderId(orderId);
                setIsBookingSuccessful(true);
            } else {
                const text = await verifyResponse.text();
                throw new Error(text || 'Verification failed');
            }
        } catch (error) {
            console.error("Verification Catch Error:", error);
            setPaymentMessage('Payment verification failed.');
        } finally {
            setIsProcessing(false);
        }
    };
    const createInvoiceAfterPayment = async (backendOrderId: number) => {
    // Validation: Address check
    if (!formData.address) {
        console.error("Address is required for Invoice");
        return;
    }

    const invoicePayload = {
        orderId: backendOrderId, 
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        notes: formData.specialRequests || "Booking Invoice",
        billingName: `${formData.firstName} ${formData.lastName}`,
        billingEmail: formData.email,
        billingPhone: `${formData.phoneCode}${formData.phone}`,
        billingAddress: formData.address, // User ka real address
        taxIdentifier: formData.gstNumber || "" // User ka GST number
    };

    try {
        const response = await fetch(`${API_BASE}/invoices`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(invoicePayload),
        });

        if (response.ok) {
            console.log("Invoice created successfully!");
        } else {
            const errorData = await response.json();
            console.error("Invoice API Error:", errorData);
        }
    } catch (err) {
        console.error("Network Error calling Invoice API:", err);
    }
};


    
    // Step 4: Mark Order as Failed (for cancellation/failure)
    const markOrderAsFailed = async (orderId: string, errorResponse: any) => {
        try {
            await fetch(FAILURE_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId,
                    errorMessage: errorResponse.description,
                    errorCode: errorResponse.code,
                }),
            });
        } catch (err) {
            console.error("Failed to mark order as failed:", err);
        }
    };
    // --- End Core Razorpay Logic ---


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-100 pt-[116px]">
            {/* ✅ NEW: Timeout/Connection Lost Modal */}
{showTimeoutModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-300">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => window.location.reload()} // Background click par bhi reload
        />

        {/* Popup Card */}
        <div 
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300"
            style={{ border: "2px solid #D2A256" }}
        >
            <X 
                className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-800" 
                size={20} 
                onClick={() => window.location.reload()} // Close button par reload
            />
            
            <Clock size={40} className="mx-auto text-red-500 mb-4" />
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">Connection Interrupted</h3>
            
            {/* ✅ REQUIRED MESSAGE */}
            <p className="text-gray-600 text-base leading-relaxed mb-6 font-medium">
                Payment window timed out or connection lost. Please try again.
            </p>

            {/* Reload Button */}
            <button
                onClick={() => window.location.reload()}
                className="w-full bg-yellow-600 text-white font-semibold py-3 rounded-lg hover:bg-yellow-700 transition-colors"
            >
                Try Again / Reload Page
            </button>
        </div>
    </div>
)}

{/* ✅ PRIVACY POLICY MODAL */}
{showPolicyModal && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 animate-in fade-in duration-300">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowPolicyModal(false)} 
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 max-h-[80vh] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">Privacy & Booking Policy</h3>
                <button 
                    onClick={() => setShowPolicyModal(false)}
                    className="text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 p-2 rounded-full"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto pr-2 custom-scrollbar">
                <div 
                    className="prose prose-sm max-w-none text-gray-600 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>li]:mb-1"
                    dangerouslySetInnerHTML={{ __html: policyText }} 
                />
            </div>

            {/* Footer Button */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                    onClick={() => setShowPolicyModal(false)}
                    className="w-full bg-[#B98E45] text-white font-bold py-3 rounded-xl hover:bg-[#a37d3b] transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

{/* ✅ VALIDATION ERROR MODAL */}
{showValidationModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-300">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowValidationModal(false)} // Bahar click karne par close ho jaye
        />

        {/* Popup Card */}
        <div 
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300"
            style={{ border: "2px solid #ef4444" }} // Red border for error attention
        >
            {/* Close Button */}
            <button 
                onClick={() => setShowValidationModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
            >
                <X size={20} />
            </button>
            
            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-red-600" />
            </div>
            
            {/* Heading */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">Missing Details</h3>
            
            {/* Message */}
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Please fill in all the required fields correctly to proceed with your booking.
            </p>

            {/* OK Button */}
            <button
                onClick={() => setShowValidationModal(false)}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg"
            >
                OK, I'll Fix It
            </button>
        </div>
    </div>
)}

{/* ✅ NEW: Authorization/Token Expired Modal */}
{showAuthErrorModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-in fade-in duration-300">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => navigate('/')} // Redirect to home on backdrop click
        />

        {/* Popup Card */}
        <div 
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300"
            style={{ border: "2px solid #D2A256" }}
        >
            <X 
                className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-800" 
                size={20} 
                onClick={() => navigate('/')} // Close button par redirect
            />
            
            <Shield size={40} className="mx-auto text-yellow-600 mb-4" />
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">Session Expired</h3>
            
            <p className="text-gray-600 text-base leading-relaxed mb-6 font-medium">
                Your session has expired while processing the payment. Please log in again to complete your booking.
            </p>

            {/* Reload/Login Button */}
            <button
                onClick={() => navigate('/')} // Home/Login page par bhej do
                className="w-full bg-yellow-600 text-white font-semibold py-3 rounded-lg hover:bg-yellow-700 transition-colors"
            >
                Go to Login Page
            </button>
        </div>
    </div>
)}
            {/* Render Success Card if successful */}
            {isBookingSuccessful && successOrderId && (
                <BookingSuccessCard roomName={roomName} orderId={successOrderId} />
            )}

            {/* Header / Progress Steps (Unchanged) */}
            <div className="bg-white py-6 px-6 mb-6">
                <div className="max-w-md mx-auto flex items-center justify-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-medium">1</div>
                        <span className="font-medium">Room 1</span>
                    </div>
                    <div className="w-32 h-px bg-gray-300"></div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-medium">2</div>
                        <span className="text-gray-500">Reservation</span>
                    </div>
                </div>
            </div>

            

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Section - Guest Details Form */}
                    <div className="lg:col-span-2">
                        {/* Right Section - Booking Summary */}
<div className="lg:col-span-1 space-y-6">

    {/* 1. ✅ New Design Component (Image wala) */}
    <BookingOrderSummary 
        propertyId={propertyId || ''}
        checkIn={checkInStr}
        checkOut={checkOutStr}
        adults={searchParams.get('adults') || '2'}
        children={searchParams.get('children') || '0'}
        roomName={roomName}
        roomCount={'1'} // Abhi ke liye 1 hardcoded hai, ya logic se nikalo agar hai
    />

    {/* 2. Price Breakdown Card (Isko neeche retain kar sakte ho agar chahiye, ya hata do) */}
    {/* <div className="bg-white rounded-lg shadow-sm p-6">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Price Summary</h2>
         </div>
         
         <div className="space-y-2 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Room Price</span>
                  <span className="font-medium">INR {retailPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span className="font-medium">INR {(finalTotal - retailPrice).toFixed(0)}</span>
              </div>
         </div>
         <div className="flex justify-between items-center pt-4">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-green-600">INR {finalTotal.toLocaleString()}</span>
         </div>
    </div> */}
</div>


{/* ... inside your component ... */}

<div className="bg-white mt-4 rounded-xl shadow-sm p-6 md:p-8">
    
    {/* Header with Add Guest Button */}
    <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Guest Details</h2>
<button 
    type="button" 
    onClick={handleAddGuest} // 👈 Ye add kiya
    className="bg-[#0085FF] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
>
    <Plus size={18} /> Add Guest
</button>
    </div>

    <form id="booking-form" onSubmit={handlePayment} className="space-y-6"> 
        
        {/* ROW 1: Names (Title, First Name, Last Name) - Reordered per image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            
            {/* Left Col: Title + First Name */}
            <div>
                <div className="flex gap-4 mb-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                    <label className="text-xs font-bold text-gray-500 uppercase flex-1">First Name</label>
                </div>
                <div className="flex gap-3">
                    {/* Title Select */}
                    <div className="relative min-w-[80px]">
                        <select
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`w-full appearance-none bg-gray-100 text-gray-900 font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.title ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                            disabled={isProcessing}
                        >
                            <option value="">Mr</option>
                            <option value="Mr.">Mr</option>
                            <option value="Mrs.">Mrs</option>
                            <option value="Ms.">Ms</option>
                        </select>
                        {/* Custom Arrow for select to match image style */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    {/* First Name Input */}
                    <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`flex-1 bg-gray-100 text-gray-900 font-medium placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.firstName ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                        disabled={isProcessing}
                        required
                    />
                </div>
                {/* Errors */}
                <div className="flex gap-3 mt-1">
                     <div className="min-w-[80px]">{formErrors.title && <span className="text-red-500 text-[10px]">{formErrors.title}</span>}</div>
                     <div>{formErrors.firstName && <span className="text-red-500 text-[10px]">{formErrors.firstName}</span>}</div>
                </div>
            </div>

            {/* Right Col: Last Name */}
            <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                 <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-100 text-gray-900 font-medium placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.lastName ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                    disabled={isProcessing}
                    required
                />
                {formErrors.lastName && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.lastName}</span>}
            </div>
        </div>

        {/* ✅ DYNAMIC GUEST LIST RENDER */}
{guestList.map((guest, index) => (
    <div key={index} className="animate-in fade-in slide-in-from-top-4 duration-300">
        
        {/* Header for Guest X */}
        <div className="flex justify-between items-center mb-2 mt-4 border-t border-gray-100 pt-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Guest {index + 2} Details {/* Index 0 means Guest 2 */}
            </span>
            <button
                type="button"
                onClick={() => handleRemoveGuest(index)}
                className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium transition-colors"
            >
                <Trash2 size={14} /> Remove
            </button>
        </div>

        {/* Guest Input Fields (Same Design as Primary) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title + First Name */}
            <div>
                <div className="flex gap-3">
                    {/* Title */}
                    <div className="relative min-w-[80px]">
                        <select
                            value={guest.title}
                            onChange={(e) => handleGuestChange(index, 'title', e.target.value)}
                            className="w-full appearance-none bg-gray-100 text-gray-900 font-medium px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Title</option>
                            <option value="Mr.">Mr</option>
                            <option value="Mrs.">Mrs</option>
                            <option value="Ms.">Ms</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    {/* First Name */}
                    <input
                        type="text"
                        placeholder="First Name"
                        value={guest.firstName}
                        onChange={(e) => handleGuestChange(index, 'firstName', e.target.value)}
                        className="flex-1 bg-gray-100 text-gray-900 font-medium placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required // Agar additional guest add kiya hai to naam dena zaroori hai
                    />
                </div>
            </div>

            {/* Last Name */}
            <div>
                 <input
                    type="text"
                    placeholder="Last Name"
                    value={guest.lastName}
                    onChange={(e) => handleGuestChange(index, 'lastName', e.target.value)}
                    className="w-full bg-gray-100 text-gray-900 font-medium placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
        </div>
    </div>
))}

        {/* ROW 2: Contact (Email & Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Email Field */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input
                    type="email"
                    name="email"
                    placeholder="Email ID"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-100 text-gray-900 font-medium placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                    disabled={isProcessing}
                    required
                />
                {formErrors.email && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.email}</span>}
            </div>

            {/* Mobile Number Field */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Numbers</label>
                <div className={`flex bg-gray-100 rounded-xl overflow-hidden ${formErrors.phone ? 'ring-2 ring-red-500 bg-red-50' : 'focus-within:ring-2 focus-within:ring-blue-500'}`}>
                    
                    {/* Code Select */}
                    <div className="relative border-r border-gray-300">
                        <select
                            name="phoneCode"
                            value={formData.phoneCode}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, phoneCode: e.target.value, phone: '' }));
                                setFormErrors(prev => ({ ...prev, phone: '' }));
                            }}
                            className="appearance-none bg-transparent text-gray-900 font-bold px-4 py-3 pr-8 focus:outline-none h-full cursor-pointer"
                        >
                            <option>+91</option>
                            <option>+1</option>
                            <option>+44</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    {/* Phone Input */}
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                            const onlyDigits = e.target.value.replace(/\D/g, '');
                            const limitedDigits = onlyDigits.slice(0, phoneLimit);
                            setFormData(prev => ({ ...prev, phone: limitedDigits }));
                        }}
                        maxLength={phoneLimit}
                        placeholder="Contact Number"
                        className="flex-1 bg-transparent text-gray-900 font-medium placeholder-gray-500 px-4 py-3 focus:outline-none"
                        disabled={isProcessing}
                    />
                </div>
                {formErrors.phone && <span className="text-red-500 text-[10px] mt-1 block">{formErrors.phone}</span>}
            </div>
        </div>

        {/* GST Toggle / Header (Optional visual separator) */}
        <div className="flex justify-end">
             <span className="text-sm font-bold text-gray-900 cursor-pointer hover:underline">Enter GST Details</span>
        </div>

        {/* GST Number */}
        <div>
            <input
                type="text"
                name="gstNumber"
                placeholder="GST Number (Optional)"
                value={formData.gstNumber}
                onChange={handleInputChange}
                className="w-full bg-gray-100 text-gray-900 font-medium placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
            />
        </div>

        {/* Billing Address (Matching Style) */}
        <div>
            <textarea
                name="address"
                placeholder="Billing Address (Required for Invoice)*"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className={`w-full bg-gray-100 text-gray-900 font-medium placeholder-gray-500 px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.address ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                disabled={isProcessing}
            />
            {formErrors.address && <span className="text-red-500 text-[10px] mt-1 pl-1">{formErrors.address}</span>}
        </div>

        {/* Special Requests (Matching Style) */}
        <div>
            <textarea
                name="specialRequests"
                placeholder="Special Requests (Optional)"
                value={formData.specialRequests}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-gray-100 text-gray-900 font-medium placeholder-gray-500 px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
            />
        </div>

        {/* Privacy Policy Checkbox */}
<div className="flex items-start gap-3 pt-2">
    <div className="relative flex items-center">
        <input
            type="checkbox"
            name="agreePolicy"
            checked={formData.agreePolicy}
            onChange={handleInputChange}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-[#B98E45] checked:bg-[#B98E45]"
            disabled={isProcessing}
        />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </div>
    </div>
    <label className="text-sm text-gray-600 mt-[1px]">
        I agree to the{' '}
        <button
            type="button" // Important: Button type button rakho taaki form submit na ho
            onClick={(e) => {
                e.preventDefault();
                setShowPolicyModal(true); // Popup open karega
            }}
            className="text-blue-600 font-medium hover:underline focus:outline-none"
        >
            privacy policy
        </button>
    </label>
</div>
        
{/* Payment Message/Error Display */}
{paymentMessage && (
    <div className={`p-4 rounded-xl text-sm font-medium mb-4 
        ${paymentMessage.toLowerCase().includes('success') 
            ? 'bg-green-100 text-green-700'  // Success = Green
            : paymentMessage.includes('generated') || paymentMessage.includes('Opening') 
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' // Progress = Yellow
            : 'bg-red-50 text-red-600 border border-red-200' // Error = Red
        }`}
    >
        {paymentMessage}
    </div>
)}

        {/* Submit Button - Kept the Yellow Brand Color for Action */}
        {/* <button 
            type="submit"
            className={`w-full bg-[#B98E45] hover:bg-[#a37d3b] text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 
                ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isProcessing}
        >
            {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
            {isProcessing ? 'Processing Payment...' : 'Confirm & Pay'}
        </button> */}

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
            <div className="flex flex-col items-center gap-1">
                <Award size={18} className="text-[#B98E45]" />
                <span>Best Price</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <Shield size={18} className="text-[#B98E45]" />
                <span>Secure Pay</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <Clock size={18} className="text-[#B98E45]" />
                <span>Instant Conf.</span>
            </div>
        </div>
    </form>
</div>
                    </div>

                    {/* Right Section - Booking Summary (Unchanged logic) */}
                    

{/* Right Section - Booking Summary & Coupons */}
<div className="  lg:col-span-1">
    <div className="sticky top-32 space-y-6">
        
        {/* 1. Price Breakdown Card (Design Matched) */}
        <div className="bg-white  rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
            
            {/* Top Gold Button */}
<div className="p-4  border-b border-gray-100">
    <button 
        type="submit"               
        form="booking-form"         
        disabled={isProcessing}    
        className={`w-full bg-[#B98E45] hover:bg-[#a37d3b] text-white font-bold py-3.5 rounded-lg shadow-sm transition-colors text-lg uppercase tracking-wide flex items-center justify-center gap-2
            ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
        {/* ✅ Same Functionality as Old Button (Loader + Text) */}
        {isProcessing ? (
            <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
            </>
        ) : (
            "PAY & Book Now"
        )}
    </button>
</div>

            {/* Price List */}
            <div className="p-6 space-y-4">
                
                {/* Base Fare */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Base fare per adult</span>
                    <span className="font-bold text-gray-900">₹{retailPrice.toLocaleString()}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Tax & Service Fee</span>
                    <span className="font-bold text-gray-900">₹{(finalTotal - retailPrice).toFixed(0)}</span>
                </div>

                {/* Dummy Charges (Design Match ke liye placeholder - Hata sakte ho agar nahi chahiye) */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Reservation charge</span>
                    <span className="font-bold text-gray-900">₹0</span>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-gray-200 my-4"></div>

                {/* Total Price */}
                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Price</span>
                    <span className="text-xl font-extrabold text-gray-900">₹{finalTotal.toLocaleString()}</span>
                </div>
            </div>
        </div>

        {/* 2. Coupon Code Section (Design Matched) */}
        {/* <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-5 text-base">Coupon Code</h3> */}
            
            {/* Coupon Options */}
            {/* <div className="space-y-4">
                
                <label className="flex items-start gap-3 cursor-pointer group relative">
                    <div className="mt-1">
                        <input type="radio" name="coupon" className="peer sr-only" />
                        <div className="w-4 h-4 rounded-full border border-gray-300 peer-checked:border-[#B98E45] peer-checked:bg-[#B98E45] relative"></div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between w-full">
                            <span className="font-bold text-gray-800 text-sm">MMTSMARTDEAL</span>
                            <span className="font-bold text-gray-900 text-sm">₹662</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-700 transition-colors">
                            Congratulations! Discount of ₹1191 Applied
                        </p>
                    </div>
                </label>

                
                <label className="flex items-start gap-3 cursor-pointer group relative">
                    <div className="mt-1">
                        <input type="radio" name="coupon" className="peer sr-only" />
                         <div className="w-4 h-4 rounded-full border border-gray-300 peer-checked:border-[#B98E45] peer-checked:bg-[#B98E45]"></div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between w-full">
                            <span className="font-bold text-gray-800 text-sm">WELCOMETRIP</span>
                            <span className="font-bold text-gray-900 text-sm">₹500</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Flat ₹500 off on your first booking.
                        </p>
                    </div>
                </label>
            </div> */}

            {/* Have a Coupon Code Input */}
            {/* <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Have a Coupon Code?" 
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#B98E45] focus:bg-white transition-all placeholder:text-gray-400"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B98E45] hover:text-[#a37d3b]">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div> */}
        {/* </div> */}

    </div>
</div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;