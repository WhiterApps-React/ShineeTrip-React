"use client";

import React, {  useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
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

const WriteBrandReview: React.FC = () => {
  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [review, setReview] = useState<string>("");

   const [cuName, setCuName] = useState<string>("");
  const [cuAddr, setCuAddr] = useState<string>("");
  const ERROR_TOAST_ID = "review-error";

  
  

  const [submitting, setSubmitting] = useState<boolean>(false);

  const token = sessionStorage.getItem("shineetrip_token");
  const cuImg = sessionStorage.getItem("shineetrip_profile_image");
  const customerDbId = sessionStorage.getItem("shineetrip_db_customer_id");
 

  useEffect(() => {
  const fetchCustomerData = async () => {
    if (!customerDbId || !token) {
      toast.error("Please login again ");
      return;
    }

    try {
      const response = await fetch(
        `http://46.62.160.188:3000/customers/${customerDbId}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customer profile");
      }

      const data: CustomerData = await response.json();

      
      setCuName(`${data.first_name} ${data.last_name}`);
      setCuAddr(data.address || "");
      
    } catch (error) {
      toast.error("Unable to load profile details");
    }
  };

  fetchCustomerData();
}, [customerDbId, token]);


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log({rating,
          title,
          review,
          cu_name: cuName,
          cu_addr: cuAddr,
          cu_img: cuImg});

if (!rating || !review.trim()) {
  toast.error("Rating and review are required", {
    id: ERROR_TOAST_ID,
  });
  return;
}


  if (!token || !cuName) {
    toast.error("User information missing. Please login again.");
    return;
  }

  setSubmitting(true);
  

  try {
    const response = await fetch(
      "http://46.62.160.188:3000/testimonials",
      {
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
      }
    );

    if (!response.ok) {
      throw new Error("Submission failed");
    }

    toast.success(
      "Thank you! Your review is submitted"
    );

    setRating(0);
    setTitle("");
    setReview("");
  } catch (error) {
    toast.error("Something went wrong. Please try again.");
  } finally {
    setSubmitting(false);
  }
};



  return (
    <>
      <Toaster />

      <div className="w-full p-8 space-y-8">
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Submit Your Review
          </h2>
          <p className="text-gray-600 mt-1">
            Your feedback helps us improve our services
          </p>
        </div>

       
        <form onSubmit={handleSubmit} className="space-y-6">

          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer ${
                    star <= rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Review Title (Summary)<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Review title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border bg-gray-50 focus:ring-2 focus:ring-[#C9A86A]"
            />
          </div>

          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Write your review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border bg-gray-50 resize-none focus:ring-2 focus:ring-[#C9A86A]"
            />
          </div>

          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Your Location
            </label>
            <input
              type="text"
              placeholder="Your city, country"
              value={cuAddr}
              onChange={(e) => setCuAddr(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border bg-gray-50 focus:ring-2 focus:ring-[#C9A86A]"
            />
          </div>


          
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
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
