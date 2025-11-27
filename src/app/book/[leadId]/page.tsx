import BookForm from './BookForm';
import { createClient } from '@supabase/supabase-js';

type Props = {
  params: { leadId: string };
};

export default async function BookPage({ params }: Props) {
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

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('id', params.leadId)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-sm text-gray-600">
          We couldn&apos;t find your request. Please try again later.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-red-600 mt-2">Error: {error.message}</p>
        )}
      </div>
    );
  }

  if (!lead) {
    console.error('Lead not found:', params.leadId);
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

