"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, User, Lock, Mail, Phone, MapPin, ChevronRight, ChevronLeft, Plus, X, Check } from 'lucide-react';

type Step = 1 | 2 | 3;

interface OfficeLocation {
  name: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
}

export default function CreateAccountPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [acknowledgmentChecked, setAcknowledgmentChecked] = useState(false);

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    street: '',
    city: '',
    province: 'BC',
    postalCode: '',
  });

  // Step 2: Business Info & Office Locations
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    professionalTitle: '',
    trustageEnrollerNumber: 'no' as 'yes' | 'no',
    llqpLicense: 'no' as 'yes' | 'no',
    llqpQuebec: 'non-applicable' as 'yes' | 'no' | 'non-applicable',
  });
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<OfficeLocation>({
    name: '',
    street_address: '',
    city: '',
    province: 'BC',
    postal_code: '',
  });

  // Step 3: Profile Bio
  const [bioData, setBioData] = useState({
    years_of_experience: '',
    practice_philosophy_help: '',
    practice_philosophy_appreciate: '',
  });

  const provinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

  // Phone number formatting function
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validation
  const validateStep1 = (): boolean => {
    if (!basicInfo.fullName || !basicInfo.email || !basicInfo.phone || !basicInfo.password || !basicInfo.confirmPassword ||
        !basicInfo.street || !basicInfo.city || !basicInfo.province || !basicInfo.postalCode) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (!isValidEmail(basicInfo.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (basicInfo.password !== basicInfo.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (basicInfo.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!businessInfo.businessName || !businessInfo.professionalTitle) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (officeLocations.length === 0) {
      setError('Please add at least one office location.');
      return false;
    }
    return true;
  };


  const validateStep3 = (): boolean => {
    if (!bioData.years_of_experience ||
        !bioData.practice_philosophy_help || !bioData.practice_philosophy_appreciate) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (!acknowledgmentChecked) {
      setError('Please acknowledge that you have answered all questions to the best of your knowledge.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const addOfficeLocation = () => {
    if (!newLocation.name || !newLocation.city || !newLocation.province) {
      setError('Please fill in at least name, city, and province for the office location.');
      return;
    }
    setOfficeLocations([...officeLocations, { ...newLocation }]);
    setNewLocation({
      name: '',
      street_address: '',
      city: '',
      province: 'BC',
      postal_code: '',
    });
    setShowAddLocation(false);
    setError(null);
  };

  const removeOfficeLocation = (index: number) => {
    setOfficeLocations(officeLocations.filter((_, i) => i !== index));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep3()) {
      return;
    }

    setSubmitting(true);

    try {
      // Prepare the complete signup data
      const signupData = {
        // Basic Info
        email: basicInfo.email,
        password: basicInfo.password,
        full_name: basicInfo.fullName,
        phone: basicInfo.phone,
        address: {
          street: basicInfo.street,
          city: basicInfo.city,
          province: basicInfo.province,
          postalCode: basicInfo.postalCode,
        },
        notification_cities: [{ city: basicInfo.city, province: basicInfo.province }],
        
        // Business Info
        funeral_home: businessInfo.businessName,
        job_title: businessInfo.professionalTitle,
        
        // Metadata fields
        metadata: {
          trustage_enroller_number: businessInfo.trustageEnrollerNumber === 'yes',
          llqp_license: businessInfo.llqpLicense === 'yes',
          llqp_quebec: businessInfo.llqpQuebec,
          bio: bioData,
        },
        
        // Office locations (will be handled separately via API)
        office_locations: officeLocations,
      };

      const response = await fetch('/api/agent/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.error || 'Failed to create account. Please try again.';
        if (data.details && process.env.NODE_ENV === 'development') {
          errorMessage += ` (${data.details})`;
        }
        setError(errorMessage);
        setSubmitting(false);
        return;
      }

      // Success - show modal
      setShowSuccessModal(true);
      setSubmitting(false);
    } catch (err) {
      console.error('Error creating account:', err);
      setError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-auto p-8 md:p-12">
        {/* Logo */}
        <div className="flex justify-start mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Soradin.png"
              alt="Soradin Logo"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </Link>
        </div>

        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-4 text-black">Create Account</h1>
        <p className="text-center text-gray-600 mb-8">Please complete all steps to submit your account for approval</p>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-green-700' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-green-700 text-white' : 'bg-gray-200'}`}>
                {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-green-700' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-green-700' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-green-700 text-white' : 'bg-gray-200'}`}>
                {currentStep > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium">Business Info</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-green-700' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-green-700' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-700 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium">Profile Bio</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form Steps */}
        <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4 text-black">Step 1: Basic Information</h2>
              
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={basicInfo.fullName}
                  onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
                  placeholder="Full Name *"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={basicInfo.email}
                  onChange={(e) => {
                    const emailValue = e.target.value;
                    setBasicInfo({ ...basicInfo, email: emailValue });
                    // Clear error if email becomes valid
                    if (error && emailValue && isValidEmail(emailValue)) {
                      setError(null);
                    }
                  }}
                  onBlur={(e) => {
                    // Validate email on blur
                    if (e.target.value && !isValidEmail(e.target.value)) {
                      setError('Please enter a valid email address.');
                    }
                  }}
                  placeholder="Email *"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:border-green-700 outline-none transition-colors ${
                    basicInfo.email && !isValidEmail(basicInfo.email) 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  }`}
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={basicInfo.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setBasicInfo({ ...basicInfo, phone: formatted });
                  }}
                  placeholder="Phone *"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
                  maxLength={14} // (XXX) XXX-XXXX = 14 characters
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={basicInfo.password}
                    onChange={(e) => setBasicInfo({ ...basicInfo, password: e.target.value })}
                    placeholder="Password *"
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
                />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={basicInfo.confirmPassword}
                    onChange={(e) => setBasicInfo({ ...basicInfo, confirmPassword: e.target.value })}
                    placeholder="Confirm Password *"
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={basicInfo.street}
                  onChange={(e) => setBasicInfo({ ...basicInfo, street: e.target.value })}
                  placeholder="Home Address *"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                  value={basicInfo.city}
                  onChange={(e) => setBasicInfo({ ...basicInfo, city: e.target.value })}
                    placeholder="City *"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                    required
                  />
                  <select
                  value={basicInfo.province}
                  onChange={(e) => setBasicInfo({ ...basicInfo, province: e.target.value })}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                    required
                  >
                    {provinces.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                <input
                  type="text"
                  value={basicInfo.postalCode}
                  onChange={(e) => setBasicInfo({ ...basicInfo, postalCode: e.target.value })}
                  placeholder="Postal Code *"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Info & Office Locations */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4 text-black">Step 2: Business Information & Office Locations</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business / Firm Name *</label>
                <input
                  type="text"
                  value={businessInfo.businessName}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                  placeholder="e.g., Smith Funeral Home"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
            />
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title *</label>
                <input
                  type="text"
                  value={businessInfo.professionalTitle}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, professionalTitle: e.target.value })}
                  placeholder="e.g., Funeral Director, Pre-need Specialist"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
            />
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Do you have a valid TruStage Life Of Canada enroller number? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trustageEnroller"
                      value="yes"
                      checked={businessInfo.trustageEnrollerNumber === 'yes'}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, trustageEnrollerNumber: e.target.value as 'yes' | 'no' })}
                      className="w-4 h-4 text-green-800 border-gray-300 focus:ring-green-800"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trustageEnroller"
                      value="no"
                      checked={businessInfo.trustageEnrollerNumber === 'no'}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, trustageEnrollerNumber: e.target.value as 'yes' | 'no' })}
                      className="w-4 h-4 text-green-800 border-gray-300 focus:ring-green-800"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Do you have a valid LLQP license? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="llqpLicense"
                      value="yes"
                      checked={businessInfo.llqpLicense === 'yes'}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, llqpLicense: e.target.value as 'yes' | 'no' })}
                      className="w-4 h-4 text-green-800 border-gray-300 focus:ring-green-800"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="llqpLicense"
                      value="no"
                      checked={businessInfo.llqpLicense === 'no'}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, llqpLicense: e.target.value as 'yes' | 'no' })}
                      className="w-4 h-4 text-green-800 border-gray-300 focus:ring-green-800"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Is your LLQP valid in Quebec? *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="llqpQuebec"
                      value="yes"
                      checked={businessInfo.llqpQuebec === 'yes'}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, llqpQuebec: e.target.value as 'yes' | 'no' | 'non-applicable' })}
                      className="w-4 h-4 text-green-800 border-gray-300 focus:ring-green-800"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="llqpQuebec"
                      value="no"
                      checked={businessInfo.llqpQuebec === 'no'}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, llqpQuebec: e.target.value as 'yes' | 'no' | 'non-applicable' })}
                      className="w-4 h-4 text-green-800 border-gray-300 focus:ring-green-800"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="llqpQuebec"
                      value="non-applicable"
                      checked={businessInfo.llqpQuebec === 'non-applicable'}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, llqpQuebec: e.target.value as 'yes' | 'no' | 'non-applicable' })}
                      className="w-4 h-4 text-green-800 border-gray-300 focus:ring-green-800"
                    />
                    <span className="text-sm text-gray-700">Non Applicable</span>
                  </label>
            </div>
          </div>


              {/* Office Locations */}
              <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Office Locations</h3>
                <button
                  type="button"
                    onClick={() => setShowAddLocation(!showAddLocation)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                    Add Location
                </button>
              </div>

                {showAddLocation && (
                  <div className="mb-4 p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-3">New Office Location</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newLocation.name}
                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                        placeholder="Location Name *"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-700 outline-none"
                      />
                      <input
                        type="text"
                        value={newLocation.street_address}
                        onChange={(e) => setNewLocation({ ...newLocation, street_address: e.target.value })}
                        placeholder="Street Address"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-700 outline-none"
                      />
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={newLocation.city}
                          onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                          placeholder="City *"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-green-700 outline-none"
                        />
                        <select
                          value={newLocation.province}
                          onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-green-700 outline-none"
                        >
                          {provinces.map(prov => (
                            <option key={prov} value={prov}>{prov}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={newLocation.postal_code}
                          onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                          placeholder="Postal Code"
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-green-700 outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                    <button
                      type="button"
                          onClick={addOfficeLocation}
                          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddLocation(false);
                            setNewLocation({
                              name: '',
                              street_address: '',
                              city: '',
                              province: 'BC',
                              postal_code: '',
                            });
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {officeLocations.map((loc, index) => (
                  <div key={index} className="mb-3 p-3 border border-gray-300 rounded-lg flex justify-between items-start">
                    <div>
                      <div className="font-medium">{loc.name}</div>
                      <div className="text-sm text-gray-600">
                        {loc.street_address && `${loc.street_address}, `}
                        {loc.city}, {loc.province} {loc.postal_code}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOfficeLocation(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                </div>
            </div>
          )}

          {/* Step 3: Profile Bio */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4 text-black">Step 3: Profile Bio</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                <select
                  value={bioData.years_of_experience}
                  onChange={(e) => setBioData({ ...bioData, years_of_experience: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
                >
                  <option value="">Select...</option>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num.toString()}>
                      {num} {num === 1 ? 'year' : 'years'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How do you typically help families? (200 chars max) *
                </label>
                    <textarea
                  value={bioData.practice_philosophy_help}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      setBioData({ ...bioData, practice_philosophy_help: e.target.value });
                    }
                  }}
                  placeholder="Describe your approach to helping families..."
                  rows={3}
                  maxLength={200}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors resize-none"
                  required
                    />
                <p className="text-xs text-gray-500 mt-1">{bioData.practice_philosophy_help.length}/200 characters</p>
              </div>
                    
                    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do families appreciate most about your approach? (200 chars max) *
                        </label>
                <textarea
                  value={bioData.practice_philosophy_appreciate}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      setBioData({ ...bioData, practice_philosophy_appreciate: e.target.value });
                    }
                  }}
                  placeholder="What families value about working with you..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{bioData.practice_philosophy_appreciate.length}/200 characters</p>
                      </div>

            </div>
          )}

          {/* Acknowledgment Checkbox (Step 3 only) */}
          {currentStep === 3 && (
            <div className="mt-6 p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgmentChecked}
                  onChange={(e) => setAcknowledgmentChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-800 border-gray-300 rounded focus:ring-green-800"
                  required
                />
                <span className="text-sm text-gray-700">
                  I have answered all questions with the best of my knowledge *
                </span>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <button
                  type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
              <ChevronLeft className="w-5 h-5" />
              Back
                </button>
            
            {currentStep < 3 ? (
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
          <button
            type="submit"
            disabled={submitting}
                className="px-8 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
            )}
          </div>

          {/* Login Link */}
          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/agent" className="text-green-700 hover:underline">
              log in
            </Link>
          </p>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-black">Account Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been submitted for approval. You will receive an email notification once your account has been reviewed and approved.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/');
                }}
                className="px-8 bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
