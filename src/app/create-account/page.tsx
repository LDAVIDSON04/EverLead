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
    regionsServed: [] as string[],
    specialty: '',
    trustageEnrollerNumber: 'no' as 'yes' | 'no',
    llqpLicense: 'no' as 'yes' | 'no',
    llqpQuebec: 'non-applicable' as 'yes' | 'no' | 'non-applicable',
  });
  const [newRegion, setNewRegion] = useState('');
  const [regionSuggestions, setRegionSuggestions] = useState<string[]>([]);
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
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
    specialties: [] as string[],
    practice_philosophy_help: '',
    practice_philosophy_appreciate: '',
    practice_philosophy_situations: [] as string[],
    languages_spoken: [] as string[],
    typical_response_time: '',
  });

  const provinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
  
  // Comprehensive list of Canadian cities and regions for autocomplete
  const canadianRegions = [
    // Ontario
    'Toronto', 'GTA', 'Greater Toronto Area', 'Mississauga', 'Brampton', 'Oakville', 'Burlington',
    'Hamilton', 'Ottawa', 'London', 'Kitchener', 'Waterloo', 'Cambridge', 'Windsor', 'Oshawa',
    'Sudbury', 'Barrie', 'Guelph', 'Kingston', 'Thunder Bay', 'Sarnia', 'St. Catharines', 'Niagara Falls',
    'Peterborough', 'Belleville', 'Sault Ste. Marie', 'North Bay', 'Cornwall', 'Orillia', 'Brantford',
    'Markham', 'Richmond Hill', 'Vaughan', 'Ajax', 'Pickering', 'Whitby', 'Newmarket', 'Aurora',
    'Milton', 'Caledon', 'Halton Hills', 'Grimsby', 'Stoney Creek', 'Dundas', 'Ancaster',
    // British Columbia
    'Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Richmond', 'Coquitlam', 'Kelowna', 'Abbotsford',
    'Langley', 'North Vancouver', 'West Vancouver', 'New Westminster', 'Port Coquitlam', 'Maple Ridge',
    'Nanaimo', 'Chilliwack', 'Kamloops', 'Prince George', 'Vernon', 'Penticton', 'Campbell River',
    'Courtenay', 'Port Alberni', 'Salmon Arm', 'Fort St. John', 'Prince Rupert', 'Duncan',
    'Lower Mainland', 'Fraser Valley', 'Okanagan Valley', 'Vancouver Island',
    // Alberta
    'Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie',
    'Airdrie', 'Spruce Grove', 'Leduc', 'Fort McMurray', 'Sherwood Park', 'Okotoks', 'Cochrane',
    'Canmore', 'Banff', 'Jasper', 'Strathcona County',
    // Quebec
    'Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Levis',
    'Trois-Rivieres', 'Terrebonne', 'Brossard', 'Repentigny', 'Drummondville', 'Saint-Jean-sur-Richelieu',
    'Granby', 'Blainville', 'Saint-Jerome', 'Chateauguay', 'Mirabel', 'Saint-Hyacinthe', 'Shawinigan',
    'Dollard-des-Ormeaux', 'Pointe-Claire', 'Westmount', 'Outremont', 'Verdun',
    // Manitoba
    'Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'Winkler', 'Selkirk',
    'Morden', 'Dauphin', 'The Pas',
    // Saskatchewan
    'Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current', 'Yorkton', 'North Battleford',
    'Estevan', 'Weyburn', 'Melfort', 'Lloydminster',
    // Nova Scotia
    'Halifax', 'Dartmouth', 'Sydney', 'Truro', 'New Glasgow', 'Glace Bay', 'Kentville', 'Amherst',
    'Bridgewater', 'Yarmouth', 'Liverpool',
    // New Brunswick
    'Saint John', 'Moncton', 'Fredericton', 'Dieppe', 'Miramichi', 'Edmundston', 'Riverview',
    'Bathurst', 'Campbellton', 'Sackville',
    // Newfoundland and Labrador
    'St. John\'s', 'Mount Pearl', 'Corner Brook', 'Conception Bay South', 'Grand Falls-Windsor',
    'Gander', 'Happy Valley-Goose Bay', 'Labrador City', 'Stephenville',
    // Prince Edward Island
    'Charlottetown', 'Summerside', 'Stratford', 'Cornwall',
    // Yukon
    'Whitehorse', 'Dawson City', 'Watson Lake',
    // Northwest Territories
    'Yellowknife', 'Hay River', 'Inuvik', 'Fort Smith',
    // Nunavut
    'Iqaluit', 'Rankin Inlet', 'Arviat',
  ].sort();

  const specialtyOptions = [
    'Pre-need planning',
    'Estate planning support',
    'Grief counseling',
    'Family facilitation',
    'Cremation planning',
    'Cultural/religious planning',
  ];

  const situationOptions = [
    'Immediate planning needs',
    'Future planning',
    'Family discussions',
    'Estate coordination',
    'Cultural/religious considerations',
  ];

  const languageOptions = ['English', 'French', 'Spanish', 'Mandarin', 'Cantonese', 'Punjabi', 'Tagalog', 'Arabic', 'Other'];

  // Validation
  const validateStep1 = (): boolean => {
    if (!basicInfo.fullName || !basicInfo.email || !basicInfo.phone || !basicInfo.password || !basicInfo.confirmPassword ||
        !basicInfo.street || !basicInfo.city || !basicInfo.province || !basicInfo.postalCode) {
      setError('Please fill in all required fields.');
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
    if (!businessInfo.businessName || !businessInfo.professionalTitle ||
        businessInfo.regionsServed.length === 0 || !businessInfo.specialty) {
      setError('Please fill in all required fields.');
      return false;
    }
    return true;
  };

  const handleRegionInputChange = (value: string) => {
    setNewRegion(value);
    if (value.trim().length > 0) {
      const filtered = canadianRegions.filter(region =>
        region.toLowerCase().includes(value.toLowerCase()) &&
        !businessInfo.regionsServed.includes(region)
      ).slice(0, 8); // Limit to 8 suggestions
      setRegionSuggestions(filtered);
      setShowRegionSuggestions(filtered.length > 0);
      setHighlightedSuggestionIndex(-1);
    } else {
      setRegionSuggestions([]);
      setShowRegionSuggestions(false);
    }
    setError(null);
  };

  const selectRegion = (region: string) => {
    if (!businessInfo.regionsServed.includes(region)) {
      setBusinessInfo({ ...businessInfo, regionsServed: [...businessInfo.regionsServed, region] });
    }
    setNewRegion('');
    setRegionSuggestions([]);
    setShowRegionSuggestions(false);
    setHighlightedSuggestionIndex(-1);
    setError(null);
  };

  const addRegion = () => {
    const trimmedRegion = newRegion.trim();
    if (!trimmedRegion) {
      setError('Please enter a region name.');
      return;
    }
    if (businessInfo.regionsServed.includes(trimmedRegion)) {
      setError('This region has already been added.');
      return;
    }
    selectRegion(trimmedRegion);
  };

  const removeRegion = (index: number) => {
    setBusinessInfo({
      ...businessInfo,
      regionsServed: businessInfo.regionsServed.filter((_, i) => i !== index),
    });
  };

  const validateStep3 = (): boolean => {
    if (!bioData.years_of_experience || bioData.specialties.length === 0 ||
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

  const toggleSpecialty = (specialty: string) => {
    setBioData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : prev.specialties.length < 5
        ? [...prev.specialties, specialty]
        : prev.specialties
    }));
  };

  const toggleSituation = (situation: string) => {
    setBioData(prev => ({
      ...prev,
      practice_philosophy_situations: prev.practice_philosophy_situations.includes(situation)
        ? prev.practice_philosophy_situations.filter(s => s !== situation)
        : [...prev.practice_philosophy_situations, situation]
    }));
  };

  const toggleLanguage = (language: string) => {
    setBioData(prev => ({
      ...prev,
      languages_spoken: prev.languages_spoken.includes(language)
        ? prev.languages_spoken.filter(l => l !== language)
        : [...prev.languages_spoken, language]
    }));
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
          regions_served: businessInfo.regionsServed.join(', '),
          regions_served_array: businessInfo.regionsServed,
          specialty: businessInfo.specialty,
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
        {/* Logo and Home Link */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Soradin.png"
              alt="Soradin Logo"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </Link>
          <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors underline">
            Home
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
                  onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
                  placeholder="Email *"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                  placeholder="Phone *"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                  required
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
                  placeholder="Street Address *"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region(s) Served *</label>
                <div className="space-y-3">
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newRegion}
                          onChange={(e) => handleRegionInputChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (highlightedSuggestionIndex >= 0 && regionSuggestions[highlightedSuggestionIndex]) {
                                selectRegion(regionSuggestions[highlightedSuggestionIndex]);
                              } else {
                                addRegion();
                              }
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedSuggestionIndex(prev => 
                                prev < regionSuggestions.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Escape') {
                              setShowRegionSuggestions(false);
                              setHighlightedSuggestionIndex(-1);
                            }
                          }}
                          onFocus={() => {
                            if (newRegion.trim().length > 0 && regionSuggestions.length > 0) {
                              setShowRegionSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding suggestions to allow click events
                            setTimeout(() => setShowRegionSuggestions(false), 200);
                          }}
                          placeholder="Start typing to see suggestions..."
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                        />
                        {showRegionSuggestions && regionSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {regionSuggestions.map((suggestion, index) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => selectRegion(suggestion)}
                                className={`w-full text-left px-4 py-2 hover:bg-green-50 transition-colors ${
                                  index === highlightedSuggestionIndex ? 'bg-green-100' : ''
                                } ${index === 0 ? 'rounded-t-lg' : ''} ${index === regionSuggestions.length - 1 ? 'rounded-b-lg' : ''}`}
                              >
                                <span className="text-sm text-gray-700">{suggestion}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={addRegion}
                        disabled={!newRegion.trim()}
                        className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Add
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Type to search Canadian cities and regions, or enter your own</p>
                  </div>
                  {businessInfo.regionsServed.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {businessInfo.regionsServed.map((region, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                          <span className="text-sm font-medium text-gray-700">{region}</span>
                          <button
                            type="button"
                            onClick={() => removeRegion(index)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            aria-label={`Remove ${region}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialty / Services Offered *</label>
                <textarea
                  value={businessInfo.specialty}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, specialty: e.target.value })}
                  placeholder="Describe your specialties and services..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors resize-none"
                  required
                />
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
                  <option value="1-3">1-3 years</option>
                  <option value="4-7">4-7 years</option>
                  <option value="8-12">8-12 years</option>
                  <option value="12+">12+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialties (Select up to 5) *</label>
                <div className="grid grid-cols-2 gap-3">
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                        checked={bioData.specialties.includes(specialty)}
                        onChange={() => toggleSpecialty(specialty)}
                        className="w-4 h-4 text-green-800 border-gray-300 rounded focus:ring-green-800"
                      />
                      <span className="text-sm text-gray-700">{specialty}</span>
                </label>
              ))}
            </div>
                {bioData.specialties.length >= 5 && (
                  <p className="text-xs text-gray-500 mt-2">Maximum 5 specialties selected</p>
                )}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What situations are you best suited for? (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {situationOptions.map((situation) => (
                    <label key={situation} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bioData.practice_philosophy_situations.includes(situation)}
                        onChange={() => toggleSituation(situation)}
                        className="w-4 h-4 text-green-800 border-gray-300 rounded focus:ring-green-800"
                      />
                      <span className="text-sm text-gray-700">{situation}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                <div className="flex flex-wrap gap-3">
                  {languageOptions.map((lang) => (
                    <label key={lang} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bioData.languages_spoken.includes(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className="w-4 h-4 text-green-800 border-gray-300 rounded focus:ring-green-800"
                      />
                      <span className="text-sm text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Typical Response Time</label>
                <select
                  value={bioData.typical_response_time}
                  onChange={(e) => setBioData({ ...bioData, typical_response_time: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                >
                  <option value="">Select...</option>
                  <option value="within-1-hour">Within 1 hour</option>
                  <option value="within-2-hours">Within 2 hours</option>
                  <option value="within-4-hours">Within 4 hours</option>
                  <option value="within-24-hours">Within 24 hours</option>
                  <option value="within-48-hours">Within 48 hours</option>
                </select>
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
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/agent');
                }}
                className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push('/');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition-colors"
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
