"use client";

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface ReviewsProps {
  agentId: string;
  reviewCount: number;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string | null;
  verified: boolean;
}

export function Reviews({ agentId, reviewCount }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/reviews/agent/${agentId}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating || 0);
          setTotalReviews(data.totalReviews || 0);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    }

    if (agentId) {
      fetchReviews();
    }
  }, [agentId]);

  if (loading) {
    return (
      <div id="reviews" className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h3>Reviews & Testimonials</h3>
          <div className="text-sm text-gray-500">Loading reviews...</div>
        </div>
      </div>
    );
  }

  if (totalReviews === 0) {
    return (
      <div id="reviews" className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h3>Reviews & Testimonials</h3>
        </div>
        <p className="text-gray-600">This professional has no reviews.</p>
      </div>
    );
  }

  const reviewsToShow = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div id="reviews" className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3>Reviews & Testimonials</h3>
        <div className="text-sm text-gray-500">
          Based on {totalReviews} verified {totalReviews === 1 ? 'client' : 'clients'}
        </div>
      </div>
      
      {averageRating > 0 && (
        <div className="mb-6 flex items-center gap-2">
          <div className="flex items-center">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-lg font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-gray-600">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
        </div>
      )}
      
      <div className="space-y-4">
        {reviewsToShow.map((review) => (
          <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-900 font-medium">{review.author}</span>
                  {review.verified && (
                    <span 
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{ backgroundColor: '#e8f5e9', color: '#1a4d2e' }}
                    >
                      Verified Client
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
              </div>
            </div>
            {review.comment && (
              <p className="text-gray-700">{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <div className="mt-6">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[#1A1A1A] hover:text-[#1A1A1A]/90 font-medium text-sm transition-colors"
          >
            {showAll ? 'Show Less' : `See More Reviews (${reviews.length - 3} more)`}
          </button>
        </div>
      )}
    </div>
  );
}
