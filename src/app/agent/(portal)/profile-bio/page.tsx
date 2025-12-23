"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { FileText, Check, X, Clock, RefreshCw } from "lucide-react";

// UI Components (same as settings page)
function Label({ className = "", children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props}>
      {children}
    </label>
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

function Select({ value, onValueChange, children, ...props }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent"
      {...props}
    >
      {children}
    </select>
  );
}

export default function ProfileBioPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [bioData, setBioData] = useState({
    years_of_experience: '',
    specialties: [] as string[],
    practice_philosophy_help: '',
    practice_philosophy_appreciate: '',
    practice_philosophy_situations: [] as string[],
    languages_spoken: [] as string[],
    typical_response_time: '',
  });
  const [bioStatus, setBioStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [generatedBio, setGeneratedBio] = useState<string | null>(null);

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

  useEffect(() => {
    loadBioData();
  }, []);

  async function loadBioData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('metadata, bio_approval_status, ai_generated_bio')
        .eq('id', user.id)
        .single();

      if (profile) {
        const metadata = profile.metadata || {};
        const bio = metadata.bio || {};
        
        setBioData({
          years_of_experience: bio.years_of_experience || '',
          specialties: bio.specialties || [],
          practice_philosophy_help: bio.practice_philosophy_help || '',
          practice_philosophy_appreciate: bio.practice_philosophy_appreciate || '',
          practice_philosophy_situations: bio.practice_philosophy_situations || [],
          languages_spoken: bio.languages_spoken || [],
          typical_response_time: bio.typical_response_time || '',
        });

        setBioStatus(profile.bio_approval_status as any);
        setGeneratedBio(profile.ai_generated_bio);
      }
    } catch (err) {
      console.error('Error loading bio data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaveMessage(null);

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('metadata')
        .eq('id', user.id)
        .single();

      const metadata = profile?.metadata || {};
      metadata.bio = bioData;

      const { error } = await supabaseClient
        .from('profiles')
        .update({ metadata })
        .eq('id', user.id);

      if (error) throw error;

      setSaveMessage({ type: 'success', text: 'Bio information saved successfully!' });
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save bio information' });
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateBio() {
    try {
      setGenerating(true);
      setSaveMessage(null);

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // First save the bio data
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('metadata')
        .eq('id', user.id)
        .single();

      const metadata = profile?.metadata || {};
      metadata.bio = bioData;

      await supabaseClient
        .from('profiles')
        .update({ metadata })
        .eq('id', user.id);

      // Then generate the bio
      const res = await fetch('/api/agents/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: user.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate bio');
      }

      const data = await res.json();
      setGeneratedBio(data.bio);
      setBioStatus('pending');
      setSaveMessage({ type: 'success', text: 'Bio generated successfully! It will be reviewed by admin before being published.' });
      
      // Reload to get updated status
      await loadBioData();
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to generate bio' });
    } finally {
      setGenerating(false);
    }
  }

  function toggleSpecialty(specialty: string) {
    setBioData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : prev.specialties.length < 5
        ? [...prev.specialties, specialty]
        : prev.specialties
    }));
  }

  function toggleSituation(situation: string) {
    setBioData(prev => ({
      ...prev,
      practice_philosophy_situations: prev.practice_philosophy_situations.includes(situation)
        ? prev.practice_philosophy_situations.filter(s => s !== situation)
        : [...prev.practice_philosophy_situations, situation]
    }));
  }

  function toggleLanguage(language: string) {
    setBioData(prev => ({
      ...prev,
      languages_spoken: prev.languages_spoken.includes(language)
        ? prev.languages_spoken.filter(l => l !== language)
        : [...prev.languages_spoken, language]
    }));
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-800 mb-4"></div>
                <p className="text-sm text-gray-600">Loading bio information...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={32} className="text-gray-800" />
            <h1 className="text-3xl">Profile Bio</h1>
          </div>
          <p className="text-gray-600">Fill out structured information to generate your professional bio</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {saveMessage && (
            <div className={`mb-6 p-4 rounded-lg ${
              saveMessage.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {saveMessage.text}
            </div>
          )}

          {/* Bio Status */}
          {bioStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              bioStatus === 'approved' 
                ? 'bg-green-50 border border-green-200' 
                : bioStatus === 'rejected'
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                {bioStatus === 'approved' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : bioStatus === 'rejected' ? (
                  <X className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
                <p className={`text-sm font-medium ${
                  bioStatus === 'approved' ? 'text-green-800' : bioStatus === 'rejected' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {bioStatus === 'approved' 
                    ? 'Your bio has been approved and is live on your profile.'
                    : bioStatus === 'rejected'
                    ? 'Your bio was rejected. Please update your information and generate a new bio.'
                    : 'Your bio is pending admin approval.'}
                </p>
              </div>
            </div>
          )}

          {/* Generated Bio Preview */}
          {generatedBio && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Generated Bio Preview</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{generatedBio}</p>
            </div>
          )}

          {/* Years of Experience */}
          <div className="mb-6">
            <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
            <Select
              value={bioData.years_of_experience}
              onValueChange={(value) => setBioData({ ...bioData, years_of_experience: value })}
              className="mt-1"
            >
              <option value="">Select...</option>
              <option value="1-3">1-3 years</option>
              <option value="4-7">4-7 years</option>
              <option value="8-12">8-12 years</option>
              <option value="12+">12+ years</option>
            </Select>
          </div>

          {/* Specialties */}
          <div className="mb-6">
            <Label>Specialties (Select up to 5) *</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
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

          {/* Practice Philosophy */}
          <div className="mb-6">
            <Label htmlFor="practicePhilosophyHelp">How do you typically help families? (200 chars max) *</Label>
            <Textarea
              id="practicePhilosophyHelp"
              value={bioData.practice_philosophy_help}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setBioData({ ...bioData, practice_philosophy_help: e.target.value });
                }
              }}
              className="mt-1"
              rows={3}
              maxLength={200}
              placeholder="Describe your approach to helping families..."
            />
            <p className="text-xs text-gray-500 mt-1">{bioData.practice_philosophy_help.length}/200 characters</p>
          </div>

          <div className="mb-6">
            <Label htmlFor="practicePhilosophyAppreciate">What do families appreciate most about your approach? (200 chars max) *</Label>
            <Textarea
              id="practicePhilosophyAppreciate"
              value={bioData.practice_philosophy_appreciate}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setBioData({ ...bioData, practice_philosophy_appreciate: e.target.value });
                }
              }}
              className="mt-1"
              rows={3}
              maxLength={200}
              placeholder="What families value about working with you..."
            />
            <p className="text-xs text-gray-500 mt-1">{bioData.practice_philosophy_appreciate.length}/200 characters</p>
          </div>

          <div className="mb-6">
            <Label>What situations are you best suited for? (Select all that apply)</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
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

          {/* Languages */}
          <div className="mb-6">
            <Label>Languages Spoken</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {['English', 'French', 'Spanish', 'Mandarin', 'Cantonese', 'Punjabi', 'Tagalog', 'Arabic', 'Other'].map((lang) => (
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

          {/* Typical Response Time */}
          <div className="mb-6">
            <Label htmlFor="typicalResponseTime">Typical Response Time</Label>
            <Select
              value={bioData.typical_response_time}
              onValueChange={(value) => setBioData({ ...bioData, typical_response_time: value })}
              className="mt-1"
            >
              <option value="">Select...</option>
              <option value="within-1-hour">Within 1 hour</option>
              <option value="within-2-hours">Within 2 hours</option>
              <option value="within-4-hours">Within 4 hours</option>
              <option value="within-24-hours">Within 24 hours</option>
              <option value="within-48-hours">Within 48 hours</option>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Information'}
            </button>
            <button
              onClick={handleGenerateBio}
              disabled={generating || !bioData.years_of_experience || bioData.specialties.length === 0 || !bioData.practice_philosophy_help}
              className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Generate Bio
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
