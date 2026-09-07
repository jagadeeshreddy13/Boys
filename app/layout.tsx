import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Sri Srinivasa Hostel ERP',
  description: "Production-ready Hostel Management ERP for Sri Srinivasa Boys' Hostel in India, featuring admissions, room & bed allocation, automated billing, payment records, complaints, staff & visitor management, and resident portal.",
  openGraph: {
    title: 'Sri Srinivasa Hostel ERP',
    description: "Production-ready Hostel Management ERP for Sri Srinivasa Boys' Hostel in India, featuring admissions, room & bed allocation, automated billing, payment records, complaints, staff & visitor management, and resident portal.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sri Srinivasa Hostel ERP',
    description: "Production-ready Hostel Management ERP for Sri Srinivasa Boys' Hostel in India, featuring admissions, room & bed allocation, automated billing, payment records, complaints, staff & visitor management, and resident portal.",
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
