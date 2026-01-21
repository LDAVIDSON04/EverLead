"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ChevronRight, ArrowLeft } from 'lucide-react';

// Article content data - in a real app, this would come from a CMS or database
const articleContent: Record<string, Record<string, {
  title: string;
  content: string;
  relatedArticles?: Array<{ title: string; slug: string }>;
}>> = {
  'my-account': {
    'how-do-i-create-a-soradin-account': {
      title: 'How do I create a Soradin account?',
      content: `Anyone who schedules a visit with a provider must have a Soradin account.

Create one here, or at the top of Soradin.com, click Log in / Sign up. Or, once you've downloaded the app, select My account > Sign up from the bottom navigation bar. From there, enter your information to create your account.

If you don't want to make an account in advance, you'll be prompted to create one when you book an appointment.

Be sure to enter your legal first and last name, date of birth, and other relevant information. This information allows Soradin to create an appointment directly in a practice's calendar and verify your information.

Soradin uses secure authentication, which is simple and secure. Add a mobile phone number to get a login code sent to your phone. Or you can choose to get a login code sent to your email.`,
      relatedArticles: [
        { title: 'How do I reset my password?', slug: 'how-do-i-reset-my-password' },
        { title: 'How do I change my account information?', slug: 'how-do-i-change-my-account-information' },
        { title: 'How do I log in to Soradin?', slug: 'how-do-i-log-in' }
      ]
    },
    'my-account-is-locked': {
      title: 'My account is locked. How do I get back into it?',
      content: `If your account is locked, you can unlock it by following these steps:

1. Go to the login page
2. Click on "Forgot password" or "Account locked"
3. Enter your email address or phone number
4. Follow the instructions sent to your email or phone to unlock your account

If you continue to have issues, please contact our support team at support@soradin.com.`,
      relatedArticles: [
        { title: 'How do I reset my password?', slug: 'how-do-i-reset-my-password' },
        { title: 'How do I create a Soradin account?', slug: 'how-do-i-create-a-soradin-account' }
      ]
    },
    'how-do-i-reset-my-password': {
      title: 'How do I reset my password?',
      content: `To reset your password:

1. Go to the login page
2. Click "Forgot password"
3. Enter your email address or phone number
4. You'll receive a code via email or text message
5. Enter the code to reset your password

If you don't receive the code, check your spam folder or try requesting a new code.`,
      relatedArticles: [
        { title: 'My account is locked. How do I get back into it?', slug: 'my-account-is-locked' },
        { title: 'How do I create a Soradin account?', slug: 'how-do-i-create-a-soradin-account' }
      ]
    },
    'how-do-i-change-my-account-information': {
      title: 'How do I change my account information?',
      content: `To change your account information:

1. Log in to your Soradin account
2. Go to "My Account" or "Settings"
3. Click on the information you want to change
4. Update the details and save your changes

You can update your name, email address, phone number, and other personal information from your account settings.`,
      relatedArticles: [
        { title: 'How do I update my profile?', slug: 'how-do-i-update-my-profile' },
        { title: 'How do I create a Soradin account?', slug: 'how-do-i-create-a-soradin-account' }
      ]
    },
    'how-do-i-delete-my-account': {
      title: 'How do I delete or deactivate my account?',
      content: `To delete or deactivate your account:

1. Log in to your Soradin account
2. Go to "My Account" > "Settings"
3. Scroll down to "Account Management"
4. Click "Delete Account" or "Deactivate Account"
5. Follow the confirmation prompts

Please note: Deleting your account is permanent and cannot be undone. If you have upcoming appointments, you may need to cancel them first.`,
      relatedArticles: [
        { title: 'How do I change my account information?', slug: 'how-do-i-change-my-account-information' }
      ]
    },
    'how-do-i-update-my-profile': {
      title: 'How do I update my profile?',
      content: `To update your profile:

1. Log in to your Soradin account
2. Navigate to "My Profile" or "Profile Settings"
3. Click "Edit" on any section you want to update
4. Make your changes and click "Save"

You can update your profile picture, bio, contact information, and preferences from this page.`,
      relatedArticles: [
        { title: 'How do I change my account information?', slug: 'how-do-i-change-my-account-information' }
      ]
    },
    'what-information-is-required': {
      title: 'What information is required for my account?',
      content: `To create a Soradin account, you'll need to provide:

- Full legal name (first and last)
- Email address
- Phone number
- Date of birth
- Address (optional but recommended)

This information helps us verify your identity and ensure appointments are properly scheduled.`,
      relatedArticles: [
        { title: 'How do I create a Soradin account?', slug: 'how-do-i-create-a-soradin-account' }
      ]
    }
  },
  'appointments': {
    'how-do-i-book-an-appointment': {
      title: 'How do I book an appointment?',
      content: `Booking an appointment on Soradin is simple:

1. Search for a funeral planning professional in your area
2. Browse their profile, reviews, and availability
3. Select a date and time that works for you
4. Fill in your information
5. Confirm your appointment

You'll receive a confirmation email and can view your appointment in your account.`,
      relatedArticles: [
        { title: 'How do I cancel or reschedule an appointment?', slug: 'how-do-i-cancel-or-reschedule' },
        { title: 'What happens after I book an appointment?', slug: 'what-happens-after-booking' }
      ]
    }
  }
};

export default function ArticlePage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const articleSlug = params.article as string;
  
  const categoryTitle = categorySlug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const article = articleContent[categorySlug]?.[articleSlug];

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Link href={`/help/${categorySlug}`} className="text-[#0C6F3C] hover:underline">
            Return to {categoryTitle}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header & Hero Section Combined */}
      <section className="relative bg-gradient-to-br from-[#0C6F3C] to-[#0a5a2e] px-6 overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px),
                              repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
          }}></div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#0a5a2e] rounded-full opacity-30 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-[#0C6F3C] rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0a5a2e] rounded-full opacity-30 blur-3xl translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-[#0C6F3C] rounded-full opacity-20 blur-2xl"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 pt-3 pb-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-lg text-white font-medium leading-tight">Help Center</span>
                <Link href="/" className="block">
                  <Image
                    src="/Soradin.png"
                    alt="Soradin logo"
                    width={360}
                    height={360}
                    className="h-20 w-auto brightness-0 invert"
                  />
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-white hover:text-gray-200 transition-colors">
                Soradin
              </Link>
              <Link href="mailto:support@soradin.com" className="text-sm text-white hover:text-gray-200 transition-colors">
                Contact us
              </Link>
            </div>
          </div>
        </header>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/help" className="hover:text-[#0C6F3C] transition-colors">All Collections</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/help/${categorySlug}`} className="hover:text-[#0C6F3C] transition-colors">{categoryTitle}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4">{article.title}</h1>
        <p className="text-gray-500 text-sm mb-8">Updated over a year ago</p>
        
        <div className="prose prose-lg max-w-none mb-12">
          <div className="text-[#1A1A1A] leading-relaxed whitespace-pre-line">
            {article.content}
          </div>
        </div>

        {/* Have more questions? */}
        <div className="bg-gray-50 rounded-lg p-6 mb-12">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">Have more questions?</h2>
          <p className="text-gray-700 leading-relaxed">
            Learn how to make changes to your Soradin account, how to update your information, or what to do if your account is locked. 
            <Link href={`/help/${categorySlug}`} className="text-[#0C6F3C] hover:underline ml-1">
              Browse more articles in {categoryTitle}
            </Link>
          </p>
        </div>

        {/* Related Articles */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Related Articles</h2>
            <div className="space-y-2">
              {article.relatedArticles.map((related, index) => (
                <Link
                  key={index}
                  href={`/help/${categorySlug}/${related.slug}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#0C6F3C] hover:bg-[#0C6F3C]/5 transition-all group"
                >
                  <span className="text-lg text-[#1A1A1A] group-hover:text-[#0C6F3C] transition-colors">
                    {related.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0C6F3C] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Section */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Did this answer your question?</h3>
          <div className="flex items-center gap-4">
            <button className="text-3xl hover:scale-110 transition-transform" aria-label="No">😞</button>
            <button className="text-3xl hover:scale-110 transition-transform" aria-label="Somewhat">😐</button>
            <button className="text-3xl hover:scale-110 transition-transform" aria-label="Yes">😊</button>
          </div>
        </div>
      </article>
    </div>
  );
}
