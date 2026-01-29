import React, { useState, useEffect } from "react";
import { X, Minus, Plus, ChevronRight, Lock, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const API_BASE_URL = "http://46.62.160.188:3000";
const RAZORPAY_KEY = "rzp_test_Ri1Lg8tbqZnUaT";

interface EventBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  selectedTicket: {
    type: string;
    price: number;
    id?: number; // 👈 IMPORTANT
  } | null;
}

const EventBookingModal = ({
  isOpen,
  onClose,
  event,
  selectedTicket,
}: EventBookingModalProps) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [ticketType, setTicketType] = useState({ name: "Standard Ticket", price: 0 });
  const [bookingData, setBookingData] = useState<any>(null);

  const [attendee, setAttendee] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  /* ===================== EFFECTS ===================== */

  useEffect(() => {
    if (selectedTicket) {
      setTicketType({
        name: selectedTicket.type,
        price: selectedTicket.price,
      });
    }
  }, [selectedTicket]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!isOpen) return null;

  /* ===================== FIXED LOCK API ===================== */

  const handleLockTickets = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const token = sessionStorage.getItem("shineetrip_token");
      const customerIdStr = sessionStorage.getItem("shineetrip_db_customer_id");

      if (!token || !customerIdStr || !selectedTicket?.id) {
        console.log(selectedTicket?.id); 
        throw new Error("Missing booking details");
      }
      

      const payload = {
        event_id: Number(event.id),
        event_ticket_id: Number(selectedTicket.id), // ✅ REQUIRED
        customer_id: Number(customerIdStr),
        ticket_qty: Number(quantity),
      };
      console.log(payload); 

      const res = await fetch(`${API_BASE_URL}/bookings/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to lock tickets");
      }

      setBookingData(data);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not lock tickets");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== PAYMENT ===================== */

  const handlePayment = async () => {
    if (!bookingData?.id) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const token = sessionStorage.getItem("shineetrip_token");

      const initRes = await fetch(
        `${API_BASE_URL}/bookings/${bookingData.id}/payment/initiate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentMethod: "online" }),
        }
      );

      const orderData = await initRes.json();
      if (!initRes.ok) throw new Error(orderData.message);

      const options = {
        key: RAZORPAY_KEY,
        amount: Number(bookingData.total_amount) * 100,
        currency: "INR",
        name: "Shinee Trip Events",
        description: `Booking for ${event.title}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response: any) => {
          await verifyPayment(response);
        },
        prefill: {
          name: attendee.fullName,
          email: attendee.email,
          contact: attendee.phone,
        },
        theme: { color: "#AB7E29" },
        modal: { ondismiss: () => setLoading(false) },
      };

      new window.Razorpay(options).open();
    } catch (err: any) {
      setErrorMsg(err.message || "Payment failed");
      setLoading(false);
    }
  };

  const verifyPayment = async (rzpRes: any) => {
    const token = sessionStorage.getItem("shineetrip_token");

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/payment/success`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpayOrderId: rzpRes.razorpay_order_id,
          razorpayPaymentId: rzpRes.razorpay_payment_id,
          razorpaySignature: rzpRes.razorpay_signature,
        }),
      });

      if (!res.ok) throw new Error();

      onClose();
      navigate("/mybooking");
    } catch {
      setErrorMsg("Payment successful but verification failed");
    } finally {
      setLoading(false);
    }
  };

  // --- UI STEPS ---

  // Step 1: Select Tickets
  const renderStep1 = () => (
    <div className="animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">Select Tickets</h2>
        <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-red-500" /></button>
      </div>
      
      <div className="bg-white border border-l-4 border-l-green-600 border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg text-gray-800">{ticketType.name}</h3>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
             >
               <Minus size={16} />
             </button>
             <span className="text-xl font-bold w-6 text-center">{quantity}</span>
             <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
             >
               <Plus size={16} />
             </button>
          </div>
        </div>
        <p className="text-gray-600 font-bold">₹{ticketType.price.toFixed(2)}</p>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
           <span className="text-gray-500 font-bold">Total:</span>
           <span className="text-xl font-black text-green-700">₹{(quantity * ticketType.price).toLocaleString()}</span>
        </div>
        <button 
          onClick={() => setStep(2)}
          className="w-full bg-[#0056D2] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#0044A6] transition-colors"
        >
          Proceed <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  // Step 2: Attendee Details
  const renderStep2 = () => (
    <div className="animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <button onClick={() => setStep(1)}><ChevronRight className="rotate-180 text-gray-500" /></button>
        <h2 className="text-xl font-bold text-gray-800">Attendee Details</h2>
      </div>

      <div className="bg-gray-50 text-gray-600 text-xs font-bold p-3 rounded mb-6 flex justify-between">
         <span>{event.title}</span>
         <span>{new Date(event.date_time).toLocaleDateString()}</span>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
          <input 
            type="text" 
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#CA9C43] focus:ring-1 focus:ring-[#CA9C43]"
            placeholder="Enter full name"
            value={attendee.fullName}
            onChange={(e) => setAttendee({...attendee, fullName: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail</label>
          <input 
            type="email" 
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#CA9C43] focus:ring-1 focus:ring-[#CA9C43]"
            placeholder="Enter e-mail"
            value={attendee.email}
            onChange={(e) => setAttendee({...attendee, email: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
          <div className="flex gap-2">
            <div className="flex items-center justify-center border border-gray-300 rounded-lg px-3 bg-gray-50">
                🇮🇳
            </div>
            <input 
                type="tel" 
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#CA9C43] focus:ring-1 focus:ring-[#CA9C43]"
                placeholder="Enter phone number"
                value={attendee.phone}
                onChange={(e) => setAttendee({...attendee, phone: e.target.value})}
            />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center mb-4">
        By proceeding, I accept the Terms of Service.
      </p>

      <div className="border-t pt-4">
        <div className="flex justify-between mb-4 font-bold">
           <span>Qty: {quantity}</span>
           <span className="text-green-700">Total: ₹{quantity * ticketType.price}</span>
        </div>
        <button 
          onClick={handleLockTickets}
          disabled={loading || !attendee.fullName || !attendee.email}
          className="w-full bg-[#0056D2] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#0044A6] disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Continue to Checkout"} <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  // Step 3: Summary
  const renderStep3 = () => (
    <div className="animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <button onClick={() => setStep(2)}><ChevronRight className="rotate-180 text-gray-500" /></button>
        <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
      </div>

      {/* Ticket Stub Design */}
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6 overflow-hidden">
        {/* Cutout Circles */}
        <div className="absolute -left-3 top-1/2 w-6 h-6 bg-white border-r border-gray-200 rounded-full -translate-y-1/2 z-10"></div>
        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-white border-l border-gray-200 rounded-full -translate-y-1/2 z-10"></div>
        
        <h3 className="text-[#0056D2] font-bold text-lg mb-4 text-center pb-4 border-b border-dashed border-gray-200">
            {ticketType.name}
        </h3>
        
        <div className="flex justify-between items-center">
            <div>
                <p className="font-bold text-gray-800 text-sm">{attendee.fullName}</p>
                <p className="text-gray-500 text-xs">{attendee.email}</p>
            </div>
            <div className="bg-[#0056D2] text-white px-3 py-1 rounded font-bold text-sm">
                ₹{ticketType.price} x {bookingData.ticket_qty} 
            </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 text-gray-600 text-sm mb-6 border-b pb-4 px-2">
        <div className="flex justify-between">
            <span>Sub Total:</span>
            <span className="font-bold text-gray-800">₹{bookingData?.total_amount}</span>
        </div>
        <div className="flex justify-between">
            <span>Tax:</span>
            <span className="font-bold text-gray-800">₹0.00</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8 px-2">
        <span className="font-bold text-lg text-gray-900">Order Total:</span>
        <span className="text-2xl font-black text-green-700">₹{bookingData?.total_amount}</span>
      </div>

      <button 
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-[#008000] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition-all shadow-md active:scale-95"
      >
        {loading ? <Loader2 className="animate-spin" /> : (
            <> <Lock size={18} /> Pay Now </>
        )}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto relative">
        
        {errorMsg && (
            <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle size={16} /> {errorMsg}
                <button onClick={() => setErrorMsg("")} className="ml-auto"><X size={16} /></button>
            </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default EventBookingModal;