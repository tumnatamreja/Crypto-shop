import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CryptoShop - Secure Marketplace',
  description: 'Anonymous crypto marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="cyber-grid">
        {children}
      </body>
    </html>
  )
}
