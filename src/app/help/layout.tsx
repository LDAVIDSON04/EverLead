import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help - Soradin',
  description: 'Get help and support for using Soradin',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
