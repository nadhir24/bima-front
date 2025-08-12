export default function KatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-background font-sans antialiased">
      {children}
    </section>
  );
}
