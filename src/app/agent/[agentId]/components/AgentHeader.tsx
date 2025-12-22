"use client";

import { MapPin, Star, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AgentHeaderProps {
  name: string;
  credentials: string;
  specialty: string;
  location: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  verified: boolean;
}

export function AgentHeader({
  name,
  credentials,
  specialty,
  location,
  rating,
  reviewCount,
  imageUrl,
  verified
}: AgentHeaderProps) {
  const [activeTab, setActiveTab] = useState('about');
  
  const scrollToSection = (sectionId: string) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  // Update active tab based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'highlights', 'locations', 'reviews', 'faqs'];
      const scrollPosition = window.scrollY + 150;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveTab(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="mb-6">
      {/* Agent Info */}
      <div className="flex gap-6 pb-6">
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#1a4d2e] flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-white text-3xl font-semibold">
                {name[0]?.toUpperCase() || 'A'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-medium text-gray-900">{name}, {credentials}</h1>
            {verified && (
              <Shield className="w-5 h-5 text-[#1a4d2e]" />
            )}
          </div>
          <p className="text-gray-600 mb-2">{specialty}</p>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-gray-900">{rating}</span>
              <span className="text-sm text-gray-600">({reviewCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => scrollToSection('about')}
            className={`pb-4 font-medium transition-colors ${
              activeTab === 'about'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            About
          </button>
          <button
            onClick={() => scrollToSection('highlights')}
            className={`pb-4 font-medium transition-colors ${
              activeTab === 'highlights'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Highlights
          </button>
          <button
            onClick={() => scrollToSection('locations')}
            className={`pb-4 font-medium transition-colors ${
              activeTab === 'locations'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Locations
          </button>
          <button
            onClick={() => scrollToSection('reviews')}
            className={`pb-4 font-medium transition-colors ${
              activeTab === 'reviews'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => scrollToSection('faqs')}
            className={`pb-4 font-medium transition-colors ${
              activeTab === 'faqs'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            FAQs
          </button>
        </nav>
      </div>
    </div>
  );
}
