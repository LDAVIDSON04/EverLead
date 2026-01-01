// src/app/agent/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { Lock, User, Eye, EyeOff, Check } from "lucide-react";

type Mode = "login" | "signup";

export default function AgentLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [funeralHome, setFuneralHome] = useState("");
  const [licensedInProvince, setLicensedInProvince] = useState<"yes" | "no" | "">("");
  const [licensedFuneralDirector, setLicensedFuneralDirector] = useState<"yes" | "no" | "">("");
  const [notificationCities, setNotificationCities] = useState<Array<{city: string, province: string}>>([]);
  const [newCity, setNewCity] = useState("");
  const [newProvince, setNewProvince] = useState("BC");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Check for pre-filled signup data from create-account page
    if (typeof window !== 'undefined') {
      const signupData = sessionStorage.getItem('signupData');
      if (signupData) {
        try {
          const data = JSON.parse(signupData);
          setEmail(data.email || '');
          setFullName(data.fullName || '');
          setPassword(data.password || '');
          setMode('signup');
          sessionStorage.removeItem('signupData');
        } catch (e) {
          console.error('Error parsing signup data:', e);
        }
      }
      
      // Load remembered credentials if they exist
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      const rememberedPassword = localStorage.getItem('rememberedPassword');
      if (rememberedEmail && rememberedPassword) {
        setEmail(rememberedEmail);
        setPassword(rememberedPassword);
        setRememberMe(true);
      }
    }

    // Always show login page - don't auto-redirect if already logged in
    // Agents must manually enter their credentials
    setLoading(false);

    // Check for calendar connection success message
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const calendarConnected = urlParams.get("calendarConnected");
      const message = urlParams.get("message");
      
      if (calendarConnected && message) {
        // Show success message
        setError(null); // Clear any errors
        // Store message to show after login
        sessionStorage.setItem('calendarConnected', calendarConnected);
        sessionStorage.setItem('calendarMessage', decodeURIComponent(message));
        
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signup") {
        if (!fullName || !email || !password || !confirmPassword || !phone || !funeralHome || !licensedInProvince || !licensedFuneralDirector) {
          setError("Please fill in all required fields.");
          setSubmitting(false);
          return;
        }

        if (password !== confirmPassword) {
          setError("Passwords do not match. Please try again.");
          setSubmitting(false);
          return;
        }

        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setSubmitting(false);
          return;
        }

        if (notificationCities.length === 0) {
          setError("Please add at least one city where you'd like to receive notifications.");
          setSubmitting(false);
          return;
        }

        const response = await fetch("/api/agent/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            phone,
            funeral_home: funeralHome,
            licensed_in_province: licensedInProvince === "yes",
            licensed_funeral_director: licensedFuneralDirector === "yes",
            notification_cities: notificationCities,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          let errorMessage = data.error || "Failed to create account. Please try again.";
          if (data.details && process.env.NODE_ENV === "development") {
            errorMessage += ` (${data.details})`;
          }
          setError(errorMessage);
          setSubmitting(false);
          return;
        }

        setShowSuccessModal(true);
        setSubmitting(false);
        
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setPhone("");
        setFuneralHome("");
        setLicensedInProvince("");
        setLicensedFuneralDirector("");
      } else {
        const { data, error: signInError } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError || !data.user) {
          console.error(signInError);
          setError(signInError?.message || "Invalid login credentials.");
          setSubmitting(false);
          return;
        }

        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("role, approval_status")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError || !profile) {
          console.error(profileError);
          setError("Failed to load profile.");
          setSubmitting(false);
          return;
        }

        if (profile.role === "agent" && profile.approval_status !== "approved") {
          setError("Your account is pending approval. You will receive an email when your account is approved.");
          setSubmitting(false);
          return;
        }

        if (profile.role === "admin") {
          // Save credentials if remember me is checked
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberedPassword', password);
          } else {
            // Clear saved credentials if remember me is unchecked
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
          }
          router.push("/admin/dashboard");
        } else {
          // Save credentials if remember me is checked
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberedPassword', password);
          } else {
            // Clear saved credentials if remember me is unchecked
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
          }
          router.push("/agent/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    if (!forgotPasswordEmail) {
      setError("Please enter your email address.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/agent/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email. Please try again.");
      } else {
        setForgotPasswordSent(true);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-200 flex items-center justify-center">
        <p className="text-sm text-zinc-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-200 p-8">
      <div className="w-full max-w-6xl">
        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden relative">
          {/* Logo at top left on desktop, top right on mobile */}
          <div className="absolute top-8 left-8 md:left-8 right-8 md:right-auto z-10">
            <Link href="/">
              <Image
                src="/Soradin.png"
                alt="Soradin Logo"
                width={96}
                height={96}
                className="h-16 w-16 md:h-24 md:w-24 object-contain"
              />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex items-center justify-center p-12 bg-gradient-to-br from-emerald-50 to-green-50">
              <div className="w-full h-full min-h-[600px] flex items-center justify-center">
                <Image
                  src="/login-illustration.png"
                  alt="Login Illustration"
                  width={1200}
                  height={1800}
                  className="w-full h-auto max-w-4xl"
                  quality={100}
                  priority
                  style={{ 
                    imageRendering: '-webkit-optimize-contrast', 
                    transform: 'scale(3) translateX(15%) translateY(1cm)'
                  }}
                />
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col p-8 lg:p-16 relative z-20">
              <h1 className="text-black mb-8 lg:mb-12 text-4xl lg:text-5xl font-bold text-left md:text-left text-right">
                {mode === "login" ? "Log In" : "Create Account"}
              </h1>

              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  {forgotPasswordSent ? (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-black">Check your email</h2>
                      <p className="text-sm text-zinc-600">
                        We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>. 
                        Please check your email and click the link to reset your password.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordSent(false);
                          setForgotPasswordEmail("");
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-14 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
                      >
                        Back to login
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold text-black">Reset your password</h2>
                      <p className="text-sm text-zinc-600">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                      <div className="relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                          <User className="h-5 w-5 text-zinc-600" />
                        </div>
                        <input
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-zinc-300 text-black focus:outline-none focus:border-emerald-700 transition-colors placeholder:text-zinc-400"
                          placeholder="Email"
                          required
                        />
                      </div>
                      {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                          <p className="text-xs text-red-600">{error}</p>
                        </div>
                      )}
                      <div className="pt-6 flex gap-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-14 py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {submitting ? "Sending..." : "Send reset link"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotPasswordEmail("");
                            setError(null);
                          }}
                          className="px-6 py-3 border-2 border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8 relative z-20">
                  {mode === "signup" && (
                    <>
                      <div className="relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                          <User className="h-5 w-5 text-zinc-600" />
                        </div>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-zinc-300 text-black focus:outline-none focus:border-emerald-700 transition-colors placeholder:text-zinc-400"
                          placeholder="Full name"
                          required
                        />
                      </div>

                      <div className="relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                          <User className="h-5 w-5 text-zinc-600" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-zinc-300 text-black focus:outline-none focus:border-emerald-700 transition-colors placeholder:text-zinc-400"
                          placeholder="Phone number"
                          required
                        />
                      </div>

                      <div className="relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                          <User className="h-5 w-5 text-zinc-600" />
                        </div>
                        <input
                          type="text"
                          value={funeralHome}
                          onChange={(e) => setFuneralHome(e.target.value)}
                          className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-zinc-300 text-black focus:outline-none focus:border-emerald-700 transition-colors placeholder:text-zinc-400"
                          placeholder="Funeral home or agency"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm text-zinc-700">Are you licensed in your province? *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="licensed_in_province"
                              value="yes"
                              checked={licensedInProvince === "yes"}
                              onChange={(e) => setLicensedInProvince(e.target.value as "yes" | "no")}
                              className="w-4 h-4 text-emerald-700"
                              required
                            />
                            <span className="text-sm text-zinc-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="licensed_in_province"
                              value="no"
                              checked={licensedInProvince === "no"}
                              onChange={(e) => setLicensedInProvince(e.target.value as "yes" | "no")}
                              className="w-4 h-4 text-emerald-700"
                              required
                            />
                            <span className="text-sm text-zinc-700">No</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm text-zinc-700">Are you a licensed funeral director? *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="licensed_funeral_director"
                              value="yes"
                              checked={licensedFuneralDirector === "yes"}
                              onChange={(e) => setLicensedFuneralDirector(e.target.value as "yes" | "no")}
                              className="w-4 h-4 text-emerald-700"
                              required
                            />
                            <span className="text-sm text-zinc-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="licensed_funeral_director"
                              value="no"
                              checked={licensedFuneralDirector === "no"}
                              onChange={(e) => setLicensedFuneralDirector(e.target.value as "yes" | "no")}
                              className="w-4 h-4 text-emerald-700"
                              required
                            />
                            <span className="text-sm text-zinc-700">No</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-zinc-200 pt-4">
                        <label className="block text-sm text-zinc-700">Which cities would you like to receive notifications for? *</label>
                        <p className="text-xs text-zinc-500">
                          You'll receive email notifications when new leads are posted in these cities.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            placeholder="City name"
                            className="flex-1 px-3 py-2 border-b-2 border-zinc-300 bg-transparent text-black focus:outline-none focus:border-emerald-700 placeholder:text-zinc-400"
                          />
                          <select
                            value={newProvince}
                            onChange={(e) => setNewProvince(e.target.value)}
                            className="w-24 px-3 py-2 border-b-2 border-zinc-300 bg-transparent text-black focus:outline-none focus:border-emerald-700"
                          >
                            <option value="BC">BC</option>
                            <option value="AB">AB</option>
                            <option value="SK">SK</option>
                            <option value="MB">MB</option>
                            <option value="ON">ON</option>
                            <option value="QC">QC</option>
                            <option value="NB">NB</option>
                            <option value="NS">NS</option>
                            <option value="PE">PE</option>
                            <option value="NL">NL</option>
                            <option value="YT">YT</option>
                            <option value="NT">NT</option>
                            <option value="NU">NU</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (newCity.trim()) {
                                const cityLower = newCity.trim().toLowerCase();
                                const provinceUpper = newProvince.toUpperCase();
                                const exists = notificationCities.some(
                                  c => c.city.toLowerCase() === cityLower && c.province.toUpperCase() === provinceUpper
                                );
                                if (!exists) {
                                  setNotificationCities([...notificationCities, { city: newCity.trim(), province: newProvince }]);
                                  setNewCity("");
                                } else {
                                  setError("This city is already in your list.");
                                }
                              }
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg transition-all"
                          >
                            Add
                          </button>
                        </div>
                        {notificationCities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {notificationCities.map((cityObj, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700"
                              >
                                {cityObj.city}, {cityObj.province}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNotificationCities(notificationCities.filter((_, i) => i !== index));
                                  }}
                                  className="text-zinc-500 hover:text-zinc-700"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Email Field */}
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                      <User className="h-5 w-5 text-zinc-600" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-transparent border-b-2 border-zinc-300 text-black focus:outline-none focus:border-emerald-700 transition-colors placeholder:text-zinc-400"
                      placeholder="Email"
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2">
                      <Lock className="h-5 w-5 text-zinc-600" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 pr-12 py-3 bg-transparent border-b-2 border-zinc-300 text-black focus:outline-none focus:border-emerald-700 transition-colors placeholder:text-zinc-400"
                      placeholder="Password"
                      required
                      minLength={6}
                    />
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-zinc-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-zinc-600" />
                      )}
                    </div>
                  </div>

                  {mode === "signup" && (
                    <div className="relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2">
                        <Lock className="h-5 w-5 text-zinc-600" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-8 pr-12 py-3 bg-transparent border-b-2 border-zinc-300 text-black focus:outline-none focus:border-emerald-700 transition-colors placeholder:text-zinc-400"
                        placeholder="Confirm password"
                        required
                        minLength={6}
                      />
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-zinc-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                    </div>
                  )}

                  {mode === "login" && (
                    <div className="flex items-center pt-2 relative z-20">
                      <div className="relative w-5 h-5">
                        <input
                          type="checkbox"
                          id="remember"
                          checked={rememberMe}
                          onChange={(e) => {
                            e.stopPropagation();
                            setRememberMe(e.target.checked);
                          }}
                          className="absolute inset-0 w-5 h-5 opacity-0 cursor-pointer z-10"
                          style={{ pointerEvents: 'auto' }}
                        />
                        <div 
                          className={`absolute inset-0 w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                            rememberMe 
                              ? 'bg-emerald-700 border-emerald-700' 
                              : 'bg-white border-zinc-400'
                          }`}
                          style={{ pointerEvents: 'none' }}
                        >
                          {rememberMe && (
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                      <label 
                        htmlFor="remember" 
                        className="ml-3 text-zinc-700 cursor-pointer relative z-20 select-none"
                        style={{ pointerEvents: 'auto' }}
                      >
                        Remember me
                      </label>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-6 relative z-20">
                    <button
                      type="submit"
                      disabled={submitting}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white px-14 py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed relative z-20"
                      style={{ pointerEvents: 'auto', zIndex: 20 }}
                    >
                      {submitting
                        ? "Please wait..."
                        : mode === "login"
                        ? "Log in"
                        : "Submit for approval"}
                    </button>
                  </div>
                </form>
              )}

              {/* Bottom Section */}
              <div className="pt-8">
                {mode === "login" && !showForgotPassword && (
                  <div className="space-y-2">
                    <p className="text-zinc-700 text-center">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signup");
                          setError(null);
                          setShowForgotPassword(false);
                        }}
                        className="text-emerald-700 hover:text-emerald-800 transition-colors underline"
                      >
                        create one now
                      </button>
                    </p>
                    <p className="text-zinc-700 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setError(null);
                        }}
                        className="text-emerald-700 hover:text-emerald-800 transition-colors underline"
                      >
                        Forgot password?
                      </button>
                    </p>
                  </div>
                )}
                {mode === "signup" && (
                  <p className="text-zinc-700 text-center">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                      }}
                      className="text-emerald-700 hover:text-emerald-800 transition-colors underline"
                    >
                      Log in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  Thank you for your request
                </h3>
                <p className="text-sm text-zinc-600 mb-6">
                  We will get back to you soon. Your account has been submitted for review. 
                  Our team will review your application and you will receive an email notification once 
                  your account has been approved. This typically takes 1-2 business days.
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setMode("login");
                  }}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg transition-all shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
