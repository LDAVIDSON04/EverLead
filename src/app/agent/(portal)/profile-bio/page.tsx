"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { FileText, Check } from "lucide-react";

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
    practice_philosophy_help: '',
    practice_philosophy_appreciate: '',
  });
  const [bioStatus, setBioStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [generatedBio, setGeneratedBio] = useState<string | null>(null);

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
          practice_philosophy_help: bio.practice_philosophy_help || '',
          practice_philosophy_appreciate: bio.practice_philosophy_appreciate || '',
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

      // Validate required fields
      if (!bioData.years_of_experience || !bioData.practice_philosophy_help || !bioData.practice_philosophy_appreciate) {
        setSaveMessage({ type: 'error', text: 'Please fill in all required fields.' });
        setSaving(false);
        return;
      }

      // First save the bio data
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('metadata')
        .eq('id', user.id)
        .single();

      const metadata = profile?.metadata || {};
      metadata.bio = bioData;

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ metadata })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Then generate/regenerate the bio automatically
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
      setBioStatus('approved');
      setSaveMessage({ type: 'success', text: 'Bio information saved and updated successfully!' });
      
      // Reload to get updated status
      await loadBioData();
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save bio information' });
    } finally {
      setSaving(false);
    }
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
          {generatedBio && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  Your bio is live on your profile and will update automatically when you save changes.
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
              {Array.from({ length: 50 }, (_, i) => i + 1).map(year => (
                <option key={year} value={year}>{year} year{year > 1 ? 's' : ''}</option>
              ))}
            </Select>
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


          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !bioData.years_of_experience || !bioData.practice_philosophy_help || !bioData.practice_philosophy_appreciate}
              className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save & Update Bio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
