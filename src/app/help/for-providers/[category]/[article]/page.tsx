"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

// Article content data - in a real app, this would come from a CMS or database
const articleContent: Record<string, Record<string, {
  title: string;
  content: string;
  relatedArticles?: Array<{ title: string; slug: string }>;
}>> = {
  'getting-started': {
    'how-do-i-create-an-agent-account': {
      title: 'How do I create an agent account?',
      content: `To create an agent account on Soradin, start by visiting the "List your specialty" or "For Specialists" section of the website.

You will be guided through a short onboarding process where you provide basic information about yourself, your role, and the services you offer. Once submitted, your account will be created and you will be able to begin setting up your profile and availability.

Soradin is designed to make onboarding simple, even if you are not familiar with online booking platforms.`,
      relatedArticles: [
        { title: 'What information do I need to provide?', slug: 'what-information-do-i-need' },
        { title: 'What are the account setup requirements?', slug: 'what-are-setup-requirements' }
      ]
    },
    'how-do-i-set-up-availability': {
      title: 'How do I set up my availability?',
      content: `Availability can be set directly from your agent dashboard after signing in.

You can choose the days and times you are open for appointments and adjust them at any time. Soradin syncs with your existing calendar to prevent double bookings and ensure families only see times that truly work for you.

You can offer in person appointments, virtual appointments, or both depending on your preferences.`,
      relatedArticles: [
        { title: 'How do I create an agent account?', slug: 'how-do-i-create-an-agent-account' },
        { title: 'How do I customize my profile?', slug: 'how-do-i-customize-profile' }
      ]
    },
    'what-information-do-i-need': {
      title: 'What information do I need to provide?',
      content: `To get started on Soradin, you will be asked to provide essential professional information so families can book with confidence.

This typically includes your name, role, area of expertise, service location, and professional background. You may also be asked to upload credentials or licensing information depending on your specialty.

Soradin only collects information necessary to support booking and trust between families and professionals.`,
      relatedArticles: [
        { title: 'How do I create an agent account?', slug: 'how-do-i-create-an-agent-account' },
        { title: 'How do I upload my credentials?', slug: 'how-do-i-upload-credentials' }
      ]
    },
    'how-do-i-customize-profile': {
      title: 'How do I customize my profile?',
      content: `Your profile is designed to reflect how you work and what makes your services unique.

You can customize your profile by adding a professional photo, a short introduction, your specialties, and details about how you support families. This helps families understand your approach before booking an appointment.

Profiles can be updated at any time as your role, availability, or services evolve.`,
      relatedArticles: [
        { title: 'How do I set up my availability?', slug: 'how-do-i-set-up-availability' },
        { title: 'How do I add my practice information?', slug: 'how-do-i-add-practice-info' }
      ]
    },
    'how-do-i-add-practice-info': {
      title: 'How do I add my practice information?',
      content: `Practice information can be added within your agent dashboard.

This includes your affiliated funeral home or practice name, service areas, appointment locations, and any relevant contact details. Accurate practice information helps families understand where and how appointments take place.

Keeping this section up to date ensures smoother coordination and clearer expectations for everyone involved.`,
      relatedArticles: [
        { title: 'How do I customize my profile?', slug: 'how-do-i-customize-profile' },
        { title: 'How do I upload my credentials?', slug: 'how-do-i-upload-credentials' }
      ]
    },
    'how-do-i-upload-credentials': {
      title: 'How do I upload my credentials?',
      content: `Credentials can be uploaded securely through your agent dashboard.

You may be asked to provide proof of licensing, certifications, or professional designation depending on your specialty. Uploaded documents are reviewed as part of Soradin's commitment to maintaining a trusted network of professionals.

Your credentials are stored securely and are not shared publicly without your consent.`,
      relatedArticles: [
        { title: 'What information do I need to provide?', slug: 'what-information-do-i-need' },
        { title: 'What are the account setup requirements?', slug: 'what-are-setup-requirements' }
      ]
    },
    'what-are-setup-requirements': {
      title: 'What are the account setup requirements?',
      content: `Account setup requirements are designed to ensure quality, trust, and clarity across the platform.

Agents must provide accurate professional information, agree to Soradin's terms, and complete the onboarding steps relevant to their specialty. Some roles may require credential review before being fully listed.

Once setup is complete, you can begin receiving bookings and managing appointments through Soradin.`,
      relatedArticles: [
        { title: 'How do I create an agent account?', slug: 'how-do-i-create-an-agent-account' },
        { title: 'How do I upload my credentials?', slug: 'how-do-i-upload-credentials' }
      ]
    }
  },
  'managing-appointments': {
    'how-do-i-view-my-appointments': {
      title: 'How do I view my appointments?',
      content: `You can view all upcoming appointments by logging into your Soradin agent dashboard.

Your appointments are displayed in a clear schedule view so you can quickly see dates, times, and appointment types. Clicking on an appointment will show additional details such as the family's name and meeting format.

This view updates automatically as appointments are booked, changed, or cancelled.`,
      relatedArticles: [
        { title: 'How do I manage my calendar?', slug: 'how-do-i-manage-my-calendar' },
        { title: 'How do I view appointment history?', slug: 'how-do-i-view-appointment-history' }
      ]
    },
    'how-do-i-manage-my-calendar': {
      title: 'How do I manage my calendar?',
      content: `Soradin provides a built in calendar that reflects your availability and scheduled appointments.

You can manage your calendar by adjusting your availability, blocking time when needed, and syncing with external calendars. The calendar is designed to reduce double bookings and keep everything in one place.

Changes you make are reflected immediately for families viewing your availability.`,
      relatedArticles: [
        { title: 'How do I view my appointments?', slug: 'how-do-i-view-my-appointments' },
        { title: 'How do I sync with external calendars?', slug: 'how-do-i-sync-with-external-calendars' },
        { title: 'Can I set recurring availability?', slug: 'can-i-set-recurring-availability' }
      ]
    },
    'how-do-i-sync-with-external-calendars': {
      title: 'How do I sync with external calendars?',
      content: `Soradin allows you to connect your existing calendar, such as Google or Outlook, to keep your schedule accurate.

Once connected, Soradin will automatically sync your availability and block times that are already booked elsewhere. This helps prevent conflicts and ensures families only see times that truly work for you.

You can disconnect or reconnect calendars at any time from your dashboard.`,
      relatedArticles: [
        { title: 'How do I manage my calendar?', slug: 'how-do-i-manage-my-calendar' },
        { title: 'What notifications will I receive?', slug: 'what-notifications-will-i-receive' }
      ]
    },
    'what-notifications-will-i-receive': {
      title: 'What notifications will I receive?',
      content: `Soradin sends notifications to keep you informed and prepared.

You will receive alerts when a new appointment is booked, when an appointment is updated, and when a cancellation occurs. Reminder notifications are also sent before scheduled appointments.

Notification preferences can be adjusted within your account settings.`,
      relatedArticles: [
        { title: 'How do I manage appointment reminders?', slug: 'how-do-i-manage-appointment-reminders' },
        { title: 'What happens when a patient cancels?', slug: 'what-happens-when-patient-cancels' }
      ]
    },
    'can-i-set-recurring-availability': {
      title: 'Can I set recurring availability?',
      content: `Yes. Soradin allows you to set recurring availability for regular working hours.

You can define days and times that repeat weekly, which helps keep your schedule consistent without needing frequent updates. You can still make one time changes whenever needed.

Recurring availability saves time and helps families see a reliable schedule.`,
      relatedArticles: [
        { title: 'How do I manage my calendar?', slug: 'how-do-i-manage-my-calendar' },
        { title: 'How do I sync with external calendars?', slug: 'how-do-i-sync-with-external-calendars' }
      ]
    },
    'how-do-i-manage-multiple-locations': {
      title: 'How do I manage multiple locations?',
      content: `If you serve families in more than one location, Soradin allows you to list multiple service areas.

You can indicate where in person appointments are available and whether virtual appointments are offered across regions. This helps families understand how and where meetings can take place.

Location details can be updated as your practice evolves.`,
      relatedArticles: [
        { title: 'How do I manage my calendar?', slug: 'how-do-i-manage-my-calendar' },
        { title: 'What information do I see about each appointment?', slug: 'what-information-about-each-appointment' }
      ]
    },
    'what-happens-when-patient-cancels': {
      title: 'What happens when a patient cancels?',
      content: `When a family cancels an appointment, you will be notified automatically.

The cancelled time slot becomes available again, allowing other families to book if you choose. Cancellation details can be viewed directly in your appointment history.

Soradin encourages families to provide notice when possible to respect your time.`,
      relatedArticles: [
        { title: 'What notifications will I receive?', slug: 'what-notifications-will-i-receive' },
        { title: 'How do I view appointment history?', slug: 'how-do-i-view-appointment-history' }
      ]
    },
    'how-do-i-view-appointment-history': {
      title: 'How do I view appointment history?',
      content: `Your appointment history is available in your agent dashboard.

This section shows past appointments along with relevant details such as dates, appointment type, and status. Reviewing appointment history can help with follow up, record keeping, and understanding booking patterns.

History is stored securely and accessible only to you.`,
      relatedArticles: [
        { title: 'How do I view my appointments?', slug: 'how-do-i-view-my-appointments' },
        { title: 'How do I export my appointment data?', slug: 'how-do-i-export-my-appointment-data' }
      ]
    },
    'how-do-i-manage-appointment-reminders': {
      title: 'How do I manage appointment reminders?',
      content: `Soradin automatically handles appointment reminders for both you and the family.

Reminders are sent before each scheduled appointment to reduce no shows and ensure everyone is prepared. You do not need to manually send reminders unless you choose to follow up personally.

Reminder timing may be adjusted in your notification settings.`,
      relatedArticles: [
        { title: 'What notifications will I receive?', slug: 'what-notifications-will-i-receive' },
        { title: 'How do I view my appointments?', slug: 'how-do-i-view-my-appointments' }
      ]
    },
    'what-information-about-each-appointment': {
      title: 'What information do I see about each appointment?',
      content: `Each appointment includes essential details to help you prepare.

This may include the family's name, contact information, appointment format, scheduled time, and any notes provided during booking. Only information relevant to the appointment is displayed.

Soradin keeps appointment information clear and organized so you can focus on the conversation.`,
      relatedArticles: [
        { title: 'How do I view my appointments?', slug: 'how-do-i-view-my-appointments' },
        { title: 'How do I manage multiple locations?', slug: 'how-do-i-manage-multiple-locations' }
      ]
    },
    'how-do-i-export-my-appointment-data': {
      title: 'How do I export my appointment data?',
      content: `Soradin allows you to export appointment data for your records.

From your dashboard, you can download appointment information in a file format suitable for reporting or internal tracking. Exported data may include dates, appointment types, and status.

This feature supports record keeping while maintaining privacy standards.`,
      relatedArticles: [
        { title: 'How do I view appointment history?', slug: 'how-do-i-view-appointment-history' },
        { title: 'How do I view my appointments?', slug: 'how-do-i-view-my-appointments' }
      ]
    }
  }
};

export default function ProviderArticlePage() {
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
          <Link href={`/help/for-providers/${categorySlug}`} className="text-[#0C6F3C] hover:underline">
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
        <header className="relative z-10 pt-2 pb-1">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0">
                <span className="text-lg text-white leading-tight">Help Center</span>
                <Link href="/" className="block -mt-1">
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
              <Link href="/learn-more-about-starting" className="text-sm text-white hover:text-gray-200 transition-colors">
                Soradin for Agents
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
            <Link href="/help/for-providers" className="hover:text-[#0C6F3C] transition-colors">All Collections</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/help/for-providers/${categorySlug}`} className="hover:text-[#0C6F3C] transition-colors">{categoryTitle}</Link>
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
            Learn more about managing your Soradin account, optimizing your profile, or getting the most out of our platform. 
            <Link href={`/help/for-providers/${categorySlug}`} className="text-[#0C6F3C] hover:underline ml-1">
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
                  href={`/help/for-providers/${categorySlug}/${related.slug}`}
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
