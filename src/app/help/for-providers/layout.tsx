import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Provider Help - Soradin',
  description: 'Help and support resources for funeral professionals using Soradin',
};

export default function ProviderHelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
