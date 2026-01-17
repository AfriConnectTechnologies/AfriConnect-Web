import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AfriConnect - Africa\'s B2B Marketplace | Cross-Border Trade & Shipping',
  description: 'Connect with verified suppliers across Africa. Source products, handle cross-border logistics, customs, and secure payments. Join 10,000+ businesses trading on AfriConnect.',
  keywords: ['B2B marketplace', 'Africa trade', 'cross-border shipping', 'wholesale suppliers', 'African products', 'international trade'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // This root layout passes through to the [locale] layout
  // which handles the html/body tags with locale-specific lang attribute
  return children
}
