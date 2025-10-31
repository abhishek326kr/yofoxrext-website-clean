import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import { headers } from 'next/headers';
import './globals.css';
import { AppProviders } from './components/providers/AppProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://yoforex.net'),
  title: {
    default: 'YoForex - Expert Advisor Forum & EA Marketplace',
    template: '%s | YoForex',
  },
  description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins. #1 MT4/MT5 EA community.',
  keywords: ['forex forum', 'EA marketplace', 'Expert Advisor', 'MT4', 'MT5', 'forex trading', 'algorithmic trading'],
  authors: [{ name: 'YoForex' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yoforex.net',
    siteName: 'YoForex',
    title: 'YoForex - Expert Advisor Forum & EA Marketplace',
    description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YoForex',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YoForex - Expert Advisor Forum & EA Marketplace',
    description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'e91dbe03ac0e8a86',
    other: {
      'msvalidate.01': 'A5F52C377150D58660B161CD33E36F94',
      'seznam-wmt': 'gC30ex5zCD1Do4CA0NzAXCL9ysLkAGlz',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics 4 (gtag.js) - Loaded on all public pages */}
        {/* Admin/Dashboard routes have their own layouts that override this */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-LWZ81QCJMR" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LWZ81QCJMR');
            `,
          }}
        />
        
        {/* Google Tag Manager (Optional - requires NEXT_PUBLIC_GTM_ID env var) */}
        {gtmId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
      </head>
      <body className={inter.className}>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
