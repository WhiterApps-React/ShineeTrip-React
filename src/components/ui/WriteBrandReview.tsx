"use client";

import React, { useEffect, useState } from "react";
import { Star, Loader2, MapPin, Type, MessageSquare } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface CustomerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  address?: string;
}

// ✅ New Prop added to handle closing
interface WriteBrandReviewProps {
  onSuccess?: () => void; 
}

const WriteBrandReview: React.FC<WriteBrandReviewProps> = ({ onSuccess }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [review, setReview] = useState<string>("");
  const [cuName, setCuName] = useState<string>("");
  const [cuAddr, setCuAddr] = useState<string>("");
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const ERROR_TOAST_ID = "review-error";

  const token = sessionStorage.getItem("shineetrip_token");
  const cuImg = sessionStorage.getItem("shineetrip_profile_image");
  const customerDbId = sessionStorage.getItem("shineetrip_db_customer_id");

  const MAX_TITLE = 15;
  const MAX_LOCATION = 10;
  const MAX_REVIEW = 190;

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerDbId || !token) {
        toast.error("Please login again");
        return;
      }
      try {
        const response = await fetch(
          `http://46.62.160.188:3000/customers/${customerDbId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("Failed");
        const data: CustomerData = await response.json();
        setCuName(`${data.first_name} ${data.last_name}`);
        setCuAddr((data.address || "").substring(0, MAX_LOCATION));
      } catch (error) {
        toast.error("Unable to load profile details");
      }
    };
    fetchCustomerData();
  }, [customerDbId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || !review.trim()) {
      toast.error("Rating and review are required", { id: ERROR_TOAST_ID });
      return;
    }

    if (!token || !cuName) {
      toast.error("User information missing. Please login again.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("http://46.62.160.188:3000/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          title,
          review,
          cu_name: cuName,
          cu_addr: cuAddr,
          cu_img: cuImg,
        }),
      });

      if (!response.ok) throw new Error("Submission failed");

      // ✅ Success Message
      toast.success("Thank you! Your review is submitted");

      // Reset fields
      setRating(0);
      setTitle("");
      setReview("");

      // ✅ 1.5 Second ka wait taaki user Toast padh sake, fir close/reload
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(); // Modal band karega
        } else {
          window.location.reload(); // Agar prop nahi diya to reload karega
        }
      }, 1500);

    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_TITLE) setTitle(val);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_LOCATION) setCuAddr(val);
  };

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_REVIEW) setReview(val);
  };

  return (
    <>
      <Toaster />

      {/* ✅ Change: max-w-md (approx 450px) kar diya jo 'sm' se thoda bada hai */}
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        
        <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-800 font-opensans">Rate Your Experience</h2>
          <p className="text-sm text-gray-500 mt-1">We value your feedback</p>
        </div>

        {/* ✅ Change: Padding p-6 kar di taaki height thodi badh jaye */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32} // Stars thode bade kiye
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => setRating(star)}
                  className={`cursor-pointer transition-all duration-200 transform hover:scale-110 ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-yellow-400 drop-shadow-sm"
                      : "text-gray-200 fill-gray-100"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-[#C9A86A]">
              {rating > 0 ? ["Terrible", "Bad", "Okay", "Good", "Excellent"][rating - 1] : "Select a rating"}
            </span>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="relative group">
              <label className="text-xs font-semibold text-gray-600 mb-1 flex justify-between">
                <span>Review Title <span className="text-red-500">*</span></span>
                <span className={`text-[10px] ${title.length === MAX_TITLE ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                  {title.length}/{MAX_TITLE}
                </span>
              </label>
              <div className="relative">
                <Type className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="e.g. Awesome Trip"
                  value={title}
                  onChange={handleTitleChange}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#C9A86A] transition-all outline-none"
                />
              </div>
            </div>

            {/* Location */}
            <div className="relative group">
              <label className="text-xs font-semibold text-gray-600 mb-1 flex justify-between">
                <span>Location</span>
                <span className={`text-[10px] ${cuAddr.length === MAX_LOCATION ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                  {cuAddr.length}/{MAX_LOCATION}
                </span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="City"
                  value={cuAddr}
                  onChange={handleLocationChange}
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#C9A86A] transition-all outline-none"
                />
              </div>
            </div>

            {/* Review */}
            <div className="relative group">
              <label className="text-xs font-semibold text-gray-600 mb-1 flex justify-between">
                <span>Your Review <span className="text-red-500">*</span></span>
                <span className={`text-[10px] ${review.length === MAX_REVIEW ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                  {review.length}/{MAX_REVIEW}
                </span>
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <textarea
                  placeholder="Share your experience..."
                  value={review}
                  onChange={handleReviewChange}
                  rows={4} // Thoda height badhaya
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#C9A86A] transition-all outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#C9A86A] hover:bg-[#b0935b] text-white py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              "Submit Review"
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default WriteBrandReview;