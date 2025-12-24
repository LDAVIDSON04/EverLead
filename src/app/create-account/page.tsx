"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, User, Lock, Mail, Phone, MapPin, Plus, X, Upload } from 'lucide-react';

interface FuneralHome {
  name: string;
  address: string;
  logo: File | null;
  logoUrl?: string;
}

export default function CreateAccountPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    street: '',
    city: '',
    province: 'BC',
    postalCode: '',
    
    // Certificates/Licenses
    certificatesLicenses: '',
    
    // Professional Groups
    professionalGroups: '',
    
    // Community Organizations
    communityOrganizations: '',
    
    // LLQP License Questions
    llqpExclusiveQuebec: 'no',
    llqpIncludingQuebec: 'no',
    
    // TruStage
    trustageEnrollerNumber: 'no',
    
    // Independent Agent
    independentAgent: 'no',
    
    // Services Provided
    servicesProvided: [] as string[],
    
    // Funeral Home Services
    funeralHomeServices: [] as string[],
  });
  
  const [funeralHomes, setFuneralHomes] = useState<FuneralHome[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const provinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleCheckboxChange = (name: 'servicesProvided' | 'funeralHomeServices', value: string) => {
    setFormData(prev => {
      const current = prev[name];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [name]: updated };
    });
  };

  const addFuneralHome = () => {
    setFuneralHomes([...funeralHomes, { name: '', address: '', logo: null }]);
  };

  const removeFuneralHome = (index: number) => {
    setFuneralHomes(funeralHomes.filter((_, i) => i !== index));
  };

  const updateFuneralHome = (index: number, field: keyof FuneralHome, value: string | File | null) => {
    const updated = [...funeralHomes];
    updated[index] = { ...updated[index], [field]: value };
    setFuneralHomes(updated);
  };

  const handleLogoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateFuneralHome(index, 'logo', file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFuneralHome(index, 'logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword || 
        !formData.phone || !formData.street || !formData.city || !formData.province || !formData.postalCode) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.independentAgent === 'no' && funeralHomes.length === 0) {
      setError('Please add at least one funeral home if you are not an independent agent.');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare funeral homes data (without file uploads for now - can be added later)
      const funeralHomesData = funeralHomes.map(fh => ({
        name: fh.name,
        address: fh.address,
        logo: fh.logoUrl || null, // For now, just store the preview URL
      }));

      // Call the agent signup API
      const response = await fetch('/api/agent/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone: formData.phone,
          address: {
            street: formData.street,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
          },
          certificates_licenses: formData.certificatesLicenses,
          professional_groups: formData.professionalGroups,
          community_organizations: formData.communityOrganizations,
          llqp_exclusive_quebec: formData.llqpExclusiveQuebec === 'yes',
          llqp_including_quebec: formData.llqpIncludingQuebec === 'yes',
          trustage_enroller_number: formData.trustageEnrollerNumber === 'yes',
          independent_agent: formData.independentAgent === 'yes',
          funeral_homes: funeralHomesData,
          services_provided: formData.servicesProvided,
          funeral_home_services: formData.funeralHomeServices,
          // For backward compatibility
          funeral_home: funeralHomes.length > 0 ? funeralHomes[0].name : '',
          licensed_in_province: true, // Default
          licensed_funeral_director: true, // Default
          notification_cities: [{ city: formData.city, province: formData.province }],
        }),
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
    <div className="min-h-screen bg-gray-100 py-8 px-4">
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
        <h1 className="text-4xl font-bold text-center mb-8 text-black">Create Account</h1>
        <p className="text-center text-gray-600 mb-8">Please fill out all fields to submit your account for approval</p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">Basic Information</h2>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name *"
                  className="w-full pl-8 pr-4 py-3 border-b-2 border-gray-300 focus:border-green-700 outline-none transition-colors bg-transparent"
                  required
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone *"
                  className="w-full pl-8 pr-4 py-3 border-b-2 border-gray-300 focus:border-green-700 outline-none transition-colors bg-transparent"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email *"
                  className="w-full pl-8 pr-4 py-3 border-b-2 border-gray-300 focus:border-green-700 outline-none transition-colors bg-transparent"
                  required
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Street Address *"
                  className="w-full pl-8 pr-4 py-3 border-b-2 border-gray-300 focus:border-green-700 outline-none transition-colors bg-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City *"
                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-green-700 outline-none transition-colors bg-transparent"
                    required
                  />
                </div>
                <div className="relative">
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-green-700 outline-none transition-colors bg-transparent"
                    required
                  >
                    {provinces.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Postal Code *"
                  className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-green-700 outline-none transition-colors bg-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Certificates/Licenses Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">Certificates/Licenses</h2>
            <textarea
              name="certificatesLicenses"
              value={formData.certificatesLicenses}
              onChange={handleChange}
              placeholder="List your certificates and licenses"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors resize-none"
            />
          </div>

          {/* Professional Groups Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">Professional Groups</h2>
            <textarea
              name="professionalGroups"
              value={formData.professionalGroups}
              onChange={handleChange}
              placeholder="List your professional groups"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors resize-none"
            />
          </div>

          {/* Community Organizations Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">Community Organizations</h2>
            <textarea
              name="communityOrganizations"
              value={formData.communityOrganizations}
              onChange={handleChange}
              placeholder="List your community organizations"
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors resize-none"
            />
          </div>

          {/* LLQP License Questions */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">LLQP License</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-gray-700">LLQP license in Canada (exclusive of Quebec)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="llqpExclusiveQuebec"
                      value="yes"
                      checked={formData.llqpExclusiveQuebec === 'yes'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="llqpExclusiveQuebec"
                      value="no"
                      checked={formData.llqpExclusiveQuebec === 'no'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700">LLQP license in Canada including Quebec</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="llqpIncludingQuebec"
                      value="yes"
                      checked={formData.llqpIncludingQuebec === 'yes'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="llqpIncludingQuebec"
                      value="no"
                      checked={formData.llqpIncludingQuebec === 'no'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700">Do you have a TruStage Life of Canada enroller number?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="trustageEnrollerNumber"
                      value="yes"
                      checked={formData.trustageEnrollerNumber === 'yes'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="trustageEnrollerNumber"
                      value="no"
                      checked={formData.trustageEnrollerNumber === 'no'}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Independent Agent */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">Agent Status</h2>
            <div>
              <label className="block mb-2 text-gray-700">Are you an independent agent?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="independentAgent"
                    value="yes"
                    checked={formData.independentAgent === 'yes'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="independentAgent"
                    value="no"
                    checked={formData.independentAgent === 'no'}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Funeral Homes Section */}
          {formData.independentAgent === 'no' && (
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-black">Funeral Homes</h2>
                <button
                  type="button"
                  onClick={addFuneralHome}
                  className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Funeral Home
                </button>
              </div>

              {funeralHomes.map((fh, index) => (
                <div key={index} className="mb-4 p-4 border-2 border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-700">Funeral Home {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeFuneralHome(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Funeral Home Name"
                      value={fh.name}
                      onChange={(e) => updateFuneralHome(index, 'name', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors"
                    />
                    
                    <textarea
                      placeholder="Address"
                      value={fh.address}
                      onChange={(e) => updateFuneralHome(index, 'address', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-700 outline-none transition-colors resize-none"
                    />
                    
                    <div>
                      <label className="block mb-2 text-gray-700">Logo</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-green-700 transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>Upload Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleLogoUpload(index, e)}
                            className="hidden"
                          />
                        </label>
                        {fh.logoUrl && (
                          <img src={fh.logoUrl} alt="Logo preview" className="w-16 h-16 object-cover rounded" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Services Provided */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">What services do you provide?</h2>
            <div className="space-y-2">
              {['Prearranged funeral planning', 'Travel protection', 'Documentation Services'].map(service => (
                <label key={service} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.servicesProvided.includes(service)}
                    onChange={() => handleCheckboxChange('servicesProvided', service)}
                    className="w-4 h-4"
                  />
                  <span>{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Funeral Home Services */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">What services does your funeral home provide?</h2>
            <div className="space-y-2">
              {['Cremation', 'Burial', 'Green Burial', 'Scattering Garden', 'Cemetery Services', 'Other'].map(service => (
                <label key={service} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.funeralHomeServices.includes(service)}
                    onChange={() => handleCheckboxChange('funeralHomeServices', service)}
                    className="w-4 h-4"
                  />
                  <span>{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Password Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-black">Account Security</h2>
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password *"
                  className="w-full pl-8 pr-12 py-3 border-b-2 border-gray-300 focus:border-green-700 outline-none transition-colors bg-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password *"
                  className="w-full pl-8 pr-12 py-3 border-b-2 border-gray-300 focus:border-green-700 outline-none transition-colors bg-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>

          {/* Login Link */}
          <p className="text-center text-gray-600 text-sm">
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
