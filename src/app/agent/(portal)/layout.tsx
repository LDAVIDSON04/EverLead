'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { Home, Calendar, File, Mail, FileText, User, XCircle, Upload, X, Settings } from 'lucide-react';

type AgentLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  { href: '/agent/dashboard', label: 'Home', icon: Home },
  { href: '/agent/schedule', label: 'Schedule', icon: Calendar },
  { href: '/agent/my-appointments', label: 'Files', icon: File },
  { href: '/agent/settings', label: 'Settings', icon: Settings },
];

export default function AgentLayout({ children }: AgentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [userLastName, setUserLastName] = useState<string>('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    profile_picture_url: '',
    job_title: '',
    funeral_home: '',
  });
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Listen for profile updates
    const handleProfileUpdate = async () => {
      if (!mounted) return;
      
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          console.log('No user found in handleProfileUpdate');
          return;
        }

        console.log('Refreshing profile for user:', user.id);

        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('full_name, first_name, last_name, profile_picture_url, email, phone, funeral_home, job_title')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile in handleProfileUpdate:', profileError);
          return;
        }

        console.log('Profile data fetched:', {
          full_name: profile?.full_name,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          profile_picture_url: profile?.profile_picture_url,
        });

        if (profile && mounted) {
          setUserName(profile.full_name || 'Agent');
          setUserFirstName(profile.first_name || profile.full_name?.split(' ')[0] || 'Agent');
          setUserLastName(profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '');
          setProfilePictureUrl(profile.profile_picture_url || null);
          console.log('Profile state updated:', {
            userName: profile.full_name || 'Agent',
            firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'Agent',
            lastName: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
            pictureUrl: profile.profile_picture_url || null,
          });
        } else {
          console.log('No profile found for user:', user.id);
        }
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    async function checkApproval() {
      try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (!mounted) return;
        
        // Only redirect if we're CERTAIN there's no user
        if (userError || !user) {
          router.replace('/agent');
          return;
        }

        // Fetch profile with all necessary fields
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('role, full_name, first_name, last_name, profile_picture_url, onboarding_completed, email, phone, funeral_home, job_title')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

        // Only redirect if profile exists and role is explicitly NOT agent
        // Don't redirect if profile is null (might be creating)
        if (profile && profile.role !== 'agent') {
          router.replace('/agent');
          return;
        }

        // If profileError but we have a user, allow access (might be RLS issue)
        // Only block if we're certain they're not an agent
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
          // Don't redirect on error - allow access
        }

        // Success - set user name and allow render
        console.log('Profile loaded in layout:', {
          full_name: profile?.full_name,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          profile_picture_url: profile?.profile_picture_url,
          hasProfile: !!profile,
        });
        
        if (profile) {
          setUserName(profile.full_name || 'Agent');
          setUserFirstName(profile.first_name || profile.full_name?.split(' ')[0] || 'Agent');
          setUserLastName(profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '');
          setProfilePictureUrl(profile.profile_picture_url || null);
        } else {
          // If no profile, try to load it again after a short delay
          setTimeout(() => {
            handleProfileUpdate();
          }, 1000);
        }
        
        setCheckingAuth(false);

        // Check specialist status (non-blocking, async) - only if profile exists
        if (profile && mounted) {
          checkSpecialistStatus(profile, mounted);
        } else {
          // No profile yet - just allow access
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error('Error checking approval:', error);
        // On error, allow access rather than redirecting (prevents loops)
        setCheckingAuth(false);
      }
    }

    async function checkSpecialistStatus(profile: any, isMounted: boolean) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token || !isMounted) return;

        const specialistRes = await fetch('/api/specialists/me', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (!isMounted) return;
        
        if (specialistRes.ok) {
          const specialist = await specialistRes.json();
          if (specialist && isMounted) {
            // Check approval status from specialists table
            if (specialist.status !== 'approved') {
              setApprovalStatus(specialist.status || 'pending');
            } else {
              // Check if onboarding is needed
              if (!profile.onboarding_completed) {
                setShowOnboarding(true);
              }
            }
          }
        }
      } catch (fetchError) {
        // Silently fail - don't block access
      }
    }

    checkApproval();

    return () => {
      mounted = false;
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []); // Empty dependency array - only run once on mount

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/agent');
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingLoading(true);
    setOnboardingError(null);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      let profilePictureUrl = onboardingData.profile_picture_url;

      // Upload profile picture if a file was selected
      if (profilePictureFile) {
        profilePictureUrl = await uploadProfilePicture(profilePictureFile);
      }

      const res = await fetch('/api/agent/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profile_picture_url: profilePictureUrl,
          job_title: onboardingData.job_title,
          funeral_home: onboardingData.funeral_home,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save onboarding data');
      }

      // Close modal and reload to update profile
      setShowOnboarding(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Error submitting onboarding:', err);
      setOnboardingError(err.message || 'Failed to save. Please try again.');
    } finally {
      setOnboardingLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (approvalStatus && approvalStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-amber-900">Account Pending Approval</h2>
            <p className="mb-4 text-sm text-amber-800">
              {approvalStatus === 'pending' 
                ? "Your account is currently pending approval. Our team will review your application and you will receive an email notification once your account has been approved."
                : approvalStatus === 'declined'
                ? "Your account application has been declined. If you believe this is an error, please contact support."
                : "Your account status is being reviewed. Please check your email for updates."}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-black flex flex-col">
        {/* Logo - Top Left */}
        <div className="px-4 py-6">
          <Link href="/agent/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo - white.png"
              alt="Soradin Logo"
              width={80}
              height={80}
              className="h-20 w-20 object-contain"
            />
          </Link>
        </div>
        
        {/* Menu Items */}
        <nav className="flex-1 px-4">
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href === '/agent/dashboard#roi' && pathname === '/agent/dashboard');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                    isActive 
                      ? 'bg-green-900/30 text-white' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        
        {/* User Profile */}
        <div className="px-4 pb-6">
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={`${userFirstName} ${userLastName}`}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                onError={(e) => {
                  console.error("Error loading profile picture in nav:", profilePictureUrl);
                  // Show fallback instead of hiding
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector('.fallback-avatar')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-avatar w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center border-2 border-white/20';
                    fallback.innerHTML = `<span class="text-white text-xs font-semibold">${userFirstName?.[0]?.toUpperCase() || 'A'}${userLastName?.[0]?.toUpperCase() || ''}</span>`;
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center border-2 border-white/20">
                <span className="text-white text-xs font-semibold">
                  {userFirstName?.[0]?.toUpperCase() || 'A'}{userLastName?.[0]?.toUpperCase() || ''}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {userFirstName} {userLastName}
              </div>
              <div className="text-white/60 text-xs">Agent</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <XCircle size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Let's get started</h2>
              <button
                onClick={() => setShowOnboarding(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {profilePicturePreview ? (
                    <div className="relative">
                      <img
                        src={profilePicturePreview}
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePictureFile(null);
                          setProfilePicturePreview(null);
                          setOnboardingData({ ...onboardingData, profile_picture_url: '' });
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <User size={32} className="text-gray-400" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <Upload size={16} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={onboardingData.job_title}
                  onChange={(e) =>
                    setOnboardingData({ ...onboardingData, job_title: e.target.value })
                  }
                  placeholder="e.g., Funeral Director, Pre-need Specialist"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                />
              </div>

              {/* Funeral Home */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funeral Home <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={onboardingData.funeral_home}
                  onChange={(e) =>
                    setOnboardingData({ ...onboardingData, funeral_home: e.target.value })
                  }
                  placeholder="Name of funeral home"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                />
              </div>

              {onboardingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{onboardingError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={onboardingLoading}
                  className="flex-1 bg-green-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {onboardingLoading ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
