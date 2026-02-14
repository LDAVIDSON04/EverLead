// Preload login illustration so it appears with first paint (no late pop-in)
export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="preload"
        href="/login-illustration.png"
        as="image"
      />
      {children}
    </>
  );
}
