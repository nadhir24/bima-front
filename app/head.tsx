export default function Head() {
  return (
    <>
      {/* Preconnect to font sources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Preload critical fonts */}
      <link
        rel="preload"
        href="/fonts/inter-var-latin.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      
      {/* Preload critical images */}
      <link
        rel="preload"
        href="/kueultah.jpg"
        as="image"
        fetchPriority="high"
      />
      
      {/* Add DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="https://www.google.com" />
    </>
  )
} 