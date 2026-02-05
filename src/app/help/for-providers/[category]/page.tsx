"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Play, CalendarCheck, Shield, Settings, MessageSquare, DollarSign, BarChart3, Info, ChevronRight } from 'lucide-react';

const categoryData: Record<string, {
  title: string;
  icon: any;
  articles: Array<{ id: string; title: string; slug: string }>;
}> = {
  'getting-started': {
    title: 'Getting Started',
    icon: Play,
    articles: [
      { id: '1', title: 'How do I create an agent account?', slug: 'how-do-i-create-an-agent-account' },
      { id: '2', title: 'How do I set up my availability?', slug: 'how-do-i-set-up-availability' },
      { id: '3', title: 'What information do I need to provide?', slug: 'what-information-do-i-need' },
      { id: '4', title: 'How do I customize my profile?', slug: 'how-do-i-customize-profile' },
      { id: '5', title: 'How do I add my practice information?', slug: 'how-do-i-add-practice-info' },
      { id: '6', title: 'How do I upload my credentials?', slug: 'how-do-i-upload-credentials' },
      { id: '7', title: 'What are the account setup requirements?', slug: 'what-are-setup-requirements' }
    ]
  },
  'managing-appointments': {
    title: 'Managing Appointments',
    icon: CalendarCheck,
    articles: [
      { id: '1', title: 'How do I view my appointments?', slug: 'how-do-i-view-my-appointments' },
      { id: '2', title: 'How do I manage my calendar?', slug: 'how-do-i-manage-my-calendar' },
      { id: '3', title: 'How do I sync with external calendars?', slug: 'how-do-i-sync-with-external-calendars' },
      { id: '4', title: 'What notifications will I receive?', slug: 'what-notifications-will-i-receive' },
      { id: '5', title: 'Can I set recurring availability?', slug: 'can-i-set-recurring-availability' },
      { id: '6', title: 'How do I manage multiple locations?', slug: 'how-do-i-manage-multiple-locations' },
      { id: '7', title: 'What happens when a patient cancels?', slug: 'what-happens-when-patient-cancels' },
      { id: '8', title: 'How do I view appointment history?', slug: 'how-do-i-view-appointment-history' },
      { id: '9', title: 'How do I manage appointment reminders?', slug: 'how-do-i-manage-appointment-reminders' },
      { id: '10', title: 'What information do I see about each appointment?', slug: 'what-information-about-each-appointment' },
      { id: '11', title: 'How do I export my appointment data?', slug: 'how-do-i-export-my-appointment-data' }
    ]
  },
  'advisor-solutions': {
    title: 'Advisor Solutions',
    icon: Shield,
    articles: [
      { id: '1', title: 'What features are available to agents?', slug: 'what-features-available' },
      { id: '2', title: 'How do I track my performance?', slug: 'how-do-i-track-performance' },
      { id: '3', title: 'How do I optimize my profile for visibility?', slug: 'how-do-i-optimize-profile' },
      { id: '4', title: 'How do I manage my bio?', slug: 'how-do-i-manage-bio' },
      { id: '5', title: 'How do I showcase my specialties?', slug: 'how-do-i-showcase-specialties' },
      { id: '6', title: 'How do I add office locations?', slug: 'how-do-i-add-office-locations' },
      { id: '7', title: 'How do I manage my practice information?', slug: 'how-do-i-manage-practice' },
      { id: '8', title: 'How do I set my service areas?', slug: 'how-do-i-set-service-areas' },
      { id: '9', title: 'How do I integrate with my existing systems?', slug: 'how-do-i-integrate-systems' },
      { id: '10', title: 'How do I set my pricing?', slug: 'how-do-i-set-pricing' },
      { id: '11', title: 'How do I manage my services?', slug: 'how-do-i-manage-services' },
      { id: '12', title: 'How do I update my credentials?', slug: 'how-do-i-update-credentials' },
      { id: '13', title: 'How do I manage my professional information?', slug: 'how-do-i-manage-professional-info' },
      { id: '14', title: 'How do I optimize for search results?', slug: 'how-do-i-optimize-search' },
      { id: '15', title: 'How do I manage my account settings?', slug: 'how-do-i-manage-account-settings' }
    ]
  },
  'settings': {
    title: 'Settings',
    icon: Settings,
    articles: [
      { id: '1', title: 'How do I update my profile settings?', slug: 'how-do-i-update-profile-settings' },
      { id: '2', title: 'How do I change my password?', slug: 'how-do-i-change-password' },
      { id: '3', title: 'How do I manage my notification preferences?', slug: 'how-do-i-manage-notification-preferences' },
      { id: '4', title: 'How do I update my contact information?', slug: 'how-do-i-update-contact-information' },
      { id: '5', title: 'How do I manage my account security?', slug: 'how-do-i-manage-account-security' },
      { id: '6', title: 'How do I manage my email preferences?', slug: 'how-do-i-manage-email-preferences' },
      { id: '7', title: 'How do I update my practice information?', slug: 'how-do-i-update-practice-information' },
      { id: '8', title: 'How do I manage my billing information?', slug: 'how-do-i-manage-billing-information' },
      { id: '9', title: 'How do I set my timezone?', slug: 'how-do-i-set-my-timezone' },
      { id: '10', title: 'How do I manage my calendar preferences?', slug: 'how-do-i-manage-calendar-preferences' },
      { id: '11', title: 'How do I configure my availability settings?', slug: 'how-do-i-configure-availability-settings' },
      { id: '12', title: 'How do I manage my integration settings?', slug: 'how-do-i-manage-integration-settings' },
      { id: '13', title: 'How do I update my service settings?', slug: 'how-do-i-update-service-settings' },
      { id: '14', title: 'How do I delete my account?', slug: 'how-do-i-delete-my-account' }
    ]
  },
  'patient-reviews': {
    title: 'Patient Reviews',
    icon: MessageSquare,
    articles: [
      { id: '1', title: 'How do I respond to patient reviews?', slug: 'how-do-i-respond-to-reviews' },
      { id: '2', title: 'How are reviews displayed on my profile?', slug: 'how-are-reviews-displayed' },
      { id: '3', title: 'Can I request reviews from patients?', slug: 'can-i-request-reviews' },
      { id: '4', title: 'How do I manage my review settings?', slug: 'how-do-i-manage-review-settings' }
    ]
  },
  'account-and-billing': {
    title: 'Account and Billing',
    icon: DollarSign,
    articles: [
      { id: '1', title: 'How does billing work on Soradin?', slug: 'how-does-billing-work' },
      { id: '2', title: 'How do I update my payment method?', slug: 'how-do-i-update-payment-method' },
      { id: '3', title: 'How do I view my billing history?', slug: 'how-do-i-view-billing-history' },
      { id: '4', title: 'How do I download invoices?', slug: 'how-do-i-download-invoices' },
      { id: '5', title: 'What payment methods are accepted?', slug: 'what-payment-methods-accepted' },
      { id: '6', title: 'How do I update my billing address?', slug: 'how-do-i-update-billing-address' }
    ]
  },
  'performance-and-reporting': {
    title: 'Performance and Reporting',
    icon: BarChart3,
    articles: [
      { id: '1', title: 'How do I view my performance metrics?', slug: 'how-do-i-view-performance-metrics' },
      { id: '2', title: 'What reports are available?', slug: 'what-reports-are-available' },
      { id: '3', title: 'How do I export my data?', slug: 'how-do-i-export-my-data' },
      { id: '4', title: 'How do I view my appointment trends?', slug: 'how-do-i-view-my-appointment-trends' }
    ]
  },
  'about-soradin': {
    title: 'About Soradin',
    icon: Info,
    articles: [
      { id: '1', title: 'What is Soradin?', slug: 'what-is-soradin' },
      { id: '2', title: 'How does Soradin work for agents?', slug: 'how-does-soradin-work-for-agents' },
      { id: '3', title: 'What are the benefits of using Soradin?', slug: 'what-are-benefits' },
      { id: '4', title: 'How do I get started as an agent?', slug: 'how-do-i-get-started' },
      { id: '5', title: 'What support is available?', slug: 'what-support-available' },
      { id: '6', title: 'How do I contact Soradin support?', slug: 'how-do-i-contact-support' }
    ]
  }
};

export default function ProviderCategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const category = categoryData[categorySlug];

  if (!category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Link href="/help/for-providers" className="text-[#1A1A1A] hover:underline">
            Return to Provider Help Center
          </Link>
        </div>
      </div>
    );
  }

  const Icon = category.icon;

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
            <Link href="/" className="block flex-shrink-0">
              <Image
                src="/Soradin.png"
                alt="Soradin logo"
                width={360}
                height={360}
                className="h-20 w-auto brightness-0 invert"
              />
            </Link>
            <span className="text-base text-white leading-tight">Help Center</span>
          </div>
        </header>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/help/for-providers" className="hover:text-[#1A1A1A] transition-colors">All Collections</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{category.title}</span>
          </div>
        </div>
      </div>

      {/* Category Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#1A1A1A]/10 rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8 text-[#1A1A1A]" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">{category.title}</h1>
            <p className="text-gray-600">{category.articles.length} articles</p>
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-2">
          {category.articles.map((article) => (
            <Link
              key={article.id}
              href={`/help/for-providers/${categorySlug}/${article.slug}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#1A1A1A] hover:bg-[#1A1A1A]/5 transition-all group"
            >
              <span className="text-lg text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">
                {article.title}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1A1A1A] transition-colors" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
