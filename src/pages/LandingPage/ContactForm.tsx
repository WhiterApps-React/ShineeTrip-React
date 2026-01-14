"use client"

import type React from "react"
import { useState } from "react"
import { Phone, Mail, MapPin, Send } from "lucide-react"
import toast, { Toaster } from 'react-hot-toast'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    destination: "",
    message: "",
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Strict Validation Logic
  const validateForm = () => {
    let newErrors: { [key: string]: string } = {}
    
    // Only letters regex (No numbers or special chars)
    const nameRegex = /^[a-zA-Z\s]+$/

    // First Name Validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    } else if (!nameRegex.test(formData.firstName)) {
      newErrors.firstName = "Only alphabets are allowed"
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "Minimum 2 characters required"
    }

    // Last Name Validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    } else if (!nameRegex.test(formData.lastName)) {
      newErrors.lastName = "Only alphabets are allowed"
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email (e.g. name@work.com)"
    }

    // Phone Validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = "Enter a valid 10-digit phone number"
    }

    // Message Validation
    if (!formData.message.trim()) {
      newErrors.message = "Message cannot be empty"
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message is too short (min 10 chars)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Prevent numbers in Name fields during typing
    if (name === "firstName" || name === "lastName") {
      if (value !== "" && !/^[a-zA-Z\s]*$/.test(value)) {
        return // Block the change if it's not a letter
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please correct the highlighted errors", { position: 'top-center' })
      return
    }
    
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const formDataToSend = new FormData();
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      formDataToSend.append('name', fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('title', formData.destination || 'General Inquiry');
      formDataToSend.append('message', formData.message);
      formDataToSend.append('status', 'pending');
      
      const response = await fetch('http://46.62.160.188:3000/contact-us', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success("Enquiry sent! We will contact you within 2 hours.");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          destination: "",
          message: "",
        });
        setErrors({});
      } else {
        toast.error("Submission failed. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Toaster />
      <section className="py-24 bg-white font-opensans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Content remains same */}
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-[#C9B86A]"></div>
                <span className="text-[#C9A86A] text-sm tracking-widest uppercase">Get in Touch</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-2 text-[#2C3C3C]">Begin Your</h2>
              <p className="text-4xl md:text-5xl text-[#C9A86A] font-light italic">Himalayan Journey</p>
            </div>
            
            <p className="text-gray-600 text-[15px] leading-[36.91px] font-normal tracking-[0px] font-opensans mb-[15px]">
              Let our travel curators design your perfect escape. Whether it's a romantic getaway, family adventure, or spiritual journey, we craft experiences that resonate with your soul.
            </p>

            <div className="space-y-[30px]">
              <div className="bg-white p-4 rounded-sm border-l-4 border-[#C9A86A]">
                <div className="flex items-start gap-4">
                  <div className="bg-[#C9A86A] p-3 rounded-full">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1 uppercase tracking-wide">Call Us</p>
                    <p className="text-[#2C3C3C] text-xl font-semibold mb-1">+91 98765 43210</p>
                    <p className="text-gray-500 font-normal text-sm">Available 24/7</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-sm border-l-4 border-[#C9A86A]">
                <div className="flex items-start gap-4">
                  <div className="bg-[#C9A86A] p-3 rounded-full">
                    <Mail className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1 uppercase tracking-wide">Email Us</p>
                    <p className="text-[#2C3C3C] text-xl font-semibold mb-1">info@shineetrip.com</p>
                    <p className="text-gray-500 font-normal text-sm">Response within 2 hours</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-sm border-l-4 border-[#C9A86A]">
                <div className="flex items-start gap-4">
                  <div className="bg-[#C9A86A] p-3 rounded-full">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm mb-1 uppercase tracking-wide">Our Offices</p>
                    <p className="text-[#2C3C3C] text-xl font-semibold mb-1">Himachal | Mumbai</p>
                    <p className="text-gray-500 font-normal text-sm">Chandigarh | Kathmandu</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              className="w-full bg-black text-white py-4 mt-[30px] rounded-md font-semibold text-base hover:bg-black transition-colors"
              // onClick={() => window.open('https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review', '_blank')}
            >
              Write a Review
            </button>
          </div>

          {/* Right Column - Form with Error Messaging */}
          <div className="relative ">
            <div className="absolute -top-4  -right-1.5 w-20 h-20 border-t-4 border-r-4 border-[#C9A86A]"></div>
            <div className="absolute bottom-0 -left-2 w-20 h-20 border-b-4 border-l-4 border-[#C9A86A]"></div>
            
            <form onSubmit={handleSubmit} className="bg-white px-6  py-9 shadow-lg relative" noValidate>
              <div className="space-y-[30px] ">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2 uppercase tracking-wide">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="John"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-50 border ${errors.firstName ? 'border-red-500' : 'border-gray-200'} text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C9A86A] focus:bg-white transition`}
                    />
                    {errors.firstName && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2 uppercase tracking-wide">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Doe"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-50 border ${errors.lastName ? 'border-red-500' : 'border-gray-200'} text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C9A86A] focus:bg-white transition`}
                    />
                    {errors.lastName && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2 uppercase tracking-wide">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C9A86A] focus:bg-white transition`}
                  />
                  {errors.email && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2 uppercase tracking-wide">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C9A86A] focus:bg-white transition`}
                  />
                  {errors.phone && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2 uppercase tracking-wide">
                    Preferred Destination
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Shimla, Manali"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C9A86A] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2 uppercase tracking-wide">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Tell us about your dream journey..."
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.message ? 'border-red-500' : 'border-gray-200'} text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#C9A86A] focus:bg-white transition resize-none`}
                  />
                  {errors.message && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white py-3 text-base font-medium transition flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(90deg, #C9A86A 0%, #E8C78A 100%)' }}
                >
                  {isSubmitting ? 'Sending...' : 'Send Enquiry'}
                  <Send size={20} />
                </button>

                <p className="text-center text-gray-500 text-sm mt-4">
                  Our travel experts will respond within 2 hours
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}