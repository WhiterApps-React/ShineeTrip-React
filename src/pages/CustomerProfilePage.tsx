import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  LogOut,
  Edit3,
  Briefcase,
  Calendar,
  Globe,
  X,
  Star,
  Cake,
  Home,
  Book,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ===================== TYPES ===================== */

interface CustomerData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  address?: string;
  profile_image?: string;
  work_title?: string;
  language?: string;
}

/* ===================== HELPERS ===================== */

const formatDisplayDate = (date?: string) => {
  if (!date) return 'N/A';
  const [y, m, d] = date.split('-');
  return d && m && y ? `${d}-${m}-${y}` : date;
};

const avatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${name.charAt(0)}&size=256&background=D2A256&color=fff`;

const Divider = () => (
  <div className="w-px bg-gray-300 mx-6 self-stretch" />
);

/* ===================== PAGE ===================== */

const CustomerProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const customerDbId = sessionStorage.getItem('shineetrip_db_customer_id');
  const token = sessionStorage.getItem('shineetrip_token');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  /* ===================== FETCH ===================== */

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const fetchProfile = useCallback(async () => {
    if (!customerDbId || !token) return;

    try {
      setLoading(true);
      const res = await fetch(
        `http://46.62.160.188:3000/customers/${customerDbId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      setCustomer({
        ...data,
        work_title: data.work_title || 'Travel Enthusiast',
        language: data.language || 'Hindi, English',
      });
      setFormState({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        dob: data.dob ? data.dob.split('T')[0] : '',
        address: data.address || '',
      });
    } finally {
      setLoading(false);
    }
  }, [customerDbId, token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const logout = () => {
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

  const generateLetterAvatar = (name: string) =>
    `https://ui-avatars.com/api/?name=${name.charAt(0).toUpperCase()}&size=256&background=0D8ABC&color=fff`;

  const finalImageUrl =
    imagePreview ||
    customer?.profile_image ||
    generateLetterAvatar(customer?.first_name || "U");

  const fetchProfileData = fetchProfile;

  const handleSaveProfile = async () => {
    if (!customerDbId || !token || !customer) return;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = `http://46.62.160.188:3000/customers/${customerDbId}`;

      // 🟢 Use FormData for Multer compatibility
      const formData = new FormData();

      // Append text fields
      if (formState.first_name) formData.append('first_name', formState.first_name);
      if (formState.last_name) formData.append('last_name', formState.last_name);
      // Removed email append as instructed
      if (formState.phone) formData.append('phone', formState.phone);
      if (formState.address) formData.append('address', formState.address);

      // Format DOB to ISO for backend validation
      if (formState.dob && formState.dob !== 'N/A') {
        formData.append('dob', new Date(formState.dob).toISOString());
      }

      // 🟢 Append the actual File object
      if (selectedImage) {
        formData.append('profile_image', selectedImage);
      }

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          // ⚠️ IMPORTANT: Do NOT set 'Content-Type' header manually when using FormData.
          // The browser will automatically set it to 'multipart/form-data' with the correct boundary.
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || "Failed to update profile.");
      }

      await fetchProfileData();
      setSelectedImage(null); // Clear the file state after success
      setImagePreview(null);
      setShowPhotoModal(false);
      setIsEditMode(false);
      alert("Profile updated successfully!");

    } catch (err) {
      console.error("Profile update error:", err);
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#D2A256]" />
      </div>
    );
  }

  if (!customer) return null;

  const fullName = `${customer.first_name} ${customer.last_name}`;

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ================= SIDEBAR ================= */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Profile</h3>

            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-black text-white">
              <User className="w-4 h-4" /> About me
            </button>

            <button
              onClick={() => navigate('/mybooking')}
              className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Calendar className="w-4 h-4" /> My bookings
            </button>
            <button
              onClick={logout}
              className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>


        </div>


        {/* ================= MAIN ================= */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* ===== MAIN HEADER ===== */}
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-extrabold text-gray-900">
              About me
            </h2>
            <button
              onClick={() => { setIsEditMode(true); setShowPhotoModal(true); }}
              className="bg-black text-white px-6 py-3 rounded-full flex items-center gap-2"
            >
              <Edit3 size={16} />
              Edit Profile
            </button>
          </div>
          {/* ================= ABOUT ME ================= */}
          <section className="bg-white border rounded-2xl p-8">
            <div className="flex items-center gap-8">

              <div className="relative w-32 aspect-square rounded-full overflow-hidden border-4 border-[#D2A256] flex-shrink-0">
                <img
                  src={customer.profile_image || avatar(customer.first_name)}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-extrabold text-gray-900">
                  {fullName}
                </h1>
                <p className="text-gray-500 mt-1">
                  {customer.address || 'India'}
                </p>

                <div className="mt-6 flex items-stretch text-sm text-gray-700">

                  {/* INFORMATION */}
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <div className="flex items-center gap-2 font-semibold">
                      <Briefcase className="w-4 h-4 text-[#D2A256]" />
                      <span>Information</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#D2A256]" />
                      <span>{customer.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#D2A256]" />
                      <span>{customer.phone || '—'}</span>
                    </div>
                  </div>

                  <Divider />

                  {/* DOB + ADDRESS */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <div className="flex items-center gap-2 font-semibold">
                      <Calendar className="w-4 h-4 text-[#D2A256]" />
                      <span>Birthdate</span>
                    </div>

                    <div className="flex items-center gap-2 ">
                      <Cake className="w-4 h-4 text-[#D2A256]" />
                      <span>{formatDisplayDate(customer.dob)}</span>
                    </div>

                    <div className="flex items-center gap-2 ">
                      <Home className="w-4 h-4 text-[#D2A256]" />
                      <span>{customer.address || 'India'}</span>
                    </div>


                  </div>

                  <Divider />

                  {/* LANGUAGES */}
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <div className="flex items-center gap-2 font-semibold">
                      <Globe className="w-4 h-4 text-[#D2A256]" />
                      <span>Languages</span>
                    </div>

                    <div className="flex items-center gap-2 ">
                      <Book className="w-4 h-4 text-[#D2A256]" />
                      <span>{customer.language}</span>
                    </div>

                  </div>
                </div>
              </div>


            </div>
          </section>

          {/* ================= REVIEWS ================= */}
          <section>
            <h2 className="text-2xl font-extrabold mb-6">Reviews</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={customer.profile_image || avatar(customer.first_name)}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        {customer.first_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Darjeeling, India
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-3">
                    July 2025
                  </p>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    It has been a pleasure hosting them. We hope they had a good stay.
                  </p>

                  <div className="flex gap-1 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-[#D2A256] text-[#D2A256]"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-8 bg-black text-white px-8 py-3 rounded-full font-semibold">
              Show all reviews
            </button>
          </section>

        </div>
      </div>

      {/* Edit Profile Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/40">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-gray-200">
            <h3 className="text-xl font-extrabold mb-6 text-gray-900">
              Edit Profile
            </h3>

            {/* Avatar Preview */}
            <div className="flex justify-center mb-6">
              <div className="w-36 aspect-square rounded-full overflow-hidden border-4 border-[#D2A256]">
                <img
                  src={imagePreview || finalImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Profile Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="w-full text-sm"
              />
            </div>

            {/* Form */}
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  First Name
                </label>
                <input
                  name="first_name"
                  value={formState.first_name || ''}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Last Name
                </label>
                <input
                  name="last_name"
                  value={formState.last_name || ''}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Email (read only)
                </label>
                <input
                  value={formState.email || ''}
                  disabled
                  className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Phone
                </label>
                <input
                  name="phone"
                  value={formState.phone || ''}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formState.dob || ''}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Address
                </label>
                <input
                  name="address"
                  value={formState.address || ''}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

            </form>

            {error && <p className="text-red-600 mt-4">{error}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoModal(false);
                  setSelectedImage(null);
                  setImagePreview(null);
                  setError(null);
                  setIsEditMode(false);
                }}
                className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-5 py-2.5 rounded-lg font-semibold text-white bg-[#D2A256] hover:bg-[#b3893a] transition shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfilePage;