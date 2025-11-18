import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';

// Temporarily removed Google Fonts due to network issues
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: {
    default: "Buzz Workshop - Learning & Service Booking",
    template: "%s | Buzz Workshop",
  },
  description: "Book workshops, lessons, and professional services with expert teachers. Find the perfect educator and schedule learning sessions that fit your needs.",
  keywords: ["workshop", "booking", "learning", "education", "teachers", "lessons", "appointments", "services", "professionals", "scheduling"],
  authors: [{ name: "Buzz Workshop Team" }],
  creator: "Buzz Workshop",
  publisher: "Buzz Workshop",
  applicationName: "Buzz Workshop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Buzz Workshop - Learning & Service Booking Platform",
    description: "Book workshops, lessons, and professional services with expert teachers",
    url: "/",
    siteName: "Buzz Workshop",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Buzz Workshop - Learning & Service Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buzz Workshop - Learning & Service Booking Platform",
    description: "Book workshops, lessons, and professional services with expert teachers",
    images: ["/og-image.jpg"],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Buzz Workshop",
    startupImage: [
      {
        url: "/apple-touch-icon.png",
        media: "screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Buzz Workshop",
    "application-name": "Buzz Workshop",
    "msapplication-TileColor": "#f59e0b",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#f59e0b",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicons */}
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="shortcut icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Buzz Workshop" />
        <meta name="application-name" content="Buzz Workshop" />
        <meta name="msapplication-TileColor" content="#f59e0b" />
        <meta name="theme-color" content="#f59e0b" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body
        className="antialiased font-sans"
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
