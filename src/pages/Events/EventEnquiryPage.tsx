import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Calendar, Check, ChevronRight, ClipboardList } from "lucide-react";
import { toast } from "sonner"; 

const API_BASE_URL = "http://46.62.160.188:3000";

const EventEnquiryPage = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form State matching Swagger Schema
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_code: "+91",
    phone_num: "",
    city: "",
    event_date: "",
    guest_num: "",
    num_days: "1 Day",
    budget_range: "Mid-Range", // Default
    desc: ""
  });

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = sessionStorage.getItem("shineetrip_token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;


      const fullPhoneNumber = `${formData.phone_code} ${formData.phone_num}`;

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_num: fullPhoneNumber,
        city: formData.city,
        event_date: new Date(formData.event_date).toISOString(), // Format date to ISO
        guest_num: Number(formData.guest_num),
        num_days: parseInt(formData.num_days), // Extract number from string logic below
        budget_range: formData.budget_range,
        desc: formData.desc,
        venue_id: Number(venueId) // Get from URL
      };
        
      const response = await fetch(`${API_BASE_URL}/event-enquiry`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      const data = await response.json();
      console.log("Success:", data);
      
      // Success Action
      navigate(`/event-confirmation/${data.id}`);

    } catch (error) {
      console.error("Error submitting enquiry:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEAEA] font-opensans py-10 px-4 pt-24">
      
      {/* --- STEPPER (Top Header) --- */}
      <div className="max-w-3xl mx-auto mt-10 mb-10">
        <div className="flex justify-center items-center gap-4 text-sm font-medium text-gray-500">
            
            {/* Step 1: Done */}
            <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-[#CA9C43] flex items-center justify-center text-white">
                    <Check size={16} />
                </div>
                <span className="text-[#CA9C43]">Event Type</span>
            </div>

            <ChevronRight size={20} className="text-[#CA9C43] mb-5" />

            {/* Step 2: Active */}
            <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-[#CA9C43] flex items-center justify-center text-white shadow-[0_0_0_4px_rgba(202,156,67,0.2)]">
                    2
                </div>
                <span className="text-gray-800 font-bold">Share Details</span>
            </div>

            <ChevronRight size={20} className="text-gray-400 mb-5" />

            {/* Step 3: Pending */}
            <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                    3
                </div>
                <span>Confirmation</span>
            </div>
        </div>

        <div className="text-center mt-8">
            <h1 className="text-3xl font-bold text-[#CA9C43] mb-2">Event Enquiry Form</h1>
            <p className="text-gray-500 text-sm">Fill in your details and our event specialists will contact you within 24 hours</p>
            <div className="h-[1px] w-3/4 bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mt-6"></div>
        </div>
      </div>

      {/* --- FORM CONTAINER --- */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SECTION 1: Personal Information */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <User className="text-[#CA9C43]" size={24} />
                    <h2 className="text-xl font-bold text-gray-800 border-b-2 border-transparent hover:border-[#CA9C43] transition-all inline-block">
                        Personal Information
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600 ml-1">First name</label>
                        <input 
                            type="text" 
                            name="first_name"
                            required
                            placeholder="First name"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm"
                            onChange={handleChange}
                        />
                    </div>
                    {/* Last Name */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600 ml-1">Last name</label>
                        <input 
                            type="text" 
                            name="last_name"
                            required
                            placeholder="Last name"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm"
                            onChange={handleChange}
                        />
                    </div>
                    {/* Email */}
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-bold text-gray-600 ml-1">Email</label>
                        <input 
                            type="email" 
                            name="email"
                            required
                            placeholder="you@gmail.com"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm"
                            onChange={handleChange}
                        />
                    </div>
                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600 ml-1">Phone number</label>
                        <div className="flex gap-2">
                             <select 
                                name="phone_code"
                                className="bg-white border border-gray-200 rounded-xl px-2 py-3 focus:outline-none shadow-sm min-w-[90px]"
                                onChange={handleChange}
                                value={formData.phone_code}
                             >
                                <option value="+91">IND +91</option>
                                <option value="+1">USA +1</option>
                                <option value="+44">UK +44</option>
                             </select>
                             <input 
                                type="tel" 
                                name="phone_num"
                                required
                                placeholder="98765 43210"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm"
                                onChange={handleChange}
                             />
                        </div>
                    </div>
                    {/* City */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600 ml-1">City</label>
                        <input 
                            type="text" 
                            name="city"
                            required
                            placeholder="Your city"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm"
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            {/* SECTION 2: Event Details */}
            <div>
                <div className="flex items-center gap-2 mb-4 mt-8">
                    <ClipboardList className="text-[#CA9C43]" size={24} />
                    <h2 className="text-xl font-bold text-gray-800">Event Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Date */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600 ml-1">Event Date</label>
                        <input 
                            type="date" 
                            name="event_date"
                            required
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm text-gray-600"
                            onChange={handleChange}
                        />
                    </div>
                    {/* Guest Number */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600 ml-1">Number of Guests</label>
                        <input 
                            type="number" 
                            name="guest_num"
                            required
                            placeholder="e.g. 150"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm"
                            onChange={handleChange}
                        />
                    </div>
                    {/* Number of Days */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600 ml-1">Number of Days</label>
                        <select 
                            name="num_days"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm text-gray-600 appearance-none cursor-pointer"
                            onChange={handleChange}
                        >
                            <option value="1">1 Day</option>
                            <option value="2">2 Days</option>
                            <option value="3">3 Days</option>
                            <option value="4">4 Days</option>
                            <option value="5">5+ Days</option>
                        </select>
                    </div>
                    {/* Budget Range */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-600 ml-1">Budget Range</label>
                        <select 
                            name="budget_range"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm text-gray-600 appearance-none cursor-pointer"
                            onChange={handleChange}
                        >
                            <option value="Economy">Economy</option>
                            <option value="Mid-Range">Mid-Range</option>
                            <option value="Premium">Premium</option>
                            <option value="Luxury">Luxury</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Special Requirements */}
            <div className="space-y-1">
                <label className="text-lg font-bold text-gray-800 ml-1">Special Requirements or Preferences</label>
                <textarea 
                    name="desc"
                    rows={4}
                    placeholder="Tell us about specific needs, themes, or questions you have..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CA9C43]/50 shadow-sm resize-none"
                    onChange={handleChange}
                ></textarea>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4">
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{
                        background: 'linear-gradient(90deg, #CA9C43 0%, #916E2B 100%)',
                    }}
                >
                    {loading ? "Submitting..." : "Submit Enquiry"}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">
                    By submitting this form, you agree to our Terms & Conditions and Privacy Policy
                </p>
            </div>

        </form>
      </div>

    </div>
  );
};

export default EventEnquiryPage;