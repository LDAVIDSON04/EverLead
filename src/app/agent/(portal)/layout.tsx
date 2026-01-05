'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { Home, Calendar, File, Mail, User, XCircle, Upload, X, Settings, CreditCard, Menu } from 'lucide-react';
import { usePrefetchOnHover } from '@/lib/hooks/usePrefetch';

type AgentLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  { href: '/agent/dashboard', label: 'Home', icon: Home },
  { href: '/agent/schedule', label: 'Schedule', icon: Calendar },
  { href: '/agent/my-appointments', label: 'Files', icon: File },
  { href: '/agent/billing', label: 'Billing', icon: CreditCard },
  { href: '/agent/settings', label: 'Settings', icon: Settings },
];

// Component for nav links with prefetch on hover
function NavLinkWithPrefetch({ 
  href, 
  isActive, 
  icon: Icon, 
  label 
}: { 
  href: string; 
  isActive: boolean; 
  icon: any; 
  label: string;
}) {
  const prefetchHandler = usePrefetchOnHover(href);
  
  return (
    <Link
      href={href}
      prefetch={true}
      onMouseEnter={prefetchHandler}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
        isActive 
          ? 'bg-green-900/30 text-white' 
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span className="text-sm">{label}</span>
    </Link>
  );
}

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
  const [onboardingStatus, setOnboardingStatus] = useState<{
    needsOnboarding: boolean;
    hasPaymentMethod: boolean;
    hasAvailability: boolean;
    onboardingCompleted?: boolean;
  } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showPausedModal, setShowPausedModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Function to load profile data
    const loadProfileData = async () => {
      if (!mounted) return;
      
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
          return;
        }

        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('full_name, first_name, last_name, profile_picture_url, email, phone, funeral_home, job_title, metadata')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        if (profile && mounted) {
          setUserName(profile.full_name || 'Agent');
          setUserFirstName(profile.first_name || profile.full_name?.split(' ')[0] || 'Agent');
          setUserLastName(profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '');
          setProfilePictureUrl(profile.profile_picture_url || null);
          
          // Check if account is paused
          const metadata = profile.metadata || {};
          const paused = (metadata as any)?.paused_account === true;
          setIsPaused(paused);
          if (paused && mounted) {
            setShowPausedModal(true);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    // Listen for profile updates
    const handleProfileUpdate = (event: Event) => {
      // If event has profile picture URL, update immediately
      const customEvent = event as CustomEvent;
      if (customEvent?.detail?.profilePictureUrl) {
        setProfilePictureUrl(customEvent.detail.profilePictureUrl);
      }
      loadProfileData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    // Also listen for auth state changes to reload profile
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session && mounted) {
        // Reload profile when auth state changes (login, token refresh, etc.)
        loadProfileData();
      }
    });

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
          .select('role, full_name, first_name, last_name, profile_picture_url, email, phone, funeral_home, job_title, approval_status, metadata')
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
        if (profile) {
          setUserName(profile.full_name || 'Agent');
          setUserFirstName(profile.first_name || profile.full_name?.split(' ')[0] || 'Agent');
          setUserLastName(profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '');
          setProfilePictureUrl(profile.profile_picture_url || null);
          
          // Check if account is paused
          const metadata = profile.metadata || {};
          const paused = (metadata as any)?.paused_account === true;
          setIsPaused(paused);
          if (paused && mounted) {
            setShowPausedModal(true);
          }
        }
        
        setCheckingAuth(false);
        
        // After auth check, ensure profile data is loaded
        if (mounted) {
          loadProfileData();
        }

        // Check onboarding status for agents (non-blocking, async) - only if profile exists and is approved
        if (profile && profile.role === 'agent' && profile.approval_status === 'approved' && mounted) {
          checkAgentOnboarding(mounted);
        } else if (profile && profile.approval_status !== 'approved' && profile.approval_status !== 'pending') {
          // Handle declined status
          setApprovalStatus(profile.approval_status);
        }
      } catch (error) {
        console.error('Error checking approval:', error);
        // On error, allow access rather than redirecting (prevents loops)
        setCheckingAuth(false);
      }
    }

    async function checkAgentOnboarding(isMounted: boolean) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.access_token || !isMounted) return;

        const onboardingRes = await fetch('/api/agent/onboarding-status', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (!isMounted) return;
        
        if (onboardingRes.ok) {
          const status = await onboardingRes.json();
          console.log('[ONBOARDING-FRONTEND] Status received:', status);
          if (status && isMounted) {
            setOnboardingStatus(status);
            // CRITICAL: If needsOnboarding is false, never show the modal
            // Also check if both payment method and availability are present
            const shouldShow = status.needsOnboarding === true && !status.onboardingCompleted;
            console.log('[ONBOARDING-FRONTEND] shouldShow:', shouldShow, 'needsOnboarding:', status.needsOnboarding, 'onboardingCompleted:', status.onboardingCompleted);
            if (shouldShow) {
              setShowOnboarding(true);
            } else {
              setShowOnboarding(false);
            }
          }
        } else {
          console.error('[ONBOARDING-FRONTEND] Failed to fetch onboarding status:', onboardingRes.status);
        }
      } catch (fetchError) {
        // Silently fail - don't block access
        console.error('Error checking onboarding status:', fetchError);
      }
    }

    checkApproval();

    return () => {
      mounted = false;
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  // Note: Removed profile reload on navigation to improve performance
  // Profile data is loaded once on mount and updated via event listeners when needed

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
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:flex w-64 bg-black flex-col">
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
                <NavLinkWithPrefetch
                  key={item.href}
                  href={item.href}
                  isActive={isActive}
                  icon={Icon}
                  label={item.label}
                />
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

      {/* Mobile Header - Shows only on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-black z-50 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/agent/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo - white.png"
              alt="Soradin Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay - Shows only on mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-black w-64 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Logo */}
            <div className="px-4 py-4 border-b border-white/10">
              <Link href="/agent/dashboard" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <Image
                  src="/logo - white.png"
                  alt="Soradin Logo"
                  width={60}
                  height={60}
                  className="h-16 w-16 object-contain"
                />
              </Link>
            </div>
            
            {/* Menu Items */}
            <nav className="px-4 py-4">
              <div className="flex flex-col gap-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href === '/agent/dashboard#roi' && pathname === '/agent/dashboard');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
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
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 border-t border-white/10 pt-4">
              <div className="flex items-center gap-3 px-3 py-3 mb-2">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={`${userFirstName} ${userLastName}`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
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
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={16} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto md:ml-0 pt-16 md:pt-0">
        {children}
      </div>

      {/* Paused Account Modal */}
      {showPausedModal && isPaused && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-red-600">Account Paused</h2>
              <button
                onClick={() => setShowPausedModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-4">
                Your account has been temporarily paused because a payment could not be processed. You will not appear in search results until you update your payment method.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm font-medium mb-2">Action Required:</p>
                <ol className="text-red-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Go to the Billing section</li>
                  <li>Update your payment method</li>
                  <li>Once updated, we'll automatically charge any outstanding payments</li>
                  <li>Your account will be reactivated automatically</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/agent/billing"
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-center font-medium"
                onClick={() => setShowPausedModal(false)}
              >
                Update Payment Method
              </Link>
              <button
                onClick={() => setShowPausedModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && onboardingStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Finish Onboarding</h2>
              <button
                onClick={() => setShowOnboarding(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 text-sm mb-4">
                Please complete the following items to finish setting up your account:
              </p>

              <div className="space-y-3">
                {/* Availability Status */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                  onboardingStatus.hasAvailability 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    onboardingStatus.hasAvailability ? 'bg-green-600' : 'bg-gray-300'
                  }`}>
                    {onboardingStatus.hasAvailability && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Add Availability</div>
                    <div className="text-sm text-gray-600">Set your schedule and availability</div>
                  </div>
                  {!onboardingStatus.hasAvailability && (
                    <button
                      onClick={() => {
                        setShowOnboarding(false);
                        router.push('/agent/schedule?openAvailability=true');
                      }}
                      className="px-4 py-2 bg-green-800 text-white text-sm rounded-lg hover:bg-green-900"
                    >
                      Add
                    </button>
                  )}
                </div>

                {/* Payment Method Status */}
                <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                  onboardingStatus.hasPaymentMethod 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    onboardingStatus.hasPaymentMethod ? 'bg-green-600' : 'bg-gray-300'
                  }`}>
                    {onboardingStatus.hasPaymentMethod && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Add Payment Method</div>
                    <div className="text-sm text-gray-600">Required to receive appointments</div>
                  </div>
                  {!onboardingStatus.hasPaymentMethod && (
                    <button
                      onClick={() => {
                        setShowOnboarding(false);
                        router.push('/agent/settings?tab=billing');
                      }}
                      className="px-4 py-2 bg-green-800 text-white text-sm rounded-lg hover:bg-green-900"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>

            {onboardingStatus.hasPaymentMethod && onboardingStatus.hasAvailability && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 font-medium">
                  ✅ All set! Your account is fully set up.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={async () => {
                  // Mark onboarding as completed when user clicks "Continue"
                  if (onboardingStatus.hasPaymentMethod && onboardingStatus.hasAvailability) {
                    try {
                      const { data: { session } } = await supabaseClient.auth.getSession();
                      if (session?.access_token) {
                        const { data: { user } } = await supabaseClient.auth.getUser();
                        if (user) {
                          const { data: profile } = await supabaseClient
                            .from("profiles")
                            .select("metadata")
                            .eq("id", user.id)
                            .maybeSingle();
                          
                          await supabaseClient
                            .from("profiles")
                            .update({
                              metadata: {
                                ...(profile?.metadata || {}),
                                onboarding_completed: true,
                              },
                            })
                            .eq("id", user.id);
                        }
                      }
                    } catch (err) {
                      console.error("Error marking onboarding as completed:", err);
                    }
                  }
                  // Refresh onboarding status
                  const { data: { session } } = await supabaseClient.auth.getSession();
                  if (session?.access_token) {
                    const res = await fetch('/api/agent/onboarding-status', {
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                      },
                    });
                    const status = await res.json();
                    setOnboardingStatus(status);
                    if (!status.needsOnboarding || status.onboardingCompleted) {
                      setShowOnboarding(false);
                    }
                  }
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Refresh Status
              </button>
              {(onboardingStatus.hasPaymentMethod && onboardingStatus.hasAvailability) && (
                <button
                  onClick={async () => {
                    // Mark onboarding as completed when user clicks "Continue"
                    try {
                      const { data: { session } } = await supabaseClient.auth.getSession();
                      if (session?.access_token) {
                        const { data: { user } } = await supabaseClient.auth.getUser();
                        if (user) {
                          const { data: profile } = await supabaseClient
                            .from("profiles")
                            .select("metadata")
                            .eq("id", user.id)
                            .maybeSingle();
                          
                          await supabaseClient
                            .from("profiles")
                            .update({
                              metadata: {
                                ...(profile?.metadata || {}),
                                onboarding_completed: true,
                              },
                            })
                            .eq("id", user.id);
                        }
                      }
                    } catch (err) {
                      console.error("Error marking onboarding as completed:", err);
                    }
                    setShowOnboarding(false);
                  }}
                  className="flex-1 bg-green-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-900 transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
