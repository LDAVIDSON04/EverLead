"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Settings, Camera, Check, AlertCircle, Lock, Trash2, AlertTriangle, Bell, Mail, Smartphone, CreditCard, ExternalLink, DollarSign, Calendar, RefreshCw, MapPin, Plus, X, FileText, Clock, Edit2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Import UI components - we'll create simple versions if they don't exist
function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

function Label({ className = "", children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props}>
      {children}
    </label>
  );
}

// Format 10-digit phone for display; leave other values as-is
function formatPhoneDisplay(value: string): string {
  if (!value || typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-neutral-800 h-2 rounded-full transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Badge({ className = "", children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

function Switch({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-neutral-800" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Select({ value, onValueChange, children, ...props }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
      {...props}
    >
      {children}
    </select>
  );
}

function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) {
  return <div>{children}</div>;
}

function TabsList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}

function TabsTrigger({ value, children, className = "", onClick }: { value: string; children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  return <div>{children}</div>;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  // Check for tab query parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['profile', 'bio', 'notifications', 'security'].includes(tab)) {
        setActiveTab(tab);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    businessName: "",
    professionalTitle: "",
    email: "",
    phone: "",
    regionsServed: "",
    licenseNumber: "",
    businessAddress: "",
    businessStreet: "",
    businessCity: "",
    businessProvince: "",
    businessZip: "",
    profilePictureUrl: "",
    specialty: "",
    agentRole: "",
    professionalDetails: "" as string, // role-specific: law_society_name, licensing_province, etc. (display string)
    notificationCities: "" as string, // e.g. "Penticton, BC; Victoria, BC" (from profile.notification_cities)
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          router.push("/agent");
          return;
        }

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) {
          router.push("/agent");
          return;
        }

        const res = await fetch("/api/agent/settings/profile", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load profile");

        const { profile } = await res.json();

        if (profile) {
          const metadata = profile.metadata || {};
          
          // Debug logging for address - log everything to see what's available
          console.log("🔍 [SETTINGS] Loading profile data:", {
            metadata_address: metadata.address,
            metadata_full: metadata,
            profile_street_address: profile.street_address,
            profile_city: profile.city,
            profile_province: profile.province,
            profile_postal_code: profile.postal_code,
            agent_city: profile.agent_city,
            agent_province: profile.agent_province,
            metadata_business_street: metadata.business_street,
            metadata_business_city: metadata.business_city,
            full_profile: profile, // Log entire profile to see all fields
          });
          
          // Prefer API-decoded address (profile.street_address etc from metadata.address) so create-account address always shows
          const addressStreet = (profile as any).street_address ?? metadata.address?.street ?? metadata.business_street ?? "";
          const addressCity = (profile as any).city ?? metadata.address?.city ?? profile.agent_city ?? metadata.business_city ?? "";
          const addressProvince = (profile as any).province ?? metadata.address?.province ?? profile.agent_province ?? metadata.business_province ?? "";
          const addressZip = (profile as any).postal_code ?? metadata.address?.postalCode ?? metadata.business_zip ?? "";
          // Business name: create-account stores in metadata.business_name; signup also sets profile.funeral_home
          const businessName = profile.funeral_home || (metadata as any).business_name || "";
          // License/credentials: create-account uses role-specific fields (law_society_name, licensing_province, regulatory_organization, llqp_license, etc.)
          const licenseNumber = (metadata as any).license_number || (metadata as any).law_society_name || (metadata as any).licensing_province || (metadata as any).regulatory_organization || "";
          // Build role-specific professional details string for display (all create-account fields)
          const details: string[] = [];
          if ((metadata as any).authorized_provinces) details.push(`Authorized provinces: ${(metadata as any).authorized_provinces}`);
          if ((metadata as any).additional_provinces) details.push(`Additional provinces: ${(metadata as any).additional_provinces}`);
          if ((metadata as any).registered_provinces) details.push(`Registered provinces: ${(metadata as any).registered_provinces}`);
          if ((metadata as any).llqp_license) details.push("LLQP License: Yes");
          if ((metadata as any).llqp_quebec) details.push(`LLQP Quebec: ${(metadata as any).llqp_quebec}`);
          if ((metadata as any).trustage_enroller_number) details.push("TruStage Enroller: Yes");
          if ((metadata as any).has_multiple_provinces) details.push("Multiple provinces: Yes");
          const professionalDetails = details.length ? details.join(" • ") : "";
          // Notification cities from signup (array of { city, province })
          const notificationCitiesList = (profile as any).notification_cities;
          const notificationCitiesStr = Array.isArray(notificationCitiesList)
            ? notificationCitiesList.map((c: { city?: string; province?: string }) => `${c.city || ""}, ${c.province || ""}`).filter(Boolean).join("; ")
            : "";
          setProfileData({
            fullName: profile.full_name || "",
            firstName: profile.first_name ?? (profile.full_name?.split(" ")[0] ?? ""),
            lastName: profile.last_name ?? (profile.full_name?.split(" ").slice(1).join(" ") ?? ""),
            businessName,
            professionalTitle: profile.job_title || "",
            email: profile.email || "",
            phone: formatPhoneDisplay(profile.phone || "") || (profile.phone || "") || (metadata as any).phone || "",
            regionsServed: (metadata as any).regions_served || (Array.isArray((metadata as any).regions_served_array) ? (metadata as any).regions_served_array.join(", ") : "") || "",
            licenseNumber,
            businessAddress: addressStreet,
            businessStreet: addressStreet,
            businessCity: addressCity,
            businessProvince: addressProvince,
            businessZip: addressZip,
            profilePictureUrl: profile.profile_picture_url || "",
            specialty: (metadata as any).specialty || "",
            agentRole: (metadata as any).agent_role || "",
            professionalDetails,
            notificationCities: notificationCitiesStr,
          });
          
          console.log("🔍 [SETTINGS] Set profile data (final values):", {
            businessStreet: addressStreet,
            businessCity: addressCity,
            businessProvince: addressProvince,
            businessZip: addressZip,
          });

        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings size={32} className="text-gray-800" />
            <h1 className="text-3xl">Settings</h1>
          </div>
          <p className="text-gray-600">Manage your profile, availability, payments, and account preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "profile"
                  ? "border-neutral-800 text-neutral-800"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Profile and business info
            </button>
            <button
              onClick={() => setActiveTab("bio")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "bio"
                  ? "border-neutral-800 text-neutral-800"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Profile Bio
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "notifications"
                  ? "border-neutral-800 text-neutral-800"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "security"
                  ? "border-neutral-800 text-neutral-800"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Security & Account
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "profile" && (
            <ProfileSection
              profileData={profileData}
              setProfileData={setProfileData}
            />
          )}
          {activeTab === "bio" && <ProfileBioSection />}
          {activeTab === "notifications" && <NotificationsSection email={profileData.email} phone={profileData.phone} />}
          {activeTab === "security" && <SecuritySection />}
        </div>

        {/* Footer spacing */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}

function ProfileSection({
  profileData,
  setProfileData,
}: {
  profileData: any;
  setProfileData: (data: any) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        throw new Error("Not authenticated. Please log in again.");
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error("Please select an image file");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Image must be less than 5MB");
      }

      console.log("Uploading profile picture:", { fileName: file.name, fileSize: file.size });

      // Get session for auth
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Session expired. Please log in again.");
      }

      // Upload via API endpoint (uses admin client to bypass RLS)
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/agent/settings/upload-profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        console.error("Upload error:", errorData);
        throw new Error(errorData.error || "Failed to upload profile picture");
      }

      const uploadResult = await uploadRes.json();
      const publicUrl = uploadResult.url;

      console.log("Upload successful, URL:", publicUrl);

      // Update local state immediately for preview (with cache busting to force refresh)
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      setProfileData({ ...profileData, profilePictureUrl: urlWithCacheBust });
      
      // Trigger a custom event to refresh the layout and other pages immediately
      window.dispatchEvent(new CustomEvent("profileUpdated", { detail: { profilePictureUrl: urlWithCacheBust } }));
      
      // DON'T dispatch onboardingStepCompleted here - wait until user clicks Save button

      // Reload profile data to show updated picture
      const reloadRes = await fetch("/api/agent/settings/profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (reloadRes.ok) {
        const { profile: updatedProfile } = await reloadRes.json();
        if (updatedProfile) {
          const metadata = updatedProfile.metadata || {};
          const notifCities = (updatedProfile as any).notification_cities;
          const notificationCitiesStr = Array.isArray(notifCities)
            ? notifCities.map((c: { city?: string; province?: string }) => `${c.city || ""}, ${c.province || ""}`).filter(Boolean).join("; ")
            : profileData.notificationCities;
          const details: string[] = [];
          if (metadata.authorized_provinces) details.push(`Authorized provinces: ${metadata.authorized_provinces}`);
          if (metadata.additional_provinces) details.push(`Additional provinces: ${metadata.additional_provinces}`);
          if (metadata.registered_provinces) details.push(`Registered provinces: ${metadata.registered_provinces}`);
          if (metadata.llqp_license) details.push("LLQP License: Yes");
          if (metadata.llqp_quebec) details.push(`LLQP Quebec: ${metadata.llqp_quebec}`);
          if (metadata.trustage_enroller_number) details.push("TruStage Enroller: Yes");
          if (metadata.has_multiple_provinces) details.push("Multiple provinces: Yes");
          const professionalDetails = details.length ? details.join(" • ") : "";
          setProfileData({
            ...profileData,
            fullName: updatedProfile.full_name || profileData.fullName,
            firstName: updatedProfile.first_name || profileData.firstName,
            lastName: updatedProfile.last_name || profileData.lastName,
            businessName: updatedProfile.funeral_home || profileData.businessName,
            professionalTitle: updatedProfile.job_title || profileData.professionalTitle,
            email: updatedProfile.email || profileData.email,
            phone: updatedProfile.phone || profileData.phone,
            regionsServed: metadata.regions_served ?? profileData.regionsServed,
            specialty: metadata.specialty ?? profileData.specialty,
            agentRole: metadata.agent_role ?? profileData.agentRole,
            professionalDetails,
            notificationCities: notificationCitiesStr,
            licenseNumber: metadata.license_number ?? profileData.licenseNumber,
            businessAddress: metadata.business_address ?? profileData.businessAddress,
            businessStreet: metadata.business_street ?? profileData.businessStreet,
            businessCity: metadata.business_city ?? profileData.businessCity,
            businessProvince: metadata.business_province ?? profileData.businessProvince,
            businessZip: metadata.business_zip ?? profileData.businessZip,
            profilePictureUrl: updatedProfile.profile_picture_url || publicUrl,
          });
        }
      }

      // Trigger a custom event to refresh the layout and other pages
      window.dispatchEvent(new CustomEvent("profileUpdated"));
      
      setSaveMessage({ type: "success", text: "Profile picture uploaded and saved successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Error uploading profile picture:", err);
      setSaveMessage({ 
        type: "error", 
        text: err.message || "Failed to upload profile picture. Please try again." 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      // Parse full name into first and last name if not already set
      const saveData = { ...profileData };
      if (saveData.fullName && (!saveData.firstName || !saveData.lastName)) {
        const nameParts = saveData.fullName.trim().split(/\s+/);
        if (nameParts.length > 0) {
          saveData.firstName = saveData.firstName || nameParts[0];
          saveData.lastName = saveData.lastName || nameParts.slice(1).join(' ') || '';
        }
      }

      // ALWAYS parse fullName into firstName and lastName to keep them in sync
      // This ensures the database first_name and last_name fields match the fullName
      if (saveData.fullName && saveData.fullName.trim()) {
        const nameParts = saveData.fullName.trim().split(/\s+/);
        saveData.firstName = nameParts[0] || '';
        saveData.lastName = nameParts.slice(1).join(' ') || '';
      } else if (saveData.fullName === '') {
        // If fullName is cleared, also clear firstName and lastName
        saveData.firstName = '';
        saveData.lastName = '';
      }
      // Persist phone as digits (10) for consistency with create-account
      const phoneDigits = (saveData.phone || "").replace(/\D/g, "").slice(0, 10);
      if (phoneDigits) saveData.phone = phoneDigits;

      console.log("Saving profile data:", {
        fullName: saveData.fullName,
        firstName: saveData.firstName,
        lastName: saveData.lastName,
        profilePictureUrl: saveData.profilePictureUrl,
      });

      const res = await fetch("/api/agent/settings/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(saveData),
      });

      const result = await res.json();
      console.log("Profile save response:", { status: res.status, result });

      if (!res.ok) {
        console.error("Profile save failed:", result);
        const errorMessage = result.error || result.details || `Failed to save profile (${res.status})`;
        throw new Error(errorMessage);
      }

      if (!result.success) {
        console.error("Profile save returned success: false", result);
        throw new Error(result.error || "Failed to save profile");
      }

      console.log("Profile saved successfully:", result);

      // Reload profile data to show updated values
      const reloadRes = await fetch("/api/agent/settings/profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (reloadRes.ok) {
        const { profile: updatedProfile } = await reloadRes.json();
        if (updatedProfile) {
          const metadata = updatedProfile.metadata || {};
          const notifCities = (updatedProfile as any).notification_cities;
          const notificationCitiesStr = Array.isArray(notifCities)
            ? notifCities.map((c: { city?: string; province?: string }) => `${c.city || ""}, ${c.province || ""}`).filter(Boolean).join("; ")
            : "";
          const details: string[] = [];
          if (metadata.authorized_provinces) details.push(`Authorized provinces: ${metadata.authorized_provinces}`);
          if (metadata.additional_provinces) details.push(`Additional provinces: ${metadata.additional_provinces}`);
          if (metadata.registered_provinces) details.push(`Registered provinces: ${metadata.registered_provinces}`);
          if (metadata.llqp_license) details.push("LLQP License: Yes");
          if (metadata.llqp_quebec) details.push(`LLQP Quebec: ${metadata.llqp_quebec}`);
          if (metadata.trustage_enroller_number) details.push("TruStage Enroller: Yes");
          if (metadata.has_multiple_provinces) details.push("Multiple provinces: Yes");
          const professionalDetails = details.length ? details.join(" • ") : "";
          setProfileData({
            fullName: updatedProfile.full_name || "",
            firstName: updatedProfile.first_name || updatedProfile.full_name?.split(" ")[0] || "",
            lastName: updatedProfile.last_name || updatedProfile.full_name?.split(" ").slice(1).join(" ") || "",
            businessName: updatedProfile.funeral_home || "",
            professionalTitle: updatedProfile.job_title || "",
            email: updatedProfile.email || "",
            phone: formatPhoneDisplay(updatedProfile.phone || "") || updatedProfile.phone || "",
            regionsServed: metadata.regions_served || "",
            licenseNumber: metadata.license_number || "",
            businessAddress: metadata.business_address || "",
            businessStreet: metadata.business_street || "",
            businessCity: metadata.business_city || "",
            businessProvince: metadata.business_province || "",
            businessZip: metadata.business_zip || "",
            profilePictureUrl: updatedProfile.profile_picture_url || "",
            specialty: metadata.specialty || "",
            agentRole: metadata.agent_role || "",
            professionalDetails,
            notificationCities: notificationCitiesStr,
          });
        }
      }

      // Trigger a custom event to refresh the layout and other pages
      // Add small delay to ensure database write has fully propagated
      setTimeout(() => {
      window.dispatchEvent(new CustomEvent("profileUpdated"));
      }, 200);
      
      // If profile picture exists, dispatch onboarding step completion after Save
      // This ensures Step 1 is only marked complete when user explicitly saves
      if (saveData.profilePictureUrl) {
        setTimeout(() => {
        window.dispatchEvent(new CustomEvent("onboardingStepCompleted", { detail: { step: 1 } }));
        }, 300);
      }

      setSaveMessage({ type: "success", text: "Profile saved successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setSaveMessage({ type: "error", text: err.message || "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl mb-2">Profile & Business Info</h2>
        <p className="text-gray-600 text-sm">Manage your professional profile and business information</p>
      </div>


      {/* Profile Photo */}
      <div className="mb-6">
        <Label className="mb-2 block">Profile Photo / Logo</Label>
        <div className="flex items-center gap-4">
          {profileData.profilePictureUrl ? (
            <img
              src={profileData.profilePictureUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              width={80}
              height={80}
              loading="lazy"
              onError={(e) => {
                console.error("Error loading profile picture:", profileData.profilePictureUrl);
                // Hide broken image
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-2xl text-white border-2 border-gray-200">
              {profileData.firstName?.[0]?.toUpperCase() || profileData.fullName?.[0]?.toUpperCase() || "A"}
              {profileData.lastName?.[0]?.toUpperCase() || ""}
            </div>
          )}
          <label className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
            <Camera size={16} />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={profileData.fullName}
            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="businessName">Business / Firm Name *</Label>
          <Input
            id="businessName"
            value={profileData.businessName}
            onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="professionalTitle">Professional Title *</Label>
          <Input
            id="professionalTitle"
            value={profileData.professionalTitle}
            onChange={(e) => setProfileData({ ...profileData, professionalTitle: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Changing your email will update your login email</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            className="mt-1"
            placeholder="(XXX) XXX-XXXX"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="businessStreet">Home Address</Label>
          <Input
            id="businessStreet"
            value={profileData.businessStreet}
            onChange={(e) => setProfileData({ ...profileData, businessStreet: e.target.value })}
            className="mt-1"
            placeholder="e.g., 123 Main Street"
          />
        </div>
        <div>
          <Label htmlFor="businessCity">City</Label>
          <Input
            id="businessCity"
            value={profileData.businessCity}
            onChange={(e) => setProfileData({ ...profileData, businessCity: e.target.value })}
            className="mt-1"
            placeholder="e.g., Kelowna"
          />
        </div>
        <div>
          <Label htmlFor="businessProvince">Province/State</Label>
          <Input
            id="businessProvince"
            value={profileData.businessProvince}
            onChange={(e) => setProfileData({ ...profileData, businessProvince: e.target.value })}
            className="mt-1"
            placeholder="e.g., BC"
          />
        </div>
        <div>
          <Label htmlFor="businessZip">Postal/Zip Code</Label>
          <Input
            id="businessZip"
            value={profileData.businessZip}
            onChange={(e) => setProfileData({ ...profileData, businessZip: e.target.value })}
            className="mt-1"
            placeholder="e.g., V1Y 1A1"
          />
        </div>
      </div>

      {/* Office Locations Section */}
      <div className="mb-6 border-t border-gray-200 pt-6">
        <OfficeLocationsSection />
      </div>

      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          saveMessage.type === "success" ? "bg-neutral-50 text-neutral-800" : "bg-red-50 text-red-800"
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function OfficeLocationsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    street_address: "",
    city: "",
    province: "",
    postal_code: "",
  });

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      setLoading(true);
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/agent/settings/office-locations", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load office locations");
      const { locations: fetchedLocations } = await res.json();
      setLocations(fetchedLocations || []);
    } catch (err) {
      console.error("Error loading office locations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaveMessage(null);

      if (!formData.city || !formData.province) {
        setSaveMessage({ type: "error", text: "City and province are required" });
        return;
      }

      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const url = editingId
        ? "/api/agent/settings/office-locations"
        : "/api/agent/settings/office-locations";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save office location");
      }

      setSaveMessage({ type: "success", text: editingId ? "Office location updated!" : "Office location added!" });
      setShowAddForm(false);
      setEditingId(null);
      setFormData({ name: "", street_address: "", city: "", province: "", postal_code: "" });
      await loadLocations();
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving office location:", err);
      setSaveMessage({ type: "error", text: err.message || "Failed to save office location" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this office location?")) return;

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`/api/agent/settings/office-locations?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete office location");
      }

      await loadLocations();
      setSaveMessage({ type: "success", text: "Office location deleted!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting office location:", err);
      setSaveMessage({ type: "error", text: err.message || "Failed to delete office location" });
    }
  }

  function startEdit(location: any) {
    setEditingId(location.id);
    setFormData({
      name: location.name || "",
      street_address: location.street_address || "",
      city: location.city || "",
      province: location.province || "",
      postal_code: location.postal_code || "",
    });
    setShowAddForm(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ name: "", street_address: "", city: "", province: "", postal_code: "" });
  }

  if (loading) {
    return (
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin size={18} />
          Office Locations
        </h3>
        <p className="text-sm text-gray-600">Loading office locations...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin size={18} />
          Office Locations
        </h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 text-sm bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 flex items-center gap-2"
          >
            <Plus size={14} />
            Add Location
          </button>
        )}
      </div>

      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          saveMessage.type === "success" ? "bg-neutral-50 text-neutral-800" : "bg-red-50 text-red-800"
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium mb-4">{editingId ? "Edit Office Location" : "Add Office Location"}</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Office, Downtown Branch"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="locationStreet">Street Address</Label>
              <Input
                id="locationStreet"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                placeholder="e.g., 123 Main Street"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="locationCity">City *</Label>
                <Input
                  id="locationCity"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Kelowna"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="locationProvince">Province *</Label>
                <Input
                  id="locationProvince"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="e.g., BC"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="locationPostal">Postal Code</Label>
              <Input
                id="locationPostal"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="e.g., V1Y 1A1"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Add Location"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locations List */}
      {locations.length === 0 && !showAddForm ? (
        <div className="text-sm text-gray-500 py-4">
          No office locations added yet. Click "Add Location" to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((location) => (
            <div key={location.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">{location.name || "Main Office"}</div>
                  <div className="text-sm text-gray-600">
                    {location.street_address && `${location.street_address}, `}
                    {location.city}, {location.province}
                    {location.postal_code && ` ${location.postal_code}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(location)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit location"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete location"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarAvailabilitySection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [appointmentLength, setAppointmentLength] = useState("30");

  const defaultSchedule = {
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "10:00", end: "14:00" },
    sunday: { enabled: false, start: "10:00", end: "14:00" },
  };

  const [availabilityByLocation, setAvailabilityByLocation] = useState<Record<string, typeof defaultSchedule>>({});

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  useEffect(() => {
    async function loadAvailability() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch("/api/agent/settings/availability", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load availability");

        const data = await res.json();
        if (data.locations && data.locations.length > 0) {
          setLocations(data.locations);
          setSelectedLocation(data.locations[0]);
          setAvailabilityByLocation(data.availabilityByLocation || {});
          setAppointmentLength(data.appointmentLength || "30");
        } else {
          // Initialize with default location if none exist
          setLocations(["Kelowna"]);
          setSelectedLocation("Kelowna");
          setAvailabilityByLocation({ Kelowna: defaultSchedule });
        }

        // Load calendar connections
        // Note: calendar_connections uses specialist_id, but agents might not have that
        // For now, we'll check if the user has any calendar connections
        try {
          const { data: { user } } = await supabaseClient.auth.getUser();
          if (user) {
            // Try to find connections by user id (might be in specialist_id or a different field)
            const { data: connections } = await supabaseClient
              .from("calendar_connections")
              .select("provider")
              .eq("specialist_id", user.id);

            if (connections && connections.length > 0) {
              setGoogleConnected(connections.some((c: any) => c.provider === "google"));
              setMicrosoftConnected(connections.some((c: any) => c.provider === "microsoft"));
            }
          }
        } catch (err) {
          // Calendar connections might not be set up for agents yet
          console.log("No calendar connections found");
        }
      } catch (err) {
        console.error("Error loading availability:", err);
        // Set defaults on error
        setLocations(["Kelowna"]);
        setSelectedLocation("Kelowna");
        setAvailabilityByLocation({ Kelowna: defaultSchedule });
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();

    // Check for calendar connection success message
    async function checkCalendarSuccess() {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const calendarConnected = urlParams.get("calendarConnected");
        const success = urlParams.get("success");
        
        if (calendarConnected && success) {
          const provider = calendarConnected === "google" ? "Google Calendar" : "Microsoft Calendar";
          alert(`✅ ${provider} connected successfully! Your appointments will now sync automatically.`);
          
          // Refresh calendar connection status
          const { data: { user } } = await supabaseClient.auth.getUser();
          if (user) {
            const { data: connections } = await supabaseClient
              .from("calendar_connections")
              .select("provider")
              .eq("specialist_id", user.id);
            
            if (connections) {
              setGoogleConnected(connections.some((c: any) => c.provider === "google"));
              setMicrosoftConnected(connections.some((c: any) => c.provider === "microsoft"));
            }
          }
          
          // Clean up URL
          window.history.replaceState({}, "", "/agent/settings");
        }
      }
    }
    
    checkCalendarSuccess();
  }, []);

  const addLocation = () => {
    if (newLocationName.trim() && !locations.includes(newLocationName.trim())) {
      const locationName = newLocationName.trim();
      setLocations([...locations, locationName]);
      setAvailabilityByLocation({
        ...availabilityByLocation,
        [locationName]: { ...defaultSchedule },
      });
      setSelectedLocation(locationName);
      setNewLocationName("");
      setShowAddLocation(false);
    }
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/agent/settings/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          locations,
          availabilityByLocation,
          appointmentLength,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save availability");
      }

      setSaveMessage({ type: "success", text: "Availability saved successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving availability:", err);
      setSaveMessage({ type: "error", text: err.message || "Failed to save availability" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-600">Loading availability...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl mb-2">Calendar & Availability</h2>
        <p className="text-gray-600 text-sm">Manage calendar connections and set your availability rules</p>
      </div>

      {/* Calendar Connections */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4">Calendar Connections</h3>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Google Calendar</div>
                {googleConnected && <div className="text-sm text-gray-500">Last synced: 2 minutes ago</div>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {googleConnected ? (
                <>
                  <Badge className="bg-neutral-100 text-neutral-800">Connected</Badge>
                  <button
                    onClick={async () => {
                      try {
                        const { data: { session } } = await supabaseClient.auth.getSession();
                        if (!session?.access_token) {
                          alert("Please log in to reconnect your calendar");
                          return;
                        }
                        // Disconnect first, then redirect to connect
                        await fetch("/api/integrations/google/disconnect", {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${session.access_token}`,
                          },
                        });
                        // Redirect to connect (will allow account selection)
                        window.location.href = `/api/integrations/google/connect?specialistId=${session.user.id}`;
                      } catch (err) {
                        console.error("Error reconnecting Google Calendar:", err);
                        alert("Failed to reconnect. Please try again.");
                      }
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    <RefreshCw size={14} />
                    Reconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const { data: { session } } = await supabaseClient.auth.getSession();
                      if (!session?.access_token) {
                        alert("Please log in to connect your calendar");
                        return;
                      }
                      // Redirect to connect (will allow account selection)
                      window.location.href = `/api/integrations/google/connect?specialistId=${session.user.id}`;
                    } catch (err) {
                      console.error("Error connecting Google Calendar:", err);
                      alert("Failed to connect. Please try again.");
                    }
                  }}
                  className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900"
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-sky-600" />
              </div>
              <div>
                <div className="font-medium">Microsoft Calendar</div>
                {microsoftConnected && <div className="text-sm text-gray-500">Last synced: 2 minutes ago</div>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {microsoftConnected ? (
                <>
                  <Badge className="bg-neutral-100 text-neutral-800">Connected</Badge>
                  <button
                    onClick={async () => {
                      try {
                        const { data: { session } } = await supabaseClient.auth.getSession();
                        if (!session?.access_token) {
                          alert("Please log in to reconnect your calendar");
                          return;
                        }
                        // Disconnect first, then redirect to connect
                        await fetch("/api/integrations/microsoft/disconnect", {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${session.access_token}`,
                          },
                        });
                        // Redirect to connect (will allow account selection)
                        window.location.href = `/api/integrations/microsoft/connect?specialistId=${session.user.id}`;
                      } catch (err) {
                        console.error("Error reconnecting Microsoft Calendar:", err);
                        alert("Failed to reconnect. Please try again.");
                      }
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    <RefreshCw size={14} />
                    Reconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const { data: { session } } = await supabaseClient.auth.getSession();
                      if (!session?.access_token) {
                        alert("Please log in to connect your calendar");
                        return;
                      }
                      // Redirect to connect (will allow account selection)
                      window.location.href = `/api/integrations/microsoft/connect?specialistId=${session.user.id}`;
                    } catch (err) {
                      console.error("Error connecting Microsoft Calendar:", err);
                      alert("Failed to connect. Please try again.");
                    }
                  }}
                  className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Note:</strong> This is connection management only. Soradin will only offer time slots that follow
            your availability rules AND do not conflict with your connected calendars.
          </div>
        </div>
      </div>

      {/* Availability Rules */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin size={18} className="text-neutral-800" />
              Availability Rules by Location
            </h3>
            <p className="text-sm text-gray-600 mt-1">Set different availability for each city you serve</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            {locations.map((location) => (
              <button
                key={location}
                onClick={() => setSelectedLocation(location)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLocation === location
                    ? "bg-neutral-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {location}
              </button>
            ))}
            {!showAddLocation ? (
              <button
                onClick={() => setShowAddLocation(true)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
              >
                <Plus size={16} />
                Add City
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") addLocation();
                  }}
                  placeholder="City name"
                  className="w-40"
                  autoFocus
                />
                <button
                  onClick={addLocation}
                  className="px-3 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddLocation(false);
                    setNewLocationName("");
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              <strong>Showing availability for {selectedLocation}.</strong> Set the days and hours when you're
              available to serve clients in this location.
            </p>
          </div>

          <div className="mb-6">
            <Label className="mb-3 block">Weekly Availability</Label>
            <div className="space-y-2">
              {days.map((day) => {
                const dayData = availabilityByLocation[selectedLocation]?.[day as keyof typeof defaultSchedule] || defaultSchedule[day as keyof typeof defaultSchedule];
                return (
                  <div key={day} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg bg-white">
                    <input
                      type="checkbox"
                      checked={dayData.enabled}
                      onChange={(e) => {
                        setAvailabilityByLocation({
                          ...availabilityByLocation,
                          [selectedLocation]: {
                            ...availabilityByLocation[selectedLocation],
                            [day]: { ...dayData, enabled: e.target.checked },
                          },
                        });
                      }}
                      className="w-4 h-4 accent-neutral-800"
                    />
                    <div className="w-24 capitalize">{day}</div>
                    {dayData.enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={dayData.start}
                          onChange={(e) => {
                            setAvailabilityByLocation({
                              ...availabilityByLocation,
                              [selectedLocation]: {
                                ...availabilityByLocation[selectedLocation],
                                [day]: { ...dayData, start: e.target.value },
                              },
                            });
                          }}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={dayData.end}
                          onChange={(e) => {
                            setAvailabilityByLocation({
                              ...availabilityByLocation,
                              [selectedLocation]: {
                                ...availabilityByLocation[selectedLocation],
                                [day]: { ...dayData, end: e.target.value },
                              },
                            });
                          }}
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-md mt-6">
          <Label htmlFor="appointmentLength">Default Appointment Length</Label>
          <Select value={appointmentLength} onValueChange={setAppointmentLength} id="appointmentLength">
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </Select>
        </div>
      </div>

      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          saveMessage.type === "success" ? "bg-neutral-50 text-neutral-800" : "bg-red-50 text-red-800"
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveAvailability}
          disabled={saving}
          className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </div>
    </div>
  );
}

function PayoutsSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false);
  const [pricePerAppointment, setPricePerAppointment] = useState(29.0);
  const [currentMonthAppointments, setCurrentMonthAppointments] = useState(0);
  const [currentMonthTotal, setCurrentMonthTotal] = useState("0.00");
  const [pastPayments, setPastPayments] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const loadBilling = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return;

      // Load billing data
      const billingRes = await fetch("/api/agent/settings/billing", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!billingRes.ok) throw new Error("Failed to load billing data");

      const billingData = await billingRes.json();
      setPricePerAppointment(billingData.pricePerAppointment);
      setCurrentMonthAppointments(billingData.currentMonthAppointments);
      setCurrentMonthTotal(billingData.currentMonthTotal);
      setPastPayments(billingData.pastPayments || []);

      // Load payment methods
      const pmRes = await fetch("/api/agent/settings/payment-methods/list", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (pmRes.ok) {
        const pmData = await pmRes.json();
        setPaymentMethods(pmData.paymentMethods || []);
      }
    } catch (err) {
      console.error("Error loading billing:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();

    // Check for payment method success/cancel in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentMethodStatus = params.get('payment_method');
      
      if (paymentMethodStatus === 'success') {
        // Reload payment methods
        setTimeout(() => {
          loadBilling();
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname + '?tab=billing');
        }, 1000);
      } else if (paymentMethodStatus === 'cancelled') {
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname + '?tab=billing');
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-600">Loading billing data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl mb-2">Billing & Payments</h2>
        <p className="text-gray-600 text-sm">Manage your payment method and view billing history</p>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-4">Payment Method</h3>

        {paymentMethods.length === 0 ? (
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="font-medium">No payment method</div>
                <div className="text-sm text-gray-500">Add a payment method to get started</div>
              </div>
            </div>
            <button
              onClick={async () => {
                setAddingPaymentMethod(true);
                try {
                  const { data: { session } } = await supabaseClient.auth.getSession();
                  if (!session?.access_token) return;

                  const res = await fetch("/api/agent/settings/payment-methods/setup", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${session.access_token}`,
                    },
                  });

                  if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Failed to start payment method setup");
                  }

                  const data = await res.json();
                  if (data.url) {
                    window.location.href = data.url;
                  }
                } catch (err: any) {
                  console.error("Error setting up payment method:", err);
                  alert(err.message || "Failed to add payment method. Please try again.");
                  setAddingPaymentMethod(false);
                }
              }}
              disabled={addingPaymentMethod}
              className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingPaymentMethod ? "Loading..." : "Add Payment Method"}
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {paymentMethods.map((pm: any) => (
              <div key={pm.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)} •••• {pm.card.last4}
                    </div>
                    <div className="text-sm text-gray-500">
                      Expires {pm.card.exp_month}/{pm.card.exp_year}
                      {pm.isDefault && " • Default"}
                    </div>
                  </div>
                </div>
                {paymentMethods.length > 1 && (
                  <button
                    onClick={async () => {
                      if (!confirm("Are you sure you want to remove this payment method? You must have at least one payment method on file.")) {
                        return;
                      }
                      
                      try {
                        const { data: { session } } = await supabaseClient.auth.getSession();
                        if (!session?.access_token) return;

                        const res = await fetch("/api/agent/settings/payment-methods", {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${session.access_token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ paymentMethodId: pm.id }),
                        });

                        if (!res.ok) {
                          const error = await res.json();
                          throw new Error(error.error || "Failed to remove payment method");
                        }

                        // Reload payment methods
                        await loadBilling();
                      } catch (err: any) {
                        console.error("Error removing payment method:", err);
                        alert(err.message || "Failed to remove payment method. Please try again.");
                      }
                    }}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={async () => {
                setAddingPaymentMethod(true);
                try {
                  const { data: { session } } = await supabaseClient.auth.getSession();
                  if (!session?.access_token) return;

                  const res = await fetch("/api/agent/settings/payment-methods/setup", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${session.access_token}`,
                    },
                  });

                  if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Failed to start payment method setup");
                  }

                  const data = await res.json();
                  if (data.url) {
                    window.location.href = data.url;
                  }
                } catch (err: any) {
                  console.error("Error setting up payment method:", err);
                  alert(err.message || "Failed to add payment method. Please try again.");
                  setAddingPaymentMethod(false);
                }
              }}
              disabled={addingPaymentMethod}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingPaymentMethod ? "Loading..." : "Add Another Payment Method"}
            </button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <div className="text-sm text-blue-900">
            <strong>How billing works:</strong> You are charged ${pricePerAppointment.toFixed(2)} per appointment
            booked through the platform. Your saved payment method is automatically charged immediately when an appointment is confirmed.
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-4">Current Month</h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Calendar size={16} />
              Appointments Booked
            </div>
            <div className="text-2xl font-semibold">{currentMonthAppointments}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <DollarSign size={16} />
              Price Per Appointment
            </div>
            <div className="text-2xl font-semibold">${pricePerAppointment.toFixed(2)}</div>
          </div>

          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="text-sm text-gray-600 mb-1">Estimated Charge</div>
            <div className="text-2xl font-semibold text-neutral-800">${currentMonthTotal}</div>
            <div className="text-xs text-gray-500 mt-1">Charged immediately when appointments are booked</div>
          </div>
        </div>
      </div>

      {pastPayments.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Payment History</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Appointments</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pastPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{payment.date}</td>
                    <td className="px-4 py-3 text-sm">{payment.appointments}</td>
                    <td className="px-4 py-3 text-sm font-medium">{payment.amount}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge className="bg-neutral-100 text-neutral-800">{payment.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsSection({ email, phone }: { email: string; phone: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [agentEmail, setAgentEmail] = useState<string>("");
  const [notifications, setNotifications] = useState({
    newAppointment: { email: true, sms: false },
    appointmentCancelled: { email: true, sms: false },
    paymentReceived: { email: true },
    appointmentReminder: { email: true },
  });

  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user?.email) {
          setAgentEmail(user.email);
        }

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch("/api/agent/settings/notifications", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load notifications");

        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const handleSaveNotifications = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("/api/agent/settings/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ notifications }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save notifications");
      }

      setSaveMessage({ type: "success", text: "Notification preferences saved!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving notifications:", err);
      setSaveMessage({ type: "error", text: err.message || "Failed to save notifications" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  const notificationTypes = [
    {
      id: "newAppointment",
      label: "New Appointment Booked",
      description: "When a client books a new appointment with you",
    },
    {
      id: "appointmentCancelled",
      label: "Appointment Cancelled",
      description: "When a client cancels an existing appointment",
    },
  ];

  const toggleNotification = (type: string, channel: 'email' | 'sms') => {
    const currentSettings = notifications[type as keyof typeof notifications] as { email?: boolean; sms?: boolean };
    setNotifications({
      ...notifications,
      [type]: {
        ...currentSettings,
        [channel]: !currentSettings[channel],
      },
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl mb-2">Notifications</h2>
        <p className="text-gray-600 text-sm">Manage how you receive notifications about your appointments and account</p>
      </div>

      <div className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-600">Notification Type</span>
                  </div>
                </th>
                <th className="text-center py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Mail size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-600">Email</span>
                  </div>
                </th>
                <th className="text-center py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <Smartphone size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-600">SMS</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {notificationTypes.map((type) => {
                const settings = notifications[type.id as keyof typeof notifications] as { email?: boolean; sms?: boolean };
                return (
                  <tr key={type.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-4 pr-4">
                      <div>
                        <div className="font-medium text-sm mb-1">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={settings.email ?? false}
                          onCheckedChange={() => toggleNotification(type.id, 'email')}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={settings.sms ?? false}
                          onCheckedChange={() => toggleNotification(type.id, 'sms')}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Mail size={18} className="text-gray-600" />
            <span className="font-medium text-sm">Email Notifications</span>
          </div>
          <p className="text-xs text-gray-600">
            Email notifications are sent to: <strong>{agentEmail || email || "Not set"}</strong>
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Smartphone size={18} className="text-gray-600" />
            <span className="font-medium text-sm">SMS Notifications</span>
          </div>
          <p className="text-xs text-gray-600">
            SMS notifications are sent to: <strong>{phone || "Not set"}</strong>
          </p>
          {!phone && (
            <p className="text-xs text-amber-600 mt-1">
              Add your phone number in your profile settings to enable SMS notifications
            </p>
          )}
        </div>
      </div>

      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          saveMessage.type === "success" ? "bg-neutral-50 text-neutral-800" : "bg-red-50 text-red-800"
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveNotifications}
          disabled={saving}
          className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

function SecuritySection() {
  const router = useRouter();
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);


  const handleUpdatePassword = async () => {
    setSaving(true);
    setPasswordMessage(null);

    try {
      if (passwordData.new !== passwordData.confirm) {
        setPasswordMessage({ type: "error", text: "New passwords do not match" });
        setSaving(false);
        return;
      }

      if (passwordData.new.length < 6) {
        setPasswordMessage({ type: "error", text: "Password must be at least 6 characters" });
        setSaving(false);
        return;
      }

      // Get user ID
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        setPasswordMessage({ type: "error", text: "Not authenticated" });
        setSaving(false);
        return;
      }

      const res = await fetch("/api/agent/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newPassword: passwordData.new,
          confirmPassword: passwordData.confirm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ current: "", new: "", confirm: "" });
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err: any) {
      console.error("Error updating password:", err);
      setPasswordMessage({ type: "error", text: err.message || "Failed to update password" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl mb-2">Security & Account</h2>
        <p className="text-gray-600 text-sm">Manage your account security and connected devices</p>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Lock size={18} />
          Change Password
        </h3>

        <div className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.current}
              onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
              className="mt-1"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              className="mt-1"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              className="mt-1"
              placeholder="Confirm new password"
            />
          </div>

          {passwordMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              passwordMessage.type === "success" ? "bg-neutral-50 text-neutral-800" : "bg-red-50 text-red-800"
            }`}>
              {passwordMessage.text}
            </div>
          )}

          <button
            onClick={handleUpdatePassword}
            disabled={saving}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="font-semibold mb-4 text-red-600 flex items-center gap-2">
          <AlertTriangle size={18} />
        </h3>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="mb-3">
            <div className="font-medium text-sm mb-1">Delete Account</div>
            <div className="text-sm text-gray-700">
              Once you delete your account, there is no going back. This will permanently delete:
            </div>
            <ul className="text-sm text-gray-700 list-disc list-inside mt-2 space-y-1">
              <li>Your profile and business information</li>
              <li>All appointment history</li>
              <li>Calendar connections</li>
              <li>Payout settings (pending payouts will still be processed)</li>
            </ul>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                <Trash2 size={16} />
                Delete My Account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from
                  our servers.
                  <br />
                  <br />
                  Any pending payouts will still be processed, but you will lose access to all appointment history and
                  calendar connections.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    try {
                      // Get the session token for authentication
                      const { data: { session } } = await supabaseClient.auth.getSession();
                      if (!session?.access_token) {
                        alert('You must be logged in to delete your account.');
                        return;
                      }

                      // Call the delete account API
                      const response = await fetch('/api/agent/delete-account', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`,
                        },
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        alert(data.error || 'Failed to delete account. Please try again or contact support.');
                        return;
                      }

                      // Account deleted successfully - sign out and redirect
                      await supabaseClient.auth.signOut();
                      router.push("/agent");
                    } catch (err) {
                      console.error("Error deleting account:", err);
                      alert('An error occurred while deleting your account. Please try again or contact support.');
                    }
                  }}
                >
                  Yes, Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function ProfileBioSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [generatedBio, setGeneratedBio] = useState<string | null>(null);

  useEffect(() => {
    loadBioData();
  }, []);

  async function loadBioData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('metadata, ai_generated_bio')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading bio data:', error);
        return;
      }
      setGeneratedBio(profile?.ai_generated_bio ?? null);
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

      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
      let accessToken = session?.access_token;
      if (!accessToken) {
        const { data: { session: refreshed }, error: refreshError } = await supabaseClient.auth.refreshSession();
        accessToken = refreshed?.access_token;
        if (!accessToken) {
          throw new Error(refreshError?.message || sessionError?.message || 'Not authenticated. Please log in again.');
        }
      } else {
        const { data: { session: refreshed } } = await supabaseClient.auth.refreshSession();
        if (refreshed?.access_token) accessToken = refreshed.access_token;
      }

      const res = await fetch('/api/agent/settings/bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          aiGeneratedBio: (generatedBio ?? '').trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to save bio');
      }

      setSaveMessage({ type: 'success', text: data.message || 'Bio saved. Your updates will appear on your public profile and in "Learn more about".' });

      // Reload so UI shows the saved values
      await loadBioData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save bio';
      const isNetworkError = message === 'Failed to fetch' || message.includes('NetworkError');
      setSaveMessage({
        type: 'error',
        text: isNetworkError
          ? 'Could not reach the server. Please check your connection and try again.'
          : message,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 mb-4"></div>
            <p className="text-sm text-gray-600">Loading bio information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Profile Bio</h2>
        <p className="text-gray-500 text-sm">Edit your bio below. It appears on your public profile and in search.</p>
      </div>

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.type === "success" ? "bg-neutral-50 text-neutral-800 border border-neutral-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <Textarea
          value={generatedBio ?? ''}
          onChange={(e) => setGeneratedBio(e.target.value || null)}
          className="w-full text-gray-900 placeholder:text-gray-400 border-0 rounded-none focus:ring-0 focus:ring-offset-0 min-h-[220px] resize-y text-sm leading-relaxed"
          rows={10}
          placeholder="Write your profile bio..."
        />
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
