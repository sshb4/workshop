import type { Metadata } from "next";
import "./globals.css";

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
    default: "Buzz Financial",
    template: "%s | Booking",
  },
  description: "Book appointments with professional service providers. Find the perfect expert and schedule sessions that fit your needs.",
  keywords: ["booking", "appointments", "services", "professionals", "scheduling"],
  authors: [{ name: "Buzz Team" }],
  creator: "Buzz",
  publisher: "Buzz",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Buzz - Service Booking Platform",
    description: "Book appointments with professional service providers",
    url: "/",
    siteName: "Buzz",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Buzz - Service Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Buzz - Service Booking Platform",
    description: "Book appointments with professional service providers",
    images: ["/og-image.jpg"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/buzz-icon.png" type="image/png" />
        <link rel="shortcut icon" href="/buzz-icon.png" type="image/png" />
      </head>
      <body
        className="antialiased font-sans"
      >
        {children}
      </body>
    </html>
  );
}
