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
  'finding-a-provider': {
    'how-do-i-search-for-a-provider': {
      title: 'How do I search for a funeral planning professional?',
      content: `Finding the right funeral planning professional should feel simple and pressure free.

On Soradin, you can search for professionals by entering the type of support you are looking for, such as funeral pre planning, and then choosing your location. Soradin will show you verified professionals who serve your area and have availability to meet.

Each professional listed on Soradin has been reviewed before being added to the platform. This allows you to focus on finding someone who feels like the right fit, rather than worrying about credibility.

You are never required to book right away. Many families browse profiles, read about different approaches, and take their time before scheduling a conversation.`,
      relatedArticles: [
        { title: 'How do I filter providers by location?', slug: 'how-do-i-filter-by-location' },
        { title: 'What information is shown in provider profiles?', slug: 'what-information-in-provider-profiles' }
      ]
    },
    'how-do-i-filter-by-location': {
      title: 'How do I filter providers by location?',
      content: `Soradin allows you to search by city so you can find professionals who serve your community.

When entering a location, you can choose your city or region. Some professionals may also offer virtual appointments, which can be helpful if you are looking for flexibility or live outside a major centre.

If a professional works across multiple regions, their profile will clearly indicate this. You can always confirm location details directly with the provider before booking.

Filtering by location helps ensure you are connecting with someone who understands local practices and can guide you appropriately.`,
      relatedArticles: [
        { title: 'How do I search for a funeral planning professional?', slug: 'how-do-i-search-for-a-provider' },
        { title: 'What information is shown in provider profiles?', slug: 'what-information-in-provider-profiles' }
      ]
    },
    'what-information-in-provider-profiles': {
      title: 'What information is shown in provider profiles?',
      content: `Each provider profile on Soradin is designed to help you make an informed and comfortable decision.

Profiles may include professional background, areas of focus, years of experience, availability, and any additional information the provider chooses to share about their approach.

You may also see details such as whether appointments are offered in person, by phone, or through video calls. This allows you to choose a meeting style that feels right for you.

The goal of each profile is transparency, so you can understand who you are meeting before the conversation begins.`,
      relatedArticles: [
        { title: 'How do I read provider reviews?', slug: 'how-do-i-read-provider-reviews' },
        { title: 'How do I compare different providers?', slug: 'how-do-i-compare-providers' }
      ]
    },
    'how-do-i-read-provider-reviews': {
      title: 'How do I read provider reviews?',
      content: `Reviews on Soradin come from families who have completed appointments through the platform.

These reviews focus on the experience of the conversation, such as clarity, professionalism, and overall comfort. They are not intended to pressure or promote a particular outcome.

When reading reviews, look for comments that reflect values important to you, such as patience, clear explanations, or feeling supported.

Reviews are one tool to help guide your decision, but you are always encouraged to trust your own instincts as well.`,
      relatedArticles: [
        { title: 'What information is shown in provider profiles?', slug: 'what-information-in-provider-profiles' },
        { title: 'How do I compare different providers?', slug: 'how-do-i-compare-providers' }
      ]
    },
    'how-do-i-compare-providers': {
      title: 'How do I compare different providers?',
      content: `Soradin makes it easy to compare professionals side by side at your own pace.

You can review multiple profiles, check availability, read reviews, and note differences in experience or approach. There is no expectation to choose the first provider you see.

Some families book an initial conversation to learn more, while others take time to narrow down options before scheduling. Both approaches are completely fine.

Comparing providers is about finding someone you feel comfortable speaking with, not about making a final decision right away.`,
      relatedArticles: [
        { title: 'What information is shown in provider profiles?', slug: 'what-information-in-provider-profiles' },
        { title: 'How do I read provider reviews?', slug: 'how-do-i-read-provider-reviews' }
      ]
    }
  },
  'appointments': {
    'how-do-i-book-an-appointment': {
      title: 'How do I book an appointment?',
      content: `Booking an appointment on Soradin is simple and free for families.

Start by searching for a funeral planning professional based on your location and needs. Once you find a provider you feel comfortable with, you can view their availability and choose a time that works best for you.

After selecting a time, you will be asked to enter a few basic details to confirm your booking. No phone calls or back and forth emails are required.

Once booked, your appointment is reserved and your provider is notified automatically.`,
      relatedArticles: [
        { title: 'How do I cancel or reschedule an appointment?', slug: 'how-do-i-cancel-or-reschedule' },
        { title: 'What happens after I book an appointment?', slug: 'what-happens-after-booking' },
        { title: 'Are appointments free?', slug: 'are-appointments-free' }
      ]
    },
    'how-do-i-cancel-or-reschedule': {
      title: 'How do I cancel or reschedule an appointment?',
      content: `If you need to cancel or reschedule, you can do so directly through your Soradin account.

Simply log in, navigate to your appointment, and choose the option to cancel or reschedule. If rescheduling is available, you will be shown alternative times based on your provider's availability.

Soradin encourages early notice when possible so providers can offer the time to another family.`,
      relatedArticles: [
        { title: 'How do I book an appointment?', slug: 'how-do-i-book-an-appointment' },
        { title: 'What happens after I book an appointment?', slug: 'what-happens-after-booking' }
      ]
    },
    'what-happens-after-booking': {
      title: 'What happens after I book an appointment?',
      content: `After booking, you will receive a confirmation email with the details of your appointment.

Your provider is notified at the same time and will prepare for your conversation. If your appointment is virtual, instructions on how to join will be included. If it is in person, the location will be clearly listed.

You can review appointment details at any time by logging into your account.`,
      relatedArticles: [
        { title: 'How do I book an appointment?', slug: 'how-do-i-book-an-appointment' },
        { title: 'How do I receive appointment reminders?', slug: 'how-do-i-receive-reminders' }
      ]
    },
    'can-i-book-for-family-members': {
      title: 'Can I book appointments for family members?',
      content: `Yes. You can book an appointment on behalf of a family member.

When booking, simply enter the name and contact information of the person who will be attending. You may also attend the appointment together if that feels helpful.

Many families use Soradin to support parents, spouses, or loved ones who may prefer assistance with scheduling.`,
      relatedArticles: [
        { title: 'How do I book an appointment?', slug: 'how-do-i-book-an-appointment' }
      ]
    },
    'are-appointments-free': {
      title: 'Are appointments free?',
      content: `Yes. Booking an appointment through Soradin is free for families.

There is no cost to browse providers, read profiles, or schedule an initial conversation. Any future services or arrangements are discussed directly between you and the provider during your appointment.

Soradin's goal is to remove barriers so families can access support without pressure.`,
      relatedArticles: [
        { title: 'How do I book an appointment?', slug: 'how-do-i-book-an-appointment' }
      ]
    },
    'how-do-i-receive-reminders': {
      title: 'How do I receive appointment reminders?',
      content: `Soradin sends automatic reminders to help you stay informed.

You may receive email reminders before your appointment, and in some cases calendar notifications if you choose to add the appointment to your personal calendar.

These reminders are designed to reduce stress and ensure you never miss a scheduled conversation.`,
      relatedArticles: [
        { title: 'What happens after I book an appointment?', slug: 'what-happens-after-booking' }
      ]
    }
  },
  'privacy': {
    'how-does-soradin-handle-information': {
      title: 'How does Soradin handle my personal information?',
      content: `Soradin takes your privacy seriously and only uses your information to support your experience on the platform.

Your personal information is used to help you find providers, book appointments, and communicate clearly with the professionals you choose to work with. Soradin does not sell your personal data or use it for unrelated purposes.

Information is handled responsibly and in line with applicable privacy laws to ensure families feel safe using the platform during sensitive planning decisions.`,
      relatedArticles: [
        { title: 'What data does Soradin collect?', slug: 'what-data-does-soradin-collect' },
        { title: 'How is my information protected?', slug: 'how-is-information-protected' }
      ]
    },
    'what-data-does-soradin-collect': {
      title: 'What data does Soradin collect?',
      content: `Soradin collects only the information necessary to provide its services.

This may include your name, contact information, appointment details, and basic usage data such as how you interact with the platform. If you choose to book an appointment, limited information is shared with the provider you select so they can prepare for your conversation.

Soradin does not collect unnecessary personal details and avoids requesting information that is not relevant to booking or support.`,
      relatedArticles: [
        { title: 'How does Soradin handle my personal information?', slug: 'how-does-soradin-handle-information' },
        { title: 'Who has access to my information?', slug: 'who-has-access-to-information' }
      ]
    },
    'how-is-information-protected': {
      title: 'How is my information protected?',
      content: `Soradin uses industry standard security practices to protect your information.

This includes secure servers, encrypted connections, and controlled access to sensitive data. Only authorized systems and personnel can access information required to operate the platform.

While no online system can guarantee absolute security, Soradin is designed with safeguards to minimize risk and protect your privacy.`,
      relatedArticles: [
        { title: 'How does Soradin handle my personal information?', slug: 'how-does-soradin-handle-information' },
        { title: 'Who has access to my information?', slug: 'who-has-access-to-information' }
      ]
    },
    'who-has-access-to-information': {
      title: 'Who has access to my information?',
      content: `Access to your information is limited and purposeful.

The provider you book with will only see the details needed to conduct your appointment, such as your name, contact information, and appointment time. Soradin staff may access limited data when necessary to provide support or resolve technical issues.

Your information is never shared with other providers, advertisers, or third parties without a valid reason related to the service you requested.`,
      relatedArticles: [
        { title: 'What data does Soradin collect?', slug: 'what-data-does-soradin-collect' },
        { title: 'How is my information protected?', slug: 'how-is-information-protected' }
      ]
    }
  },
  'reviews': {
    'how-do-i-leave-a-review': {
      title: 'How do I leave a review?',
      content: `After your appointment, Soradin will invite you to share feedback about your experience.

You can leave a review by following the link sent to your email after your appointment or by signing into your Soradin account and visiting your appointment history. Reviews focus on your overall experience, communication, and professionalism of the provider.

Sharing a review helps other families feel more confident when choosing a professional and helps providers continue to improve the care they offer.`,
      relatedArticles: [
        { title: 'Can I edit or delete my review?', slug: 'can-i-edit-or-delete-review' },
        { title: 'How are reviews verified?', slug: 'how-are-reviews-verified' }
      ]
    },
    'can-i-edit-or-delete-review': {
      title: 'Can I edit or delete my review?',
      content: `Yes. You remain in control of the feedback you share.

If you need to update or remove a review, you can do so by logging into your Soradin account and accessing your submitted reviews. This allows you to make changes if your perspective evolves or if you feel something needs clarification.

Soradin believes reviews should reflect honest and thoughtful experiences, not permanent statements you cannot revisit.`,
      relatedArticles: [
        { title: 'How do I leave a review?', slug: 'how-do-i-leave-a-review' },
        { title: 'How are reviews verified?', slug: 'how-are-reviews-verified' }
      ]
    },
    'how-are-reviews-verified': {
      title: 'How are reviews verified?',
      content: `Soradin only allows reviews from families who have booked and completed an appointment through the platform.

This means every review is tied to a real interaction with a provider, helping maintain trust and authenticity across the platform. Reviews are not accepted from anonymous users or individuals who have not used Soradin to schedule an appointment.

This verification process helps ensure reviews are fair, relevant, and helpful to both families and professionals.`,
      relatedArticles: [
        { title: 'How do I leave a review?', slug: 'how-do-i-leave-a-review' },
        { title: 'Can I edit or delete my review?', slug: 'can-i-edit-or-delete-review' }
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
          <Link href={`/help/${categorySlug}`} className="text-[#1A1A1A] hover:underline">
            Return to {categoryTitle}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - compact */}
      <section className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0a0a0a] px-6 overflow-hidden py-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px),
                              repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
          }}></div>
        </div>
        <header className="relative z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base text-white font-medium leading-tight">Help Center</span>
              <Link href="/" className="block">
                <Image
                  src="/Soradin.png"
                  alt="Soradin logo"
                  width={360}
                  height={360}
                  className="h-10 w-auto brightness-0 invert"
                />
              </Link>
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
            <Link href="/help" className="hover:text-[#1A1A1A] transition-colors">All Collections</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/help/${categorySlug}`} className="hover:text-[#1A1A1A] transition-colors">{categoryTitle}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4">{article.title}</h1>
        
        <div className="prose prose-lg max-w-none mb-12">
          <div className="text-[#1A1A1A] leading-relaxed whitespace-pre-line">
            {article.content}
          </div>
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
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#1A1A1A] hover:bg-[#1A1A1A]/5 transition-all group"
                >
                  <span className="text-lg text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">
                    {related.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1A1A1A] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

      </article>
    </div>
  );
}
