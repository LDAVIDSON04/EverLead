"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { User, MapPin, Calendar, FileText, MessageSquare, Info, ChevronRight } from 'lucide-react';

const categoryData: Record<string, {
  title: string;
  icon: any;
  articles: Array<{ id: string; title: string; slug: string }>;
}> = {
  'my-account': {
    title: 'My Account',
    icon: User,
    articles: [
      { id: '1', title: 'How do I create a Soradin account?', slug: 'how-do-i-create-a-soradin-account' },
      { id: '2', title: 'My account is locked. How do I get back into it?', slug: 'my-account-is-locked' },
      { id: '3', title: 'How do I reset my password?', slug: 'how-do-i-reset-my-password' },
      { id: '4', title: 'How do I change my account information?', slug: 'how-do-i-change-my-account-information' },
      { id: '5', title: 'How do I delete or deactivate my account?', slug: 'how-do-i-delete-my-account' },
      { id: '6', title: 'How do I update my profile?', slug: 'how-do-i-update-my-profile' },
      { id: '7', title: 'What information is required for my account?', slug: 'what-information-is-required' }
    ]
  },
  'finding-a-provider': {
    title: 'Finding a Provider',
    icon: MapPin,
    articles: [
      { id: '1', title: 'How do I search for a funeral planning professional?', slug: 'how-do-i-search-for-a-provider' },
      { id: '2', title: 'How do I filter providers by location?', slug: 'how-do-i-filter-by-location' },
      { id: '3', title: 'What information is shown in provider profiles?', slug: 'what-information-in-provider-profiles' },
      { id: '4', title: 'How do I read provider reviews?', slug: 'how-do-i-read-provider-reviews' },
      { id: '5', title: 'How do I compare different providers?', slug: 'how-do-i-compare-providers' }
    ]
  },
  'appointments': {
    title: 'Appointments',
    icon: Calendar,
    articles: [
      { id: '1', title: 'How do I book an appointment?', slug: 'how-do-i-book-an-appointment' },
      { id: '2', title: 'How do I cancel or reschedule an appointment?', slug: 'how-do-i-cancel-or-reschedule' },
      { id: '3', title: 'What happens after I book an appointment?', slug: 'what-happens-after-booking' },
      { id: '8', title: 'Can I book appointments for family members?', slug: 'can-i-book-for-family-members' },
      { id: '11', title: 'Are appointments free?', slug: 'are-appointments-free' },
      { id: '13', title: 'How do I receive appointment reminders?', slug: 'how-do-i-receive-reminders' },
      { id: '17', title: 'What is the cancellation policy?', slug: 'what-is-cancellation-policy' }
    ]
  },
  'privacy': {
    title: 'Privacy',
    icon: FileText,
    articles: [
      { id: '1', title: 'How does Soradin handle my personal information?', slug: 'how-does-soradin-handle-information' },
      { id: '2', title: 'What data does Soradin collect?', slug: 'what-data-does-soradin-collect' },
      { id: '3', title: 'How is my information protected?', slug: 'how-is-information-protected' },
      { id: '4', title: 'Can I opt out of data collection?', slug: 'can-i-opt-out-of-data-collection' },
      { id: '5', title: 'Who has access to my information?', slug: 'who-has-access-to-information' }
    ]
  },
  'reviews': {
    title: 'Reviews',
    icon: MessageSquare,
    articles: [
      { id: '1', title: 'How do I leave a review?', slug: 'how-do-i-leave-a-review' },
      { id: '2', title: 'Can I edit or delete my review?', slug: 'can-i-edit-or-delete-review' },
      { id: '3', title: 'How are reviews verified?', slug: 'how-are-reviews-verified' }
    ]
  },
  'about-soradin': {
    title: 'About Soradin',
    icon: Info,
    articles: [
      { id: '1', title: 'What is Soradin?', slug: 'what-is-soradin' },
      { id: '2', title: 'How does Soradin work?', slug: 'how-does-soradin-work' },
      { id: '3', title: 'Is Soradin free to use?', slug: 'is-soradin-free-to-use' },
      { id: '4', title: 'Who can use Soradin?', slug: 'who-can-use-soradin' },
      { id: '5', title: 'How do I contact Soradin support?', slug: 'how-do-i-contact-support' },
      { id: '6', title: 'Where is Soradin available?', slug: 'where-is-soradin-available' },
      { id: '7', title: 'How is Soradin different from other services?', slug: 'how-is-soradin-different' }
    ]
  }
};

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const category = categoryData[categorySlug];

  if (!category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Link href="/help" className="text-[#0C6F3C] hover:underline">
            Return to Help Center
          </Link>
        </div>
      </div>
    );
  }

  const Icon = category.icon;

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
            <span className="text-gray-900">{category.title}</span>
          </div>
        </div>
      </div>

      {/* Category Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#0C6F3C]/10 rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8 text-[#0C6F3C]" />
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
              href={`/help/${categorySlug}/${article.slug}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#0C6F3C] hover:bg-[#0C6F3C]/5 transition-all group"
            >
              <span className="text-lg text-[#1A1A1A] group-hover:text-[#0C6F3C] transition-colors">
                {article.title}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0C6F3C] transition-colors" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
