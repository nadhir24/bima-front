export default function AboutLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<div className="min-h-screen bg-background font-sans antialiased justify-center">
				{children}
			</div>
		</section>
	);
}
