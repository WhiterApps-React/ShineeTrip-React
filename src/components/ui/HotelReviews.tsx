import React, { useState, useEffect, useCallback } from 'react';
import { Star, Sparkles, CheckCircle, Key, MessageSquare, Loader2, X } from 'lucide-react';

// ==========================================
// 1. SINGLE REVIEW CARD COMPONENT
// Handles "Show More/Less" & User Image logic
// ==========================================
const SingleReviewCard = ({ review }: { review: Review }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Text Logic
    const rawContent = review.comment || review.summary || 'No comment provided.';
    const isLongText = rawContent.length > 150;
    const contentToDisplay = isExpanded ? rawContent : (isLongText ? `${rawContent.slice(0, 150)}...` : rawContent);

    // Simple Date Logic (No external library needed)
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Recently';
        try {
            return new Date(dateString).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        } catch (e) {
            return 'Recently';
        }
    };

    // Stars Logic
    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating || 0);
        return Array.from({ length: 5 }).map((_, i) => (
            <Star 
                key={i} 
                className={`w-4 h-4 ${i < fullStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
            />
        ));
    };

return (
  <div className="bg-white border border-gray-200 rounded-2xl p-6">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
          <img
            src={review.reviewerAvatar || "https://i.pravatar.cc/150?img=12"}
            alt={review.reviewerName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://i.pravatar.cc/150?img=12";
            }}
          />
        </div>

        <div>
          <div className="text-sm font-semibold text-gray-900">
            {review.reviewerName || "Guest User"}
          </div>
          <div className="text-xs text-gray-400">
            {formatDate(review.postedOn)}
          </div>
        </div>
      </div>

      {/* Stars */}
      <div className="flex gap-1">
        {renderStars(review.overallRating)}
      </div>
    </div>

    {/* Review Text */}
    <p className="text-sm text-gray-600 leading-relaxed mb-4">
      {contentToDisplay}
    </p>

    {/* Show more */}
    {isLongText && (
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }}
        className="text-sm font-medium text-black underline"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    )}
  </div>
);

};


// ==========================================
// 2. REVIEW FORM MODAL
// Handles Submission
// ==========================================
interface ReviewFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    hotelId: string;
    onReviewPosted: () => void;
}

const ReviewFormModal: React.FC<ReviewFormModalProps> = ({ isOpen, onClose, hotelId, onReviewPosted }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [ratings, setRatings] = useState({ overall: 0, cleanliness: 0, staff: 0, services: 0, food: 0 });
    const [text, setText] = useState({ summary: '', comment: '' });
    
    const token = sessionStorage.getItem('shineetrip_token');

    useEffect(() => {
        if (isOpen) {
            setRatings({ overall: 0, cleanliness: 0, staff: 0, services: 0, food: 0 });
            setText({ summary: '', comment: '' });
            setFormError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { overall, cleanliness, staff, services, food } = ratings;
        
        if (!token || !hotelId || overall === 0 || cleanliness === 0 || staff === 0 || services === 0 || food === 0) {
            setFormError("Please rate all categories.");
            return;
        }

        setSubmitting(true);
        
        let customerIdToSend: number | null = null;
        try {
            const userStr = sessionStorage.getItem('shineetrip_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                customerIdToSend = user.id || user.customerId;
            }
            if (!customerIdToSend) {
                const dbId = sessionStorage.getItem('shineetrip_db_customer_id');
                if (dbId) customerIdToSend = parseInt(dbId, 10);
            }
        } catch (e) { console.error("User parse error"); }

        if (!customerIdToSend) {
            setFormError("Please log in again.");
            setSubmitting(false);
            return;
        }

        const formData = new FormData();
        formData.append('propertyId', hotelId);
        formData.append('customerId', String(customerIdToSend));
        formData.append('overallRating', String(overall));
        formData.append('cleanliness', String(cleanliness));
        formData.append('staff', String(staff));
        formData.append('services', String(services));
        formData.append('food', String(food));
        if (text.summary) formData.append('summary', text.summary);
        if (text.comment) formData.append('comment', text.comment);

        try {
            const res = await fetch('http://46.62.160.188:3000/ratings', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error("Failed to post");
            onReviewPosted();
            onClose();
        } catch (err) {
            setFormError("Failed to submit review.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const StarInput = ({ label, field }: { label: string, field: keyof typeof ratings }) => (
        <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} 
                        className={`w-6 h-6 cursor-pointer ${s <= ratings[field] ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        onClick={() => setRatings(prev => ({ ...prev, [field]: s }))} 
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Write a Review</h2>
                    <button onClick={onClose}><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                        <StarInput label="Overall" field="overall" />
                        <StarInput label="Cleanliness" field="cleanliness" />
                        <StarInput label="Staff" field="staff" />
                        <StarInput label="Services" field="services" />
                        <StarInput label="Food" field="food" />
                    </div>
                    <input className="w-full p-2 border rounded" placeholder="Title" value={text.summary} onChange={e => setText(p => ({...p, summary: e.target.value}))} />
                    <textarea className="w-full p-2 border rounded" rows={3} placeholder="Details..." value={text.comment} onChange={e => setText(p => ({...p, comment: e.target.value}))} />
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <button disabled={submitting} type="submit" className="w-full bg-[#D2A256] text-white p-3 rounded font-bold">
                        {submitting ? 'Posting...' : 'Post Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};


// ==========================================
// 3. TYPES & MAIN COMPONENT
// ==========================================
interface Review {
    id: number;
    reviewerName: string;
    reviewerAvatar: string;
    overallRating: number;
    comment: string;
    postedOn: string;
    cleanliness: number;
    staff: number;
    services: number;
    food: number;
    summary: string;
    hotelId?: number | string;
    tags?: string[];
}

const HotelReviews = ({ hotelId }: { hotelId: string | number }) => {
    const [stats, setStats] = useState<any>(null);
    const [allReviews, setAllReviews] = useState<Review[]>([]);
    const [visibleReviews, setVisibleReviews] = useState<Review[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const token = sessionStorage.getItem('shineetrip_token');

    // --- FETCH LOGIC (NO FILTERING, DIRECT MAPPING) ---
    const fetchReviews = useCallback(async () => {
        if (!hotelId || !token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        
        try {
            // Using Specific Property Endpoint (Swagger confirmed this works)
            const res = await fetch(`http://46.62.160.188:3000/ratings/property/${hotelId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log("🔍 API Data Loaded:", data); // Debug log

                // Mapping Data DIRECTLY (No Filtering)
                // Hum maan ke chal rahe hain API sahi data bhej raha hai
                const mapped: Review[] = data.map((item: any) => ({
                    id: item.id,
                    // Handle Customer Name safely
                    reviewerName: `${item.customer?.first_name || 'Guest'} ${item.customer?.last_name || ''}`.trim(),
                    // Generate Avatar
                    reviewerAvatar: `https://i.pravatar.cc/150?u=${item.customer?.email || item.id}`,
                    // Ratings
                    overallRating: Number(item.overallRating) || 0,
                    cleanliness: Number(item.cleanliness) || 0,
                    staff: Number(item.staff) || 0,
                    services: Number(item.services) || 0,
                    food: Number(item.food) || 0,
                    // Content
                    comment: item.comment || '',
                    summary: item.summary || '',
                    postedOn: item.createdAt,
                    hotelId: hotelId
                }));

                // Stats Calculation
                if (mapped.length > 0) {
                    const sum = mapped.reduce((acc, r) => ({
                        overall: acc.overall + r.overallRating,
                        cleanliness: acc.cleanliness + r.cleanliness,
                        staff: acc.staff + r.staff,
                        services: acc.services + r.services,
                        food: acc.food + r.food,
                    }), { overall: 0, cleanliness: 0, staff: 0, services: 0, food: 0 });

                    const total = mapped.length;
                    const breakdown: any = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    mapped.forEach(r => {
                        const star = Math.round(r.overallRating);
                        if (breakdown[star] !== undefined) breakdown[star]++;
                    });

                    setStats({
                        total,
                        avg: (sum.overall / total).toFixed(1),
                        cleanliness: (sum.cleanliness / total).toFixed(1),
                        staff: (sum.staff / total).toFixed(1),
                        services: (sum.services / total).toFixed(1),
                        breakdown
                    });
                } else {
                    setStats(null);
                }

                setAllReviews(mapped);
                setVisibleReviews(mapped.slice(0, 4)); 

            } else {
                console.warn("API Error, status:", res.status);
                setAllReviews([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, [hotelId, token]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Handle "Show All" toggle
    useEffect(() => {
        if (showAll) {
            setVisibleReviews(allReviews);
        } else {
            setVisibleReviews(allReviews.slice(0, 4));
        }
    }, [showAll, allReviews]);


    // --- RENDERING ---
    if (!token) return <div className="p-8 text-center bg-white rounded-lg">Please login to view reviews.</div>;
    if (loading) return <div className="p-8 text-center bg-white rounded-lg"><Loader2 className="mx-auto animate-spin" /></div>;

    const dummyTags = ['Clean', 'Great Hospitality', 'Fast Response', 'Value for Money'];

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
                {/* Header Section */}
                <div className="flex items-start justify-between">
  <div className="flex gap-6">
    <div className="text-[64px] font-bold leading-none text-black">
      {stats?.avg || "0.0"}
    </div>

    <div className="pt-2">
<h3
  className="
    font-['Open_Sans']
    font-semibold
    text-[32px]
    leading-[24px]
    tracking-[0]
    text-black
    flex
    items-center
  "
>
  Guest Favorite
</h3>

<p
  className="
    font-['Open_Sans']
    font-normal
    text-[14px]
    leading-[20px]
    tracking-[0]
    text-gray-500
    mt-2
  "
>
  This hotel is the guests top favorite based on their rating & reviews.
</p>

    </div>
  </div>

 <button
  onClick={() => setIsModalOpen(true)}
  className="
    bg-black
    text-white
    font-['Inter']
    text-[18px]
    leading-[18px]
    tracking-[0]
    px-8
    py-4
    rounded-lg
    flex
    items-center
    justify-center
  "
>
  Write a Review
</button>

</div>


                {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 border-t border-b border-[#E5E7EB] py-8 mt-8 bg-white">


                    {/* Progress Bars */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold mb-4">Overall Rating</h4>

  {[5,4,3,2,1].map(rating => (
    <div key={rating} className="flex items-center gap-3 mb-2">
      <span className="text-xs w-3">{rating}</span>
      <div className="flex-1 h-[6px] bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full"
          style={{
            width: stats?.total
              ? `${(stats.breakdown[rating] / stats.total) * 100}%`
              : "0%"
          }}
        />
      </div>
    </div>
  ))}
                    </div>

                    {/* Feature Scores */}
                    {[
  { label: "Cleanliness", value: stats?.cleanliness, Icon: Sparkles },
  { label: "Staff", value: stats?.staff, Icon: CheckCircle },
  { label: "Services", value: stats?.services, Icon: Key },
  { label: "Food", value: stats?.services, Icon: MessageSquare },
].map(item => (
  <div key={item.label} className="text-center">
    <h4 className="text-sm font-medium mb-2">{item.label}</h4>
    <div className="text-2xl font-semibold">{item.value || "5.0"}</div>
    <item.Icon className="mx-auto mt-3 w-6 h-6 text-black" />
  </div>
))}

                </div>

                {/* Tags */}
                {/* <div className="flex flex-wrap gap-4 mb-8">
                    {dummyTags.map((tag, idx) => (
                        <div key={idx} className="bg-gray-100 px-6 py-3 rounded-full text-gray-700 font-medium text-sm">
                            {tag}
                        </div>
                    ))}
                </div> */}

                {/* Review Cards */}
                <div className="grid grid-cols-1 mt-4 md:grid-cols-2 gap-6">
                    {visibleReviews.length > 0 ? (
                        visibleReviews.map((review) => (
                            <SingleReviewCard key={review.id} review={review} />
                        ))
                    ) : (
                        <div className="md:col-span-2 text-center text-gray-500 p-4">
                            Be the first to leave a review for this hotel!
                        </div>
                    )}
                </div>

                {/* Show All / Less Button */}
                {allReviews.length > 4 && (
                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => setShowAll(!showAll)}
                            className="bg-white border border-gray-200 px-8 py-3 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                            {showAll ? 'Show top reviews' : `Show all ${allReviews.length} reviews`}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ReviewFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                hotelId={String(hotelId)} 
                onReviewPosted={fetchReviews} 
            />
        </>
    );
};

export default HotelReviews;