"use client";

import { Star } from 'lucide-react';

interface ReviewsProps {
  reviewCount: number;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

// Mock reviews - can be replaced with real data later
const mockReviews: Review[] = [
  {
    id: '1',
    author: 'Jennifer M.',
    rating: 5,
    date: 'November 2024',
    comment: 'Incredibly compassionate during one of the most difficult times of our lives. Helped us plan everything with care and respect.',
    verified: true
  },
  {
    id: '2',
    author: 'Robert T.',
    rating: 5,
    date: 'October 2024',
    comment: 'Professional, knowledgeable, and truly caring. Made the entire process much easier for our family.',
    verified: true
  },
  {
    id: '3',
    author: 'Maria L.',
    rating: 5,
    date: 'September 2024',
    comment: 'Expertise in estate planning was invaluable. I now have peace of mind knowing everything is in order.',
    verified: true
  }
];

export function Reviews({ reviewCount }: ReviewsProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-medium text-gray-900">Reviews & Testimonials</h3>
        <div className="text-sm text-gray-500">Based on {reviewCount} verified clients</div>
      </div>
      
      <div className="space-y-4">
        {mockReviews.map((review) => (
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
            <p className="text-gray-700">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
