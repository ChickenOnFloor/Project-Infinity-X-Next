import "./globals.css";

export const metadata = {
  title: "Project Infinity X",
  description:
    "Project Infinity X is a universal Roblox script hub. One key, every supported game.",
  // Open Graph / Social Media Meta Tags
  openGraph: {
    title: "Project Infinity X — Universal Script Hub",
    description:
      "Project Infinity X is a universal Roblox script hub. One key, every supported game.",
    url: "https://project-infinity-x.vercel.app",
    siteName: "Project Infinity X",
    images: [
      {
        url: "/image/logo1.jpg", // Path to your image in public folder
        width: 1200,
        height: 630,
        alt: "Project Infinity X — Universal Script Hub",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Project Infinity X — Universal Script Hub",
    description:
      "Project Infinity X is a universal Roblox script hub. One key, every supported game.",
    images: ["/image/logo1.jpg"],
  },
  // Additional meta tags
  icons: {
    icon: "/image/tabicon.png",
    shortcut: "/image/tabicon.png",
    apple: "/image/tabicon.png",
  },
  // Other optional tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
