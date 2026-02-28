import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gamaliel Evals',
  description:
    'Open-source eval suite for the Gamaliel Public API. Evaluate biblical AI quality across theologies, profiles, and languages.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
