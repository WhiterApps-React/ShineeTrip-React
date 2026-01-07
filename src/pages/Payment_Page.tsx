import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Phone, Mail, Award, Shield, Clock, Edit2, Loader2 } from 'lucide-react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'; // ✅ FIX 1: useNavigate import kiya
import BookingSuccessCard from '../components/ui/BookingSuccessCard'; // ✅ NEW: Success Card Import

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
    
    // --- Core Razorpay Logic ---
    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setPaymentMessage('');
        setFormErrors({});
        setIsRazorpayOpen(false);


        if (!validateForm()) {
        // Validation fail hone par, error message set karo
        setPaymentMessage('Please check your details. All required fields must be valid.'); 
        return; // Execution yahan ruk jayega
    }

        if (!formData.agreePolicy) {
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
                    await verifyPayment(response, razorpayOrderId);
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
    const verifyPayment = async (razorpayResponse: any, orderId: string) => {
    setIsProcessing(true); 
    try {
        const verificationPayload = {
            razorpayOrderId: orderId,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature,
        };
        
        console.log("1. Sending Verification Payload:", verificationPayload);

        const verifyResponse = await fetch(VERIFY_URL, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(verificationPayload),
        });
        
        const verificationText = await verifyResponse.text();

        // FAIL CHECK
        if (!verifyResponse.ok) {
            console.error("2. Backend Verification FAILED:", verificationText);
            throw new Error(`Payment verification failed on server.`);
        }
        
        // SUCCESS BLOCK - Yahan tabhi aayega jab response.ok true hoga
        console.log("3. Payment Successfully Verified by Backend!");

        if (dbOrderId) {
            console.log("4. DB Order ID found:", dbOrderId, ". Now creating invoice...");
            await createInvoiceAfterPayment(dbOrderId);
        } else {
            console.warn("4. WARNING: dbOrderId is missing/null, cannot create invoice.");
        }

        // Baki success logic (modal open, success card etc.)
        paymentCompletedRef.current = true;
        setPaymentMessage('Booking successful!');
        setSuccessOrderId(orderId);
        setIsBookingSuccessful(true);

    } catch (error) {
        console.error("CATCH ERROR:", error);
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
                        <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-medium">2</div>
                        <span className="text-gray-500">Reservation</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Section - Guest Details Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm p-8">
                            <h2 className="text-2xl font-semibold mb-6">Guest Details</h2>

                            <form onSubmit={handlePayment} className="space-y-4"> {/* ✅ Form tag added with onSubmit */}
                                {/* Phone and Email Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* ===== PHONE NUMBER FIELD (Updated) ===== */}
                                    <div className="flex flex-col gap-1"> 
                                        <div className="flex gap-2">
                                            <select
                                              name="phoneCode"
                                              value={formData.phoneCode}
                                              onChange={(e) => {
                                                setFormData(prev => ({
                                                  ...prev,
                                                  phoneCode: e.target.value,
                                                  phone: ''          // 🔥 reset
                                                }));
                                                setFormErrors(prev => ({ ...prev, phone: '' }));
                                              }}
                                            >

                                                <option>+91</option>
                                                <option>+1</option>
                                                <option>+44</option>
                                            </select>
                                        <input
  type="tel"
  name="phone"
  value={formData.phone}
  onChange={(e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '');
    const limitedDigits = onlyDigits.slice(0, phoneLimit);

    setFormData(prev => ({
      ...prev,
      phone: limitedDigits
    }));
  }}
  maxLength={phoneLimit}
  placeholder="Phone Number"
  className={`flex-1 px-4 py-2.5 border rounded ${
    formErrors.phone ? 'border-red-500' : 'border-gray-300'
  }`}
  disabled={isProcessing}
/>

                                        </div>
                                        {/* ✅ Error Display for Phone */}
                                        {formErrors.phone && <span className="text-red-500 text-xs pl-2">{formErrors.phone}</span>} 
                                    </div>
                                    
                                    {/* ===== EMAIL FIELD (Added wrapper) ===== */}
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`} // Conditional border
                                            disabled={isProcessing}
                                            required
                                        />

                                        {/* ✅ Error Display for Email */}
                                        {formErrors.email && <span className="text-red-500 text-xs pl-2">{formErrors.email}</span>}
                                    </div>
                                </div>

                                {/* Title and Names Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* ===== TITLE SELECT (Wrapped) ===== */}
                                    <div className="flex flex-col gap-1">
                                        <select
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className={`px-4 py-2.5 border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 text-gray-500 ${formErrors.title ? 'border-red-500' : 'border-gray-300'}`} // Conditional border
                                            disabled={isProcessing}
                                        >
                                            <option value="">Select Title*</option>
                                            <option>Mr.</option>
                                            <option>Mrs.</option>
                                            <option>Ms.</option>
                                        </select>
                                        {/* ✅ Error Display for Title */}
                                        {formErrors.title && <span className="text-red-500 text-xs pl-2">{formErrors.title}</span>}
                                    </div>
                                    
                                    {/* ===== FIRST NAME INPUT (Wrapped) ===== */}
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="text"
                                            name="firstName"
                                            placeholder="First Name"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className={`px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'}`} // Conditional border
                                            disabled={isProcessing}
                                            required
                                        />
                                        {/* ✅ Error Display for First Name */}
                                        {formErrors.firstName && <span className="text-red-500 text-xs pl-2">{formErrors.firstName}</span>}
                                    </div>
                                    
                                    {/* ===== LAST NAME INPUT (Wrapped) ===== */}
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="text"
                                            name="lastName"
                                            placeholder="Last Name"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className={`px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'}`} // Conditional border
                                            disabled={isProcessing}
                                            required
                                        />
                                        {/* ✅ Error Display for Last Name */}
                                        {formErrors.lastName && <span className="text-red-500 text-xs pl-2">{formErrors.lastName}</span>}
                                    </div>
                                </div>

                                {/* GST Number */}
                                <input
                                    type="text"
                                    name="gstNumber"
                                    placeholder="GST Number (Optional)"
                                    value={formData.gstNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    disabled={isProcessing}
                                />

                                {/* Billing Address Field */}
                                <div className="flex flex-col gap-1">
                                    <textarea
                                        name="address"
                                        placeholder="Billing Address (Required for Invoice)*"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className={`w-full px-4 py-2.5 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none ${
                                            formErrors.address ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        disabled={isProcessing}
                                    />
                                    {formErrors.address && <span className="text-red-500 text-xs pl-2">{formErrors.address}</span>}
                                </div>

                                {/* Special Requests */}
                                <textarea
                                    name="specialRequests"
                                    placeholder="Special Requests (Optional)"
                                    value={formData.specialRequests}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                                    disabled={isProcessing}
                                />

                                {/* Privacy Policy Checkbox */}
                                <div className="flex items-start gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        name="agreePolicy"
                                        checked={formData.agreePolicy}
                                        onChange={handleInputChange}
                                        className="mt-1 w-4 h-4 accent-yellow-600"
                                        disabled={isProcessing}
                                    />
                                    <label className="text-sm text-gray-709">
                                        I agree to the <a href="#" className="text-blue-600 hover:underline">privacy policy</a>
                                    </label>
                                </div>
                                
                                {/* Payment Message/Error Display */}
                                {paymentMessage && (
                                    <div className={`p-3 rounded-lg text-sm font-medium ${paymentMessage.includes('Success') || paymentMessage.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {paymentMessage}
                                    </div>
                                )}


                                {/* Submit Button */}
                                <button 
                                    type="submit"
                                    className={`w-full bg-yellow-600 text-white font-semibold py-3.5 rounded-lg mt-4 transition-colors flex items-center justify-center gap-2 
                                        ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-yellow-700'}`}
                                    disabled={isProcessing || !formData.agreePolicy}
                                >
                                    {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                                    {isProcessing ? 'Processing Payment...' : 'Confirm & Pay'}
                                </button>


                                {/* Trust Badges */}
                                <div className="grid grid-cols-3 gap-4 pt-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Award size={20} />
                                        <span>Best Price guaranteed</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield size={20} />
                                        <span>100% secure payment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={20} />
                                        <span>Instant Confirmation</span>
                                    </div>
                                </div>

                                {/* Payment Methods */}
                                <div className="flex justify-center gap-3 pt-6">
                                    <div className="bg-blue-600 text-white px-4 py-2 rounded font-medium text-sm">VISA</div>
                                    <div className="bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">AMEX</div>
                                    <div className="bg-red-600 text-white px-4 py-2 rounded font-medium text-sm">MC</div>
                                    <div className="bg-orange-500 text-white px-4 py-2 rounded font-medium text-sm">DISC</div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Section - Booking Summary (Unchanged logic) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">Booking Details</h2>
                                <span className="text-sm text-green-600 font-medium">You Saved INR 1,225</span>
                            </div>

                            <div className="space-y-4">
                                {/* Room Details - Dynamic Data */}
                                <div className="pb-4 border-b border-gray-200">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <div className="font-medium">**{roomName}**</div>
                                            <div className="text-sm text-gray-600">Room Only -</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* <button className="text-gray-400 hover:text-gray-600">
                                                <Edit2 size={14} />
                                            </button> */}
                                            <span className="font-medium">INR {retailPrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stay Information - Dynamic Data */}
                                <div className="pb-4 border-b border-gray-200">
                                    <div className="font-medium mb-3">Stay Information</div>
                                    <div className="flex justify-between items-center text-sm mb-2">
                                        <span className="text-gray-600">**{formatDate(checkInStr)} - {formatDate(checkOutStr)}**</span>
                                        {/* <button className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
                                            Modify <Edit2 size={12} />
                                        </button> */}
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">2 Adults, 0 Children, 1 Rooms</span>
                                        {/* <button className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
                                            Modify <Edit2 size={12} />
                                        </button> */}
                                    </div>
                                </div>

                                {/* Price Breakdown - Dynamic Data */}
                                <div className="space-y-2 pb-4 border-b border-gray-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Price -</span>
                                        <span className="font-medium">INR {retailPrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Taxes & Fees -</span>
                                        <span className="font-medium">INR {(finalTotal - retailPrice).toFixed(0)}</span>
                                    </div>
                                </div>

                                {/* Total - Dynamic Data */}
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-lg font-semibold">Total</span>
                                    <span className="text-xl font-bold text-green-600">INR {finalTotal.toLocaleString()}</span>
                                </div>

                                {/* Cancellation Policy */}
                                <div className="pt-4">
                                    <div className="font-medium text-sm mb-1">Cancellation Policy</div>
                                    <div className="text-xs text-gray-600">
                                        You will be charged the 1st night.{' '}
                                        <a href="#" className="text-blue-600 hover:underline">More info</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;