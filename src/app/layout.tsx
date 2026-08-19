import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aspen Search - Executive Search for Quantitative Finance & Tech',
  description: 'Placing software engineers, quantitative researchers, and AI/ML scientists since 2006.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}