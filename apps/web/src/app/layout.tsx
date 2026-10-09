import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Toko Pakaian',
  description: 'Katalog, kasir, dan reservasi dalam satu platform',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
