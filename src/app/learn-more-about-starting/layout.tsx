import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soradin For Agents",
  description: "Soradin removes friction by giving families a simple way to view an agent's availability and book a meeting directly online in just a few minutes.",
};

export default function LearnMoreAboutStartingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
