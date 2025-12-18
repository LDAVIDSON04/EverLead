import BookForm from './BookForm';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ leadId: string }> | { leadId: string };
};

export default async function BookPage(props: Props) {
  // Handle both Next.js 15+ (Promise) and older versions (object)
  const params = await (props.params instanceof Promise ? props.params : Promise.resolve(props.params));
  const leadId = params.leadId;

  // Exclude reserved routes that should be handled by other pages
  // Use notFound() to let Next.js handle routing to the correct page
  const reservedRoutes = ['step1', 'step2', 'success', 'select-time', 'agent'];
  if (reservedRoutes.includes(leadId)) {
    notFound();
  }

  if (!leadId) {
    console.error('Missing leadId in params:', params);
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-sm text-gray-600">
          Invalid booking link. Please check your link and try again.
        </p>
      </div>
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-sm text-gray-600">
          Database configuration error. Please try again later.
        </p>
      </div>
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  console.log('Looking up lead with ID:', leadId);

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    console.error('Lead ID used:', leadId);
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-sm text-gray-600">
          We couldn&apos;t find your request. Please try again later.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-red-600 mt-2">Error: {error.message} (Code: {error.code})</p>
        )}
      </div>
    );
  }

  if (!lead) {
    console.error('Lead not found:', leadId);
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-sm text-gray-600">
          We couldn&apos;t find your request. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-4">
        Choose a time for your planning call
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        We&apos;ll connect you with a licensed pre-need specialist in the Okanagan at
        your chosen time. This call is free and no-obligation.
      </p>
      <BookForm leadId={lead.id} />
    </div>
  );
}

