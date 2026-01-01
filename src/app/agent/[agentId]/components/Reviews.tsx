"use client";

import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/reviews/agent/${agentId}`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
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
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium text-gray-900">Reviews & Testimonials</h3>
          <div className="text-sm text-gray-500">Loading reviews...</div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-medium text-gray-900">Reviews & Testimonials</h3>
          <div className="text-sm text-gray-500">No reviews yet</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-gray-900">Reviews & Testimonials</h3>
        <div className="text-sm text-gray-500">Based on {reviewCount} verified clients</div>
      </div>
      
      <div className="space-y-4">
        {reviews.map((review) => (
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
    </div>
  );
}
