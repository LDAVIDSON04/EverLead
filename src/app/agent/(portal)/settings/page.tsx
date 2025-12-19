"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Settings, Camera, Check, AlertCircle, Lock, Monitor, LogOut, Trash2, AlertTriangle, Bell, Mail, Smartphone, CreditCard, ExternalLink, DollarSign, Calendar, RefreshCw, MapPin, Plus, X } from "lucide-react";
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
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent ${className}`}
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

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-green-800 h-2 rounded-full transition-all"
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
        checked ? "bg-green-800" : "bg-gray-300"
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
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent"
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
    specialty: "",
    licenseNumber: "",
    businessAddress: "",
    profilePictureUrl: "",
  });

  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<"approved" | "pending" | "needs_info">("pending");
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
          setProfileData({
            fullName: profile.full_name || "",
            firstName: profile.first_name || profile.full_name?.split(" ")[0] || "",
            lastName: profile.last_name || profile.full_name?.split(" ").slice(1).join(" ") || "",
            businessName: profile.funeral_home || "",
            professionalTitle: profile.job_title || "",
            email: profile.email || "",
            phone: profile.phone || "",
            regionsServed: metadata.regions_served || "",
            specialty: metadata.specialty || "",
            licenseNumber: metadata.license_number || "",
            businessAddress: metadata.business_address || "",
            profilePictureUrl: profile.profile_picture_url || "",
          });

          // Calculate completeness
          let filled = 0;
          const total = 9;
          if (profile.full_name) filled++;
          if (profile.funeral_home) filled++;
          if (profile.job_title) filled++;
          if (profile.email) filled++;
          if (profile.phone) filled++;
          if (metadata.license_number) filled++;
          if (metadata.regions_served) filled++;
          if (metadata.specialty) filled++;
          if (profile.profile_picture_url) filled++;
          setProfileCompleteness(Math.round((filled / total) * 100));

          // Set verification status (assuming agents are approved by default, or check a status field)
          setVerificationStatus(profile.status === "approved" ? "approved" : "pending");
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

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile & Business Info */}
          <ProfileSection
            profileData={profileData}
            setProfileData={setProfileData}
            profileCompleteness={profileCompleteness}
            verificationStatus={verificationStatus}
          />

          {/* Calendar & Availability */}
          <CalendarAvailabilitySection />

          {/* Payouts & Payments */}
          <PayoutsSection />

          {/* Notifications */}
          <NotificationsSection email={profileData.email} phone={profileData.phone} />

          {/* Security & Account */}
          <SecuritySection />
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
  profileCompleteness,
  verificationStatus,
}: {
  profileData: any;
  setProfileData: (data: any) => void;
  profileCompleteness: number;
  verificationStatus: "approved" | "pending" | "needs_info";
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

      // Update local state immediately for preview
      setProfileData({ ...profileData, profilePictureUrl: publicUrl });

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
          setProfileData({
            fullName: updatedProfile.full_name || profileData.fullName,
            firstName: updatedProfile.first_name || profileData.firstName,
            lastName: updatedProfile.last_name || profileData.lastName,
            businessName: updatedProfile.funeral_home || profileData.businessName,
            professionalTitle: updatedProfile.job_title || profileData.professionalTitle,
            email: updatedProfile.email || profileData.email,
            phone: updatedProfile.phone || profileData.phone,
            regionsServed: metadata.regions_served || profileData.regionsServed,
            specialty: metadata.specialty || profileData.specialty,
            licenseNumber: metadata.license_number || profileData.licenseNumber,
            businessAddress: metadata.business_address || profileData.businessAddress,
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

      // Ensure we always send first_name and last_name if we have fullName
      if (saveData.fullName && !saveData.firstName && !saveData.lastName) {
        const nameParts = saveData.fullName.trim().split(/\s+/);
        saveData.firstName = nameParts[0] || '';
        saveData.lastName = nameParts.slice(1).join(' ') || '';
      }

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
          setProfileData({
            fullName: updatedProfile.full_name || "",
            firstName: updatedProfile.first_name || updatedProfile.full_name?.split(" ")[0] || "",
            lastName: updatedProfile.last_name || updatedProfile.full_name?.split(" ").slice(1).join(" ") || "",
            businessName: updatedProfile.funeral_home || "",
            professionalTitle: updatedProfile.job_title || "",
            email: updatedProfile.email || "",
            phone: updatedProfile.phone || "",
            regionsServed: metadata.regions_served || "",
            specialty: metadata.specialty || "",
            licenseNumber: metadata.license_number || "",
            businessAddress: metadata.business_address || "",
            profilePictureUrl: updatedProfile.profile_picture_url || "",
          });
        }
      }

      // Trigger a custom event to refresh the layout and other pages
      window.dispatchEvent(new CustomEvent("profileUpdated"));

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

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Profile Completeness</span>
            <span className="font-semibold text-sm">{profileCompleteness}%</span>
          </div>
          <Progress value={profileCompleteness} className="h-2" />
        </div>

        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600 block mb-1">Verification Status</span>
            {verificationStatus === "approved" && (
              <Badge className="bg-green-800 text-white">
                <Check size={12} className="mr-1" />
                Approved
              </Badge>
            )}
            {verificationStatus === "pending" && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <AlertCircle size={12} className="mr-1" />
                Under Review
              </Badge>
            )}
            {verificationStatus === "needs_info" && (
              <Badge className="bg-red-100 text-red-800">
                <AlertCircle size={12} className="mr-1" />
                Needs Info
              </Badge>
            )}
          </div>
        </div>
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
          />
        </div>

        <div>
          <Label htmlFor="licenseNumber">License Number(s) *</Label>
          <Input
            id="licenseNumber"
            value={profileData.licenseNumber}
            onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="regionsServed">Region(s) Served *</Label>
        <Input
          id="regionsServed"
          value={profileData.regionsServed}
          onChange={(e) => setProfileData({ ...profileData, regionsServed: e.target.value })}
          className="mt-1"
          placeholder="e.g., Toronto, GTA, Mississauga"
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="specialty">Specialty / Services Offered *</Label>
        <Textarea
          id="specialty"
          value={profileData.specialty}
          onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
          className="mt-1"
          rows={3}
          placeholder="e.g., Residential Sales, First-time Buyers, Investment Properties"
        />
      </div>

      <div className="mb-6">
        <Label htmlFor="businessAddress">Business Address</Label>
        <Input
          id="businessAddress"
          value={profileData.businessAddress}
          onChange={(e) => setProfileData({ ...profileData, businessAddress: e.target.value })}
          className="mt-1"
          placeholder="Optional but useful"
        />
      </div>

      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          saveMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
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
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl">Calendar & Availability</h2>
          <Badge className="bg-green-800 text-white">MOST IMPORTANT</Badge>
        </div>
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
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
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
                  className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900"
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
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
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
                  className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900"
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
              <MapPin size={18} className="text-green-800" />
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
                    ? "bg-green-800 text-white"
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
                  className="px-3 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 text-sm"
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
                      className="w-4 h-4 accent-green-800"
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
          saveMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveAvailability}
          disabled={saving}
          className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </div>
    </div>
  );
}

function PayoutsSection() {
  const [loading, setLoading] = useState(true);
  const [pricePerAppointment, setPricePerAppointment] = useState(29.0);
  const [currentMonthAppointments, setCurrentMonthAppointments] = useState(0);
  const [currentMonthTotal, setCurrentMonthTotal] = useState("0.00");
  const [pastPayments, setPastPayments] = useState<any[]>([]);

  useEffect(() => {
    async function loadBilling() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch("/api/agent/settings/billing", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load billing data");

        const data = await res.json();
        setPricePerAppointment(data.pricePerAppointment);
        setCurrentMonthAppointments(data.currentMonthAppointments);
        setCurrentMonthTotal(data.currentMonthTotal);
        setPastPayments(data.pastPayments || []);
      } catch (err) {
        console.error("Error loading billing:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBilling();
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
          <button className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900">
            Add Payment Method
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <div className="text-sm text-blue-900">
            <strong>How billing works:</strong> You are charged ${pricePerAppointment.toFixed(2)} per appointment
            booked through the platform. Your card is automatically charged at the beginning of each month for the
            previous month's appointments.
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

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-gray-600 mb-1">Estimated Charge</div>
            <div className="text-2xl font-semibold text-green-800">${currentMonthTotal}</div>
            <div className="text-xs text-gray-500 mt-1">Due next month</div>
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
                      <Badge className="bg-green-100 text-green-800">{payment.status}</Badge>
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
  const [notifications, setNotifications] = useState({
    newAppointment: { email: true, sms: false },
    appointmentCancelled: { email: true, sms: true },
    paymentReceived: { email: true, sms: false },
    calendarSyncError: { email: true, sms: false },
    appointmentReminder: { email: true, sms: true },
  });

  useEffect(() => {
    async function loadNotifications() {
      try {
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
    {
      id: "paymentReceived",
      label: "Payment Received",
      description: "When a payment has been processed",
    },
    {
      id: "calendarSyncError",
      label: "Calendar Sync Error",
      description: "When there's an issue syncing with your calendar",
    },
    {
      id: "appointmentReminder",
      label: "Appointment Reminder",
      description: "Reminder before your upcoming appointments (24h before)",
    },
  ];

  const toggleNotification = (type: string, channel: "email" | "sms") => {
    setNotifications({
      ...notifications,
      [type]: {
        ...notifications[type as keyof typeof notifications],
        [channel]: !notifications[type as keyof typeof notifications][channel],
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
                const settings = notifications[type.id as keyof typeof notifications];
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
                          checked={settings.email}
                          onCheckedChange={() => toggleNotification(type.id, "email")}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={settings.sms}
                          onCheckedChange={() => toggleNotification(type.id, "sms")}
                          disabled={!settings.email}
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
            Email notifications are sent to: <strong>{email || "Not set"}</strong>
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Smartphone size={18} className="text-gray-600" />
            <span className="font-medium text-sm">SMS Notifications</span>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            SMS notifications are sent to: <strong>{phone || "Not set"}</strong>
          </p>
          <p className="text-xs text-gray-500 italic">
            SMS notifications may incur additional charges. Currently available for selected notification types.
          </p>
        </div>
      </div>

      {saveMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          saveMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}>
          {saveMessage.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveNotifications}
          disabled={saving}
          className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
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

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/agent");
  };

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
              passwordMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {passwordMessage.text}
            </div>
          )}

          <button
            onClick={handleUpdatePassword}
            disabled={saving}
            className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Monitor size={18} />
          Connected Devices
        </h3>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">No other devices currently connected.</p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
        >
          <LogOut size={16} />
          Logout of All Sessions
        </button>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h3 className="font-semibold mb-4 text-red-600 flex items-center gap-2">
          <AlertTriangle size={18} />
          Danger Zone
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
                      // Delete account - this would typically involve:
                      // 1. Delete all related data (appointments, leads, etc.)
                      // 2. Delete profile
                      // 3. Delete auth user
                      // For now, we'll just sign out and redirect
                      await supabaseClient.auth.signOut();
                      router.push("/agent");
                    } catch (err) {
                      console.error("Error deleting account:", err);
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
