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
  },
  'agent-solutions': {
    'what-features-available': {
      title: 'What features are available to agents?',
      content: `Soradin provides agents with tools designed to simplify scheduling, improve visibility, and support better conversations with families.

Core features include a public professional profile, online appointment booking, calendar syncing, automated reminders, appointment history, and secure communication. Agents can manage availability, service areas, and practice information all in one place.

Soradin is designed to support your existing workflow rather than replace it.`,
      relatedArticles: [
        { title: 'How do I track my performance?', slug: 'how-do-i-track-performance' },
        { title: 'How do I optimize my profile for visibility?', slug: 'how-do-i-optimize-profile' }
      ]
    },
    'how-do-i-track-performance': {
      title: 'How do I track my performance?',
      content: `Soradin allows you to view your appointment activity through your dashboard.

You can see upcoming and past appointments, booking trends, and engagement over time. This helps you understand when families are booking, how often appointments occur, and where interest is coming from.

Performance tracking is intended to provide insight, not pressure.`,
      relatedArticles: [
        { title: 'What features are available to agents?', slug: 'what-features-available' },
        { title: 'How do I optimize my profile for visibility?', slug: 'how-do-i-optimize-profile' }
      ]
    },
    'how-do-i-optimize-profile': {
      title: 'How do I optimize my profile for visibility?',
      content: `Your profile is one of the most important factors in helping families choose you.

Profiles that are complete, clear, and up to date tend to receive more bookings. Adding a professional photo, a thoughtful introduction, and accurate availability helps families feel confident before booking.

Keeping your profile current improves visibility across the platform.`,
      relatedArticles: [
        { title: 'How do I manage my bio?', slug: 'how-do-i-manage-bio' },
        { title: 'How do I showcase my specialties?', slug: 'how-do-i-showcase-specialties' },
        { title: 'How do I optimize for search results?', slug: 'how-do-i-optimize-search' }
      ]
    },
    'how-do-i-manage-bio': {
      title: 'How do I manage my bio?',
      content: `Your bio allows you to explain your approach in your own words.

You can update your bio at any time from your dashboard. Many professionals choose to describe their experience, philosophy, and how they support families through planning conversations.

A clear and welcoming bio helps families understand who they will be speaking with.`,
      relatedArticles: [
        { title: 'How do I optimize my profile for visibility?', slug: 'how-do-i-optimize-profile' },
        { title: 'How do I manage my professional information?', slug: 'how-do-i-manage-professional-info' }
      ]
    },
    'how-do-i-showcase-specialties': {
      title: 'How do I showcase my specialties?',
      content: `Soradin allows you to list areas of focus such as funeral pre planning, cremation planning, or other services you offer.

These specialties appear on your profile and help families understand whether your experience aligns with their needs. You can update specialties as your role or focus changes.

Specialties help families make informed choices without feeling overwhelmed.`,
      relatedArticles: [
        { title: 'How do I optimize my profile for visibility?', slug: 'how-do-i-optimize-profile' },
        { title: 'How do I manage my services?', slug: 'how-do-i-manage-services' }
      ]
    },
    'how-do-i-add-office-locations': {
      title: 'How do I add office locations?',
      content: `If you offer in person appointments, you can add one or more office locations through your dashboard.

Each location can include an address and appointment details so families know where meetings take place. You may also offer virtual appointments alongside in person options.

Accurate location information helps set clear expectations.`,
      relatedArticles: [
        { title: 'How do I set my service areas?', slug: 'how-do-i-set-service-areas' },
        { title: 'How do I manage my practice information?', slug: 'how-do-i-manage-practice' }
      ]
    },
    'how-do-i-manage-practice': {
      title: 'How do I manage my practice information?',
      content: `Practice information includes your affiliated funeral home or organization, service regions, and contact details.

This information can be edited at any time and helps families understand your professional context. Keeping practice information current ensures smoother communication and coordination.`,
      relatedArticles: [
        { title: 'How do I add office locations?', slug: 'how-do-i-add-office-locations' },
        { title: 'How do I set my service areas?', slug: 'how-do-i-set-service-areas' }
      ]
    },
    'how-do-i-set-service-areas': {
      title: 'How do I set my service areas?',
      content: `Service areas allow you to indicate where you are able to support families.

You can list cities, regions, or broader areas if you provide virtual services. This helps Soradin match families with professionals who can work with them regardless of location.

Service areas can be updated as your reach expands.`,
      relatedArticles: [
        { title: 'How do I add office locations?', slug: 'how-do-i-add-office-locations' },
        { title: 'How do I manage my practice information?', slug: 'how-do-i-manage-practice' }
      ]
    },
    'how-do-i-integrate-systems': {
      title: 'How do I integrate with my existing systems?',
      content: `Soradin is designed to work alongside your current tools.

You can sync your calendar to prevent double bookings and keep availability accurate. Soradin does not replace your internal systems and does not require you to change how you manage your practice.

Integration helps reduce manual work and scheduling conflicts.`,
      relatedArticles: [
        { title: 'What features are available to agents?', slug: 'what-features-available' },
        { title: 'How do I manage my account settings?', slug: 'how-do-i-manage-account-settings' }
      ]
    },
    'how-do-i-set-pricing': {
      title: 'How do I set my pricing?',
      content: `Pricing on Soradin is managed through the platform's billing structure.

Agents are not charged to create a profile or be listed. Fees apply only when appointments are completed or when optional features are enabled.

Pricing details are explained clearly during onboarding and can be reviewed at any time.`,
      relatedArticles: [
        { title: 'What features are available to agents?', slug: 'what-features-available' },
        { title: 'How do I manage my account settings?', slug: 'how-do-i-manage-account-settings' }
      ]
    },
    'how-do-i-manage-services': {
      title: 'How do I manage my services?',
      content: `You can manage the services you offer through your dashboard.

This includes updating appointment types, meeting formats, and availability. Managing services ensures families see accurate options when booking.

You remain in control of how and when appointments are offered.`,
      relatedArticles: [
        { title: 'How do I showcase my specialties?', slug: 'how-do-i-showcase-specialties' },
        { title: 'How do I optimize my profile for visibility?', slug: 'how-do-i-optimize-profile' }
      ]
    },
    'how-do-i-update-credentials': {
      title: 'How do I update my credentials?',
      content: `Credentials can be uploaded or updated securely through your agent dashboard.

This may include licensing, certifications, or professional documentation depending on your role. Keeping credentials current helps maintain trust and platform integrity.

Uploaded documents are reviewed as part of Soradin's verification process.`,
      relatedArticles: [
        { title: 'How do I manage my professional information?', slug: 'how-do-i-manage-professional-info' },
        { title: 'What features are available to agents?', slug: 'what-features-available' }
      ]
    },
    'how-do-i-manage-professional-info': {
      title: 'How do I manage my professional information?',
      content: `Professional information includes your name, role, background, and areas of expertise.

You can update this information at any time to reflect changes in your career or practice. Accurate professional information helps families feel informed before booking.`,
      relatedArticles: [
        { title: 'How do I manage my bio?', slug: 'how-do-i-manage-bio' },
        { title: 'How do I update my credentials?', slug: 'how-do-i-update-credentials' }
      ]
    },
    'how-do-i-optimize-search': {
      title: 'How do I optimize for search results?',
      content: `Profiles that are complete, active, and regularly updated tend to perform better.

Clear specialties, accurate service areas, and consistent availability improve how your profile appears in search results. Positive engagement and completed appointments also contribute to visibility.

Optimization is designed to reward clarity and reliability.`,
      relatedArticles: [
        { title: 'How do I optimize my profile for visibility?', slug: 'how-do-i-optimize-profile' },
        { title: 'How do I showcase my specialties?', slug: 'how-do-i-showcase-specialties' }
      ]
    },
    'how-do-i-manage-account-settings': {
      title: 'How do I manage my account settings?',
      content: `Account settings allow you to control notifications, visibility, calendar connections, and basic preferences.

You can adjust settings to match how you work and how often you wish to receive updates. Settings can be changed at any time.`,
      relatedArticles: [
        { title: 'What features are available to agents?', slug: 'what-features-available' },
        { title: 'How do I integrate with my existing systems?', slug: 'how-do-i-integrate-systems' }
      ]
    }
  },
  'settings': {
    'how-do-i-update-profile-settings': {
      title: 'How do I update my profile settings?',
      content: `You can update your profile settings at any time from your Soradin dashboard.

Profile settings include your public information such as your name, photo, bio, specialties, and visibility preferences. Keeping this information current helps families understand who you are before booking.

Changes to your profile are reflected immediately across the platform.`,
      relatedArticles: [
        { title: 'How do I manage my bio?', slug: 'how-do-i-manage-bio' },
        { title: 'How do I optimize my profile for visibility?', slug: 'how-do-i-optimize-profile' }
      ]
    },
    'how-do-i-change-password': {
      title: 'How do I change my password?',
      content: `To change your password, sign in to your Soradin account and navigate to your account settings.

From there, you can choose a new password and save your changes. For security reasons, Soradin may ask you to re authenticate before confirming the update.

If you forget your password, you can reset it using the password recovery option on the sign in page.`,
      relatedArticles: [
        { title: 'How do I manage my account security?', slug: 'how-do-i-manage-account-security' },
        { title: 'How do I update my contact information?', slug: 'how-do-i-update-contact-information' }
      ]
    },
    'how-do-i-manage-notification-preferences': {
      title: 'How do I manage my notification preferences?',
      content: `Soradin allows you to control how and when you receive notifications.

You can manage notification preferences in your account settings, including alerts for new appointments, cancellations, reminders, and updates. Adjusting these settings helps ensure you receive the information you need without unnecessary interruptions.`,
      relatedArticles: [
        { title: 'How do I manage my email preferences?', slug: 'how-do-i-manage-email-preferences' },
        { title: 'What notifications will I receive?', slug: 'what-notifications-will-i-receive' }
      ]
    },
    'how-do-i-update-contact-information': {
      title: 'How do I update my contact information?',
      content: `Your contact information can be updated through your account settings.

This includes your email address and phone number. Keeping contact details accurate ensures you receive appointment notifications and important platform updates without delay.

Changes take effect immediately once saved.`,
      relatedArticles: [
        { title: 'How do I change my password?', slug: 'how-do-i-change-password' },
        { title: 'How do I manage my notification preferences?', slug: 'how-do-i-manage-notification-preferences' }
      ]
    },
    'how-do-i-manage-account-security': {
      title: 'How do I manage my account security?',
      content: `Soradin takes account security seriously and provides tools to help protect your information.

You can manage security settings such as password updates and session activity through your account dashboard. It is recommended to use a strong password and update it periodically.

If you notice unusual activity, you should update your credentials and contact Soradin support.`,
      relatedArticles: [
        { title: 'How do I change my password?', slug: 'how-do-i-change-password' },
        { title: 'How do I update my contact information?', slug: 'how-do-i-update-contact-information' }
      ]
    },
    'how-do-i-manage-email-preferences': {
      title: 'How do I manage my email preferences?',
      content: `Email preferences allow you to control the types of messages you receive from Soradin.

You can choose to receive appointment notifications, system updates, or educational content. Transactional emails related to bookings and account activity will still be sent to ensure platform reliability.

Preferences can be updated at any time.`,
      relatedArticles: [
        { title: 'How do I manage my notification preferences?', slug: 'how-do-i-manage-notification-preferences' },
        { title: 'What notifications will I receive?', slug: 'what-notifications-will-i-receive' }
      ]
    },
    'how-do-i-update-practice-information': {
      title: 'How do I update my practice information?',
      content: `Practice information includes your affiliated organization, service locations, and appointment formats.

You can update this information through your dashboard to reflect changes in your role or availability. Accurate practice information helps families understand where and how meetings take place.`,
      relatedArticles: [
        { title: 'How do I add office locations?', slug: 'how-do-i-add-office-locations' },
        { title: 'How do I set my service areas?', slug: 'how-do-i-set-service-areas' }
      ]
    },
    'how-do-i-manage-billing-information': {
      title: 'How do I manage my billing information?',
      content: `Billing information can be reviewed and updated within your account settings.

Soradin does not charge for creating or maintaining a profile. Fees apply only for completed appointments or optional features. Billing history and payment details are available for your records.

If you have questions about billing, Soradin support can assist.`,
      relatedArticles: [
        { title: 'How do I set my pricing?', slug: 'how-do-i-set-pricing' },
        { title: 'How do I update my contact information?', slug: 'how-do-i-update-contact-information' }
      ]
    },
    'how-do-i-set-my-timezone': {
      title: 'How do I set my timezone?',
      content: `Your timezone can be set in your account preferences.

Setting the correct timezone ensures appointment times, reminders, and calendar syncing display accurately. This is especially important if you offer virtual appointments across regions.

Timezone changes take effect immediately.`,
      relatedArticles: [
        { title: 'How do I manage my calendar preferences?', slug: 'how-do-i-manage-calendar-preferences' },
        { title: 'How do I sync with external calendars?', slug: 'how-do-i-sync-with-external-calendars' }
      ]
    },
    'how-do-i-manage-calendar-preferences': {
      title: 'How do I manage my calendar preferences?',
      content: `Calendar preferences allow you to control how appointments appear and sync with your schedule.

You can adjust settings related to availability display, appointment formats, and calendar integrations. Managing these preferences helps prevent scheduling conflicts and keeps your calendar accurate.`,
      relatedArticles: [
        { title: 'How do I manage my calendar?', slug: 'how-do-i-manage-my-calendar' },
        { title: 'How do I manage my integration settings?', slug: 'how-do-i-manage-integration-settings' }
      ]
    },
    'how-do-i-configure-availability-settings': {
      title: 'How do I configure my availability settings?',
      content: `Availability settings determine when families can book appointments with you.

You can define working hours, recurring availability, and one time adjustments through your dashboard. Availability can be updated at any time to reflect changes in your schedule.

Soradin only shows families time slots you make available.`,
      relatedArticles: [
        { title: 'Can I set recurring availability?', slug: 'can-i-set-recurring-availability' },
        { title: 'How do I manage my calendar?', slug: 'how-do-i-manage-my-calendar' }
      ]
    },
    'how-do-i-manage-integration-settings': {
      title: 'How do I manage my integration settings?',
      content: `Integration settings allow you to connect Soradin with external tools such as your calendar.

Once connected, Soradin will automatically sync availability and block times that are already booked elsewhere. You can manage or disconnect integrations at any time through your dashboard.`,
      relatedArticles: [
        { title: 'How do I sync with external calendars?', slug: 'how-do-i-sync-with-external-calendars' },
        { title: 'How do I manage my calendar preferences?', slug: 'how-do-i-manage-calendar-preferences' }
      ]
    },
    'how-do-i-update-service-settings': {
      title: 'How do I update my service settings?',
      content: `Service settings let you control the types of appointments you offer.

This may include in person meetings, virtual appointments, or phone consultations. Updating service settings ensures families see accurate options when booking.

You remain in control of how services are presented.`,
      relatedArticles: [
        { title: 'How do I manage my services?', slug: 'how-do-i-manage-services' },
        { title: 'How do I add office locations?', slug: 'how-do-i-add-office-locations' }
      ]
    },
    'how-do-i-delete-my-account': {
      title: 'How do I delete my account?',
      content: `If you choose to stop using Soradin, you can request account deletion through your account settings or by contacting support.

Before deleting your account, ensure any upcoming appointments are addressed. Once an account is deleted, profile information and access will be removed in accordance with privacy guidelines.

Soradin support is available if you have questions before proceeding.`,
      relatedArticles: [
        { title: 'How do I manage my account security?', slug: 'how-do-i-manage-account-security' }
      ]
    }
  },
  'account-and-billing': {
    'how-does-billing-work': {
      title: 'How does billing work on Soradin?',
      content: `Soradin uses a simple, performance based billing approach.

Creating an account and being listed on Soradin is free. Agents are only billed when an appointment is completed or when optional paid features are enabled.

Billing is designed to be transparent so you always understand when and why a charge occurs. There are no long term contracts or upfront listing fees.`,
      relatedArticles: [
        { title: 'How do I update my payment method?', slug: 'how-do-i-update-payment-method' },
        { title: 'How do I view my billing history?', slug: 'how-do-i-view-billing-history' }
      ]
    },
    'how-do-i-update-payment-method': {
      title: 'How do I update my payment method?',
      content: `You can update your payment method at any time through your account settings.

Simply navigate to the billing section of your dashboard and enter new payment details. Updated payment information will be used for future charges.

Soradin does not store full payment information directly and uses secure payment processing.`,
      relatedArticles: [
        { title: 'How does billing work on Soradin?', slug: 'how-does-billing-work' },
        { title: 'What payment methods are accepted?', slug: 'what-payment-methods-accepted' }
      ]
    },
    'how-do-i-view-billing-history': {
      title: 'How do I view my billing history?',
      content: `Your billing history is available in the billing section of your dashboard.

This area shows past charges, dates, and descriptions so you can easily track activity over time. Billing history is provided for your records and transparency.`,
      relatedArticles: [
        { title: 'How does billing work on Soradin?', slug: 'how-does-billing-work' },
        { title: 'How do I download invoices?', slug: 'how-do-i-download-invoices' }
      ]
    },
    'how-do-i-download-invoices': {
      title: 'How do I download invoices?',
      content: `Invoices can be downloaded directly from your billing history.

Each invoice includes the date, amount, and description of the charge. This makes it easy to keep records for accounting or internal reporting.

Invoices are available for all completed transactions.`,
      relatedArticles: [
        { title: 'How do I view my billing history?', slug: 'how-do-i-view-billing-history' },
        { title: 'How do I update my billing address?', slug: 'how-do-i-update-billing-address' }
      ]
    },
    'what-payment-methods-accepted': {
      title: 'What payment methods are accepted?',
      content: `Soradin accepts major credit and debit cards.

All payments are processed securely through a trusted payment provider. Accepted payment methods may expand over time as the platform grows.

If you experience any issues with payment, Soradin support is available to help.`,
      relatedArticles: [
        { title: 'How do I update my payment method?', slug: 'how-do-i-update-payment-method' },
        { title: 'How does billing work on Soradin?', slug: 'how-does-billing-work' }
      ]
    },
    'how-do-i-update-billing-address': {
      title: 'How do I update my billing address?',
      content: `You can update your billing address through the billing section of your account settings.

Keeping your billing address current ensures invoices and records are accurate. Changes take effect immediately once saved.`,
      relatedArticles: [
        { title: 'How do I download invoices?', slug: 'how-do-i-download-invoices' },
        { title: 'How do I view my billing history?', slug: 'how-do-i-view-billing-history' }
      ]
    }
  },
  'performance-and-reporting': {
    'how-do-i-view-performance-metrics': {
      title: 'How do I view my performance metrics?',
      content: `Soradin provides a simple overview of your activity through your agent dashboard.

You can view information such as upcoming appointments, completed appointments, and overall booking activity. These metrics are designed to give you a clear sense of how families are engaging with your profile over time.

Performance metrics are meant to support reflection and improvement, not to pressure or rank professionals.`,
      relatedArticles: [
        { title: 'What reports are available?', slug: 'what-reports-are-available' },
        { title: 'How do I view my appointment trends?', slug: 'how-do-i-view-my-appointment-trends' }
      ]
    },
    'what-reports-are-available': {
      title: 'What reports are available?',
      content: `Soradin offers basic reports to help you understand your appointment activity.

Available reports may include appointment summaries, booking history, and time based trends. These reports are designed to be easy to read and useful for record keeping.

As Soradin evolves, additional reporting features may be introduced based on professional feedback.`,
      relatedArticles: [
        { title: 'How do I view my performance metrics?', slug: 'how-do-i-view-performance-metrics' },
        { title: 'How do I export my data?', slug: 'how-do-i-export-my-data' }
      ]
    },
    'how-do-i-export-my-data': {
      title: 'How do I export my data?',
      content: `You can export your appointment and activity data directly from your dashboard.

Exported data may include appointment dates, times, and statuses. This allows you to keep personal records or integrate information into your own systems if needed.

Data exports are provided in standard formats for ease of use.`,
      relatedArticles: [
        { title: 'What reports are available?', slug: 'what-reports-are-available' },
        { title: 'How do I view my appointment trends?', slug: 'how-do-i-view-my-appointment-trends' }
      ]
    },
    'how-do-i-view-my-appointment-trends': {
      title: 'How do I view my appointment trends?',
      content: `Appointment trends can be viewed through your dashboard over selected time periods.

This helps you see patterns such as when families are more likely to book or how your availability is being used. Understanding trends can help you adjust your schedule or availability in a way that suits your workflow.

Trends are presented clearly so you can quickly understand what is happening without needing technical expertise.`,
      relatedArticles: [
        { title: 'How do I view my performance metrics?', slug: 'how-do-i-view-performance-metrics' },
        { title: 'What reports are available?', slug: 'what-reports-are-available' }
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

      </article>
    </div>
  );
}
